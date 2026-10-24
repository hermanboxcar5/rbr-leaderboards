import * as jelly from '@jellycade/script';
const IDS = { trophies: 'tankkings_trophies', points: 'tankkings_points' };

function extract(value, id) {
  // Support a direct record, Nakama RPC wrapped payload, and keyed responses.
  let data = value;
  if (data && typeof data === 'object' && typeof data.payload === 'string') {
    try { data = JSON.parse(data.payload); } catch { /* leave as is */ }
  }
  if (Array.isArray(data)) data = data.find(r =>
    String(r.owner_id ?? r.user_id ?? r.id ?? '') === id
  ) ?? data[0];
  if (data?.records && Array.isArray(data.records))
    data = data.records.find(r => String(r.owner_id ?? r.user_id ?? r.id ?? '') === id) ?? data.records[0];
  if (data?.[id]) data = data[id];
  if (!data || typeof data !== 'object') return null;
  const score = data.num_score ?? data.score ?? data.value;
  const rank = data.rank ?? data.position;
  if (score == null && rank == null) return null;
  return {
    score: score == null ? null : Number(score),
    rank: rank == null ? null : Number(rank)
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const id = String(req.query.id ?? '').trim();
  const season = Number(req.query.season ?? 60);
  if (!id || id.length > 200 || !Number.isSafeInteger(season) || season < 0 || season > 100000)
    return res.status(400).json({ error: 'Invalid player or season' });
  try {
    const client = new jelly.RBRClient('newguest');
    if (typeof client.leaderboardpos !== 'function') {
      return res.status(501).json({ error: 'Installed JellyScript version does not expose leaderboardpos()' });
    }
    const results = await Promise.allSettled(Object.entries(IDS).map(async ([key, board]) => {
      const raw = await client.leaderboardpos(board, String(season), [id]);
      return [key, extract(raw, id)];
    }));
    const stats = {};
    const errors = [];
    results.forEach((result, index) => {
      const key = Object.keys(IDS)[index];
      if (result.status === 'fulfilled') stats[result.value[0]] = result.value[1];
      else errors.push(`${key}: ${result.reason?.message || 'Request failed'}`);
    });
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return res.status(200).json({ id, season, stats, errors });
  } catch (error) {
    console.error('Player lookup failed:', error);
    return res.status(500).json({ error: error?.message || 'Player lookup failed' });
  }
}
