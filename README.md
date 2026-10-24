# RBR Leaderboard — Vercel

## Deploy

1. Upload this project to GitHub and import it into Vercel (Framework Preset: Other).
2. Set the Vercel environment variable `RBR_TROPHIES_ID` and `RBR_POINTS_ID` to the respective RBR leaderboard IDs. Optionally set `RBR_SEASON`.
3. Deploy. The frontend is static and the backend runs as `/api/leaderboard` serverless function.

## Important adapter notes

The exact `@jellycade/script` guest auth and leaderboard API signatures were not verified. Inspect the installed library and update `createGuest()` and `fetchPage()` in `api/leaderboard.js` if needed. The UI and serverless routing are complete, but API integration is not guaranteed until those signatures are matched.

Search currently filters **only the loaded page**, not every player globally. To support global display-name search, wire a server-side player-search API into the handler. Pagination now passes inclusive `from`/`to` ranking positions (1–50, 51–100, etc.) to the adapter. Confirm the method signature and whether its range endpoints are inclusive in your installed JellyScript version.

Run locally with `npm install` and `npx vercel dev`.
