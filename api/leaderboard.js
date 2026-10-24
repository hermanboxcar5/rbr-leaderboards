import * as JellyModule from '@jellycade/script';

// Update these three adapter functions if your installed JellyScript version
// exposes a different constructor or leaderboard method signature.
async function createGuest() {
  const Jelly = JellyModule.default ?? JellyModule;
  const client = typeof Jelly === 'function' ? new Jelly() : Jelly;
  const rbr = client.rbr ?? client;
  if (typeof rbr.auth !== 'function') throw new Error('JellyScript RBR auth() was not found; update createGuest().');
  await rbr.auth('guest');
  return rbr;
}

async function fetchPage(rbr, leaderboard, season, from, to) {
  if (typeof rbr.leaderboard !== 'function') throw new Error('JellyScript leaderboard() was not found; update fetchPage().');
  // JellyScript range pagination: from and to are inclusive ranking positions.
  return rbr.leaderboard(leaderboard, season, from, to);
}

function normalize(result) {
  const records = Array.isArray(result) ? result : result?.records ?? result?.leaderboard?.records ?? result?.data?.records ?? [];
  return {
    records: records.map((r, i) => ({
      id: String(r.owner_id ?? r.ownerId ?? r.id ?? i),
      name: String(r.username ?? r.display_name ?? r.displayName ?? r.name ?? 'Unknown player'),
      rank: Number(r.rank ?? r.position ?? i + 1),
      score: Number(r.score ?? r.value ?? 0)
    })),
    nextCursor: result?.next_cursor ?? result?.nextCursor ?? null
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const board = String(req.query.board ?? 'trophies').toLowerCase();
  if (!['trophies', 'points'].includes(board)) return res.status(400).json({ error: 'Invalid leaderboard' });
  const leaderboard = board === 'trophies' ? process.env.RBR_TROPHIES_ID : process.env.RBR_POINTS_ID;
  const season = String(req.query.season ?? process.env.RBR_SEASON ?? '').trim();
  const from = Math.max(1, Math.min(500000, Number.parseInt(req.query.from, 10) || 1));
  const to = Math.min(500049, from + 49);
  const search = String(req.query.search ?? '').trim().toLowerCase().slice(0, 80);
  if (!leaderboard) return res.status(400).json({ error: `Set RBR_${board.toUpperCase()}_ID in Vercel environment variables.` });
  try {
    const rbr = await createGuest();
    const data = normalize(await fetchPage(rbr, leaderboard, season, from, to));
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return res.status(200).json({ ...data, board, from, to, records: search ? data.records.filter(r => r.name.toLowerCase().includes(search)) : data.records, searchScope: 'page' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err?.message ?? 'Leaderboard request failed' });
  }
}
