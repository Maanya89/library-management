# Shelfwise Library Management

Shelfwise is a secure, full-stack library desk for cataloguing books, managing members, issuing and returning loans, and reviewing circulation reports. This repository upgrades the original Shelfwise project in place: Next.js App Router, a typed Express API, PostgreSQL persistence, shared TypeScript contracts, and Docker Compose now replace the browser-only storage and experimental MySQL backend.

## Architecture

```text
.
├── apps/
│   ├── web/                         # Next.js App Router frontend and same-origin API proxy
│   │   ├── src/app/                 # Overview, catalog, members, circulation, reports, metadata
│   │   ├── src/components/          # Typed UI, auth/session provider
│   │   ├── src/lib/api.ts           # Central fetch client; credentials and CSRF header
│   │   ├── src/proxy.ts             # Per-request CSP nonce
│   │   ├── Dockerfile
│   │   └── next.config.ts
│   └── api/                         # TypeScript Express API
│       ├── src/routes/              # Auth, books, members, loans, stats
│       ├── src/migrations/          # PostgreSQL schema migration
│       ├── src/db.ts                # Bounded PostgreSQL pool and TLS
│       ├── src/auth.ts              # Opaque server-side sessions and CSRF
│       └── Dockerfile
├── packages/
│   └── contracts/                   # Shared Zod schemas and API/domain types
├── docker-compose.yml               # PostgreSQL, Redis, API, frontend
├── package.json                     # npm workspaces and unified scripts
└── tsconfig.base.json
```

## Run with Docker Compose

1. Copy `.env.example` to `.env` and replace every placeholder with a distinct, randomly generated 64-character hexadecimal secret. Never commit `.env`.
2. Start the application with `docker compose up --build -d`.
3. Provision the first administrator from an interactive terminal:

   ```powershell
   docker compose exec api node apps/api/dist/create-staff.js
   ```

4. Open <http://localhost:3000> and sign in with that account.

The frontend is the only service published to the host, and it is bound to `127.0.0.1` by default. It proxies `/api` requests to the private API network, keeping browser requests same-origin and session cookies first-party. PostgreSQL and Redis have no published ports. The database/cache network is `internal: true`; only the frontend also joins the ingress bridge.

To stop the stack, run `docker compose down`. Persistent data is held in named PostgreSQL and Redis volumes; `docker compose down -v` deletes that data.

## Local development

For `npm install` and `npm run dev`, run PostgreSQL and Redis locally, then update `DATABASE_URL` and `REDIS_URL` in `.env` for those services. Create the schema and first staff user:

```powershell
npm install
npm run db:migrate
npm run db:create-staff
npm run dev
```

The UI is available at <http://localhost:3000>; the API listens on port 4000. Requests from the UI use `/api` and are proxied by Next.js to the API. The API requires a `SESSION_SECRET` of at least 32 characters and an exact `WEB_ORIGINS` allowlist. The local configuration defaults to `http://localhost:3000`.

## Security and operations

- Staff accounts are created only through the interactive administrative CLI; there is no public registration endpoint.
- Passwords are bcrypt-hashed. Sessions are random, server-side, eight-hour records; the browser cookie is `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, and has the `__Host-` prefix. Tokens are hashed in PostgreSQL.
- State-changing API requests require a session-bound CSRF token and an exact allowlisted `Origin`. CORS never reflects untrusted or wildcard origins.
- Helmet applies restrictive API headers; the frontend issues a per-request nonce CSP, anti-framing policy, HSTS, and related browser security headers.
- Every API route is rate-limited through Redis, with a tighter login limit. The API fails closed if its rate-limit store is unavailable.
- PostgreSQL interactions use bounded connection pooling and `$n` parameterized values. Loan issuance locks the book row in a transaction so concurrent requests cannot over-issue copies.
- In production, PostgreSQL TLS is enabled with certificate verification. Set `NODE_ENV=production` and provide the trusted CA PEM through `DB_SSL_CA` when using a private CA; do not disable certificate validation. Production Redis connections must use `rediss://`.
- Secrets belong in a deployment secret manager, not an image, checked-in environment file, or build argument. Terminate public TLS at a trusted ingress before exposing the frontend.

## Validation

```powershell
npm run typecheck
npm test
npm run build
```

The Compose stack includes database, Redis, API, and frontend health checks and starts dependent services only after their readiness checks pass.
