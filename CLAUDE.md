# CLAUDE.md

Live polling app: facilitators create polls, participants vote, results update in real time.

## Stack

- `api/` — NestJS + TypeScript, MongoDB via Mongoose, Vitest (ESM)
- `web/` — Vue 3 + Vite + TypeScript
- Real-time results via Server-Sent Events
- MongoDB runs in Docker as a single-node replica set (needed for transactions)

## Commands

```
docker compose up -d                          # MongoDB on :27017
cd api && npm install && npm run start:dev    # API on :3000
cd api && npm test                            # uses mongodb-memory-server; Docker not required
cd web && npm install && npm run dev          # UI on :5173
```

## Invariants

- One vote per participant per poll (unique index `{pollId, participantId}`); votes can change until close.
- Closed polls reject votes. A vote must never slip in concurrently with a close.
- Results are aggregated from votes and include zero-vote options.
- Domain rules live in `PollsService`; controllers only validate and map errors to HTTP.
