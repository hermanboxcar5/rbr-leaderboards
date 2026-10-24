# RBR Leaderboard — Vercel

## Deploy

1. Upload this project to GitHub and import it into Vercel (Framework Preset: Other).
2. Set the Vercel environment variable `RBR_LEADERBOARD_ID` to your actual RBR leaderboard ID. Optionally set `RBR_SEASON`.
3. Deploy. The frontend is static and the backend runs as `/api/leaderboard` serverless function.

## Important adapter notes

The exact `@jellycade/script` guest auth and leaderboard API signatures were not verified. Inspect the installed library and update `createGuest()` and `fetchPage()` in `api/leaderboard.js` if needed. The UI and serverless routing are complete, but API integration is not guaranteed until those signatures are matched.

Search currently filters **only the loaded page**, not every player globally. To support global display-name search, wire a server-side player-search API into the handler. Pagination assumes the leaderboard API accepts numeric pages; if it uses opaque cursors, implement cursor tracking and next/previous navigation instead.

Run locally with `npm install` and `npx vercel dev`.
