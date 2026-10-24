import * as jelly from '@jellycade/script';
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const id = String(req.query.id ?? '').trim();
  if (!id || id.length > 200) return res.status(400).json({ error: 'Invalid player ID' });
  try {
    const client = new jelly.RBRClient('newguest');
    const profiles = await client.getProfiles(id);
    if (!Array.isArray(profiles)) throw new Error('Unexpected getProfiles response');
    const profile = profiles.find(p => String(p.user_id) === id) ?? profiles[0];
    if (!profile) return res.status(404).json({ error: 'Player profile not found' });
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({ profile });
  } catch (error) {
    console.error('Profile lookup failed:', error);
    return res.status(500).json({ error: error?.message || 'Profile lookup failed' });
  }
}
