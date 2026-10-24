import * as jelly from '@jellycade/script';

const IDS = { trophies: 'tankkings_trophies', points: 'tankkings_points' };
const SEASON = '60';
const PAGE_SIZE = 100;
const SEARCH_LIMIT = 10000;
const SEARCH_BATCH = 1000;
const CACHE_MS = 60_000;
const cache = new Map();

function guest() {
  return new jelly.RBRClient('newguest');
}

async function range(client, board, from, to) {
  // Documented JellyScript API: getLeaderboard(id, season, 'range', {from, to}).
  // 'from' is inclusive and 'to' is exclusive.
  const records = await client.getLeaderboard(IDS[board], SEASON, 'range', { from, to });
  if (!Array.isArray(records)) throw new Error('Unexpected getLeaderboard response (expected array)');
  return records.map((r, i) => ({
    id: String(r.owner_id ?? r.user_id ?? ''),
    name: String(r.username ?? r.display_name ?? r.metadata?.display_name ?? 'Unknown player'),
    rank: Number(r.rank ?? r.position ?? from + i),
    score: Number(r.num_score ?? r.score ?? 0)
  }));
}

async function searchIndex(board) {
  const saved = cache.get(board);
  if (saved && Date.now() - saved.time < CACHE_MS) return saved.records;
  if (saved?.promise) return saved.promise;
  const promise = (async () => {
    const client = guest();
    const records = [];
    // Fetch all top 10,000 using the documented exclusive 'to' bound.
    // Sequential calls avoid flooding the game API.
    for (let from = 1; from <= SEARCH_LIMIT; from += SEARCH_BATCH) {
      const batch = await range(client, board, from, Math.min(SEARCH_LIMIT + 1, from + SEARCH_BATCH));
      records.push(...batch);
      if (batch.length < SEARCH_BATCH) break;
    }
    cache.set(board, { records, time: Date.now() });
    return records;
  })();
  cache.set(board, { promise });
  try { return await promise; }
  catch (err) { cache.delete(board); throw err; }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const board = String(req.query.board ?? 'trophies');
  if (!Object.hasOwn(IDS, board)) return res.status(400).json({ error: 'Invalid leaderboard' });
  const page = Number(req.query.page ?? 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) return res.status(400).json({ error: 'Invalid page' });
  const query = String(req.query.search ?? '').trim().toLocaleLowerCase().slice(0, 80);
  try {
    let records, total, hasNext;
    if (query) {
      const index = await searchIndex(board);
      const matches = index.filter(r => r.name.toLocaleLowerCase().includes(query));
      total = matches.length;
      records = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
      hasNext = page * PAGE_SIZE < total;
    } else {
      const from = (page - 1) * PAGE_SIZE + 1;
      // Request one extra to accurately determine whether a next page exists.
      const batch = await range(guest(), board, from, from + PAGE_SIZE + 1);
      records = batch.slice(0, PAGE_SIZE);
      hasNext = batch.length > PAGE_SIZE;
      total = null;
    }
    res.setHeader('Cache-Control', query ? 's-maxage=60, stale-while-revalidate=120' : 's-maxage=30, stale-while-revalidate=60');
    return res.status(200).json({ board, page, pageSize: PAGE_SIZE, records, total, hasNext, searchScope: query ? 'top-10000' : null });
  } catch (err) {
    console.error('Leaderboard error:', err);
    return res.status(500).json({ error: err?.message || 'Leaderboard request failed' });
  }
}
