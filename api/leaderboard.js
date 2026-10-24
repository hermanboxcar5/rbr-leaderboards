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

async function fetchPage(rbr, leaderboard, season, page, pageSize) {
  // Adapt to the published pagination API if your version differs.
  if (typeof rbr.leaderboard !== 'function') throw new Error('JellyScript leaderboard() was not found; update fetchPage().');
  return rbr.leaderboard(leaderboard, season, { page, limit: pageSize });
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
  const leaderboard = String(req.query.leaderboard ?? process.env.RBR_LEADERBOARD_ID ?? '').trim();
  const season = String(req.query.season ?? process.env.RBR_SEASON ?? '').trim();
  const page = Math.max(1, Math.min(10000, Number.parseInt(req.query.page, 10) || 1));
  const search = String(req.query.search ?? '').trim().toLowerCase().slice(0, 80);
  if (!leaderboard) return res.status(400).json({ error: 'Set RBR_LEADERBOARD_ID in Vercel environment variables.' });
  try {
    const rbr = await createGuest();
    const data = normalize(await fetchPage(rbr, leaderboard, season, page, 50));
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return res.status(200).json({ ...data, page, records: search ? data.records.filter(r => r.name.toLowerCase().includes(search)) : data.records, searchScope: 'page' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err?.message ?? 'Leaderboard request failed' });
  }
}
