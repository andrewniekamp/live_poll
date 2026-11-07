# CLAUDE.md

Live polling app: facilitators create polls, participants vote, results update in real time.

## Stack

- `api/` — NestJS + TypeScript, MongoDB via Mongoose, Vitest (ESM)
- `web/` — Vue 3 + Vite + TypeScript
- Real-time results via Server-Sent Events
- MongoDB runs in Docker (`docker-compose.yml`)

## Commands

```
docker compose up -d                          # MongoDB on :27017
cd api && npm install && npm run start:dev    # API on :3000
cd api && npm test                            # uses mongodb-memory-server; Docker not required
cd web && npm install && npm run dev          # UI on :5173
```

## Invariants

- Votes are embedded in the poll document, so every vote/close is a single-document atomic update.
- One vote per participant per poll; votes can change until close.
- Closed polls reject votes. Vote updates are conditional on `closed: false` in the same `updateOne`.
- Results are aggregated from votes and include zero-vote options.
- Domain rules live in `PollsService`; controllers only validate and map errors to HTTP.
