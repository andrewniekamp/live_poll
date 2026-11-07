# Live Poll

A facilitator runs one poll at a time; participants vote and see results update live.

NestJS + MongoDB (`api/`), Vue 3 (`web/`), live updates via Server-Sent Events.

## Run

Requires Node 22+ and Docker.

```bash
docker compose up -d                         # MongoDB
cd api && npm install && npm run start:dev   # API on :3000
cd web && npm install && npm run dev         # UI on :5173
```

- Facilitator: http://localhost:5173/admin (create and close polls)
- Voters: http://localhost:5173/ (each browser tab is a separate voter)

## Tests

```bash
docker compose up -d
cd api && npm test
```

Service tests against a real MongoDB test database: creating and fetching polls, counting votes,
changing a vote, rejecting options from another poll, and rejecting votes on closed polls.

## Assumptions

- One poll at a time: the current poll is the most recently created one.
- No authentication. `/admin` is just a separate view, and anyone with the URL can close a poll.
- Participants are identified by a random ID per browser tab (`sessionStorage`). It is not tamper-proof.
- Votes are stored in the poll document as a map of `participantId → optionId`, so each participant
  has exactly one vote and voting again overwrites it.
- **MongoDB:** a poll with its options and votes fits naturally in one document, so each vote is a
  single write. It runs as one plain container via `docker-compose.yml`.
- **SSE over WebSockets:** updates only go from server to browser, and votes are plain REST calls.

## Cut / unfinished

- **Close race:** a vote landing at the same instant as a close could slip through (vote loads, checks,
  then saves). Fix: a single conditional `updateOne({ _id, closed: false }, …)`.
- No facilitator auth.
- Voters must refresh to see a newly created poll.
- No tests for the SSE stream (checked manually), HTTP layer, or UI.
- No styling or production build.

## Next, with another day

1. Fix the close race, with a test.
2. Facilitator token required to close a poll.
3. Push new polls to voters automatically.
4. HTTP-level and SSE tests.

## AI usage

I used Claude Code (Claude Opus) for planning, scaffolding, and drafting code, and reviewed every change
before committing. A lot of the work was reining it in: it proposed a MongoDB replica set, decorator-heavy
schemas, an aggregation pipeline, and extra dependencies, and I cut each back to the simpler version here.
I questioned its initial CommonJS + Jest setup, which turned out not to run on Node 22 with Nest 12, so
we switched to ESM + Vitest. I wrote the controller, DTOs, close logic, and SSE stream myself.
