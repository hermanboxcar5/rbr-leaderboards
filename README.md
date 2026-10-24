# Rocket Bot Royale leaderboard — Vercel

Deploy this folder to Vercel. It uses `@jellycade/script` with `new jelly.RBRClient('newguest')` on the server.

- Trophy and point leaderboard IDs are hardcoded.
- Season selector defaults to season 60 (0–60 available; adjust UI options if new seasons are released).
- Range paging is 100 entries at a time.
- Search loads up to the top 10,000 for the selected board and season and caches it in memory for 60 seconds per serverless instance.
- Clicking a player opens a right-hand stats panel, backed by `/api/player`, which queries `leaderboardpos()` for both boards.

**API verification:** `leaderboardpos(leaderboard, season, players)` is based on the existing JellyScript usage discussed previously; the published package response structure could not be confirmed live. The endpoint reports unavailable fields rather than inventing them. More granular wins, kills, or account history need a separately documented profile/stats method. Vercel's 20-second function limit may be too short for cold top-10k searches.
