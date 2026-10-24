# RBR Leaderboard — Vercel

A dark-themed Rocket Bot Royale leaderboard built with `@jellycade/script`.

## Deploy

Import this directory into Vercel (Framework Preset: Other). No environment variables required. Run `npm install` and `npx vercel dev` locally.

## API

- Guest authentication: `new jelly.RBRClient('newguest')`
- Range: `getLeaderboard(id, '60', 'range', {from, to})`, where `from` is inclusive and `to` is exclusive.
- Leaderboards: `tankkings_trophies` and `tankkings_points`.
- Page size: 100.
- Search loads up to the top 10,000 players for the selected leaderboard and filters display names on the server. Results are paginated by 100.

Search index caching is in-memory per serverless instance for 60 seconds; cold instances may need to refetch up to 10 batches, which can be slow or hit function timeouts. For reliable production-scale search, persist the top 10k in a database and refresh it on a schedule.
