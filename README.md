<div align="center">

# Shelfwise

### A calmer, clearer way to run your library desk.

Manage your catalogue, members, checkouts, returns, and circulation reports in one secure workspace.

<br />

![Next.js](https://img.shields.io/badge/Next.js-16-111111?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/API-Express-444444?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Data-PostgreSQL-4169e1?logo=postgresql&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Local%20stack-Docker%20Compose-2496ed?logo=docker&logoColor=white)

</div>

---

## At a glance

Shelfwise is a full-stack library management app, built as a TypeScript monorepo. The Next.js desk talks to an Express API through a same-origin proxy. PostgreSQL stores library data and staff sessions; Redis backs API rate limits. Zod contracts are shared between the frontend and API so request and response shapes stay aligned.

| Books | Members | Circulation | Reports |
| --- | --- | --- | --- |
| Search and maintain the catalogue | Register and manage library members | Check books out and process returns | Review live collection and loan statistics |

## Contents

- [Project structure](#project-structure)
- [How the pieces connect](#how-the-pieces-connect)
- [Quick start with Docker](#quick-start-with-docker)
- [Local development](#local-development)
- [Useful commands](#useful-commands)
- [Security](#security)
- [Technology](#technology)

## Project structure

The repository is organized by **application** and **shared package**. Each app owns its routes, runtime configuration, and Dockerfile; reusable API contracts live in one package.

```text
shelfwise/
├── apps/
│   ├── api/                         # Express 5 API (TypeScript)
│   │   ├── src/
│   │   │   ├── routes/              # Auth, books, members, loans, reports
│   │   │   ├── migrations/          # PostgreSQL schema migrations
│   │   │   ├── types/               # Express request type extensions
│   │   │   ├── app.ts               # Middleware and route assembly
│   │   │   ├── auth.ts              # Staff sessions and authentication
│   │   │   ├── config.ts            # Validated API environment
│   │   │   ├── csrf.ts              # Session-bound CSRF protection
│   │   │   ├── db.ts                # PostgreSQL connection pool
│   │   │   ├── create-staff.ts      # Interactive staff provisioning
│   │   │   ├── migrate.ts           # Migration entry point
│   │   │   └── server.ts            # Startup, readiness, shutdown
│   │   ├── Dockerfile
│   │   └── package.json
│   └── web/                         # Next.js App Router application
│       ├── src/
│       │   ├── app/                 # Overview, books, members, circulation, reports
│       │   ├── components/          # Shared UI and session-aware state
│       │   ├── lib/api.ts           # Typed same-origin API client
│       │   └── proxy.ts             # Nonce-based CSP headers
│       ├── public/                  # Favicons and static assets
│       ├── scripts/                 # Icon generation and standalone preparation
│       ├── Dockerfile
│       └── package.json
├── packages/
│   └── contracts/                   # Shared Zod schemas and TypeScript types
│       ├── src/index.ts
│       └── test/
├── .dockerignore
├── .env.example                     # Local Compose configuration template
├── docker-compose.yml               # PostgreSQL, Redis, API, and web
├── package.json                     # Workspace scripts
├── package-lock.json                # Reproducible npm workspace install
└── tsconfig.base.json               # Shared strict TypeScript settings
```

## How the pieces connect

```mermaid
flowchart LR
    Browser -->|same-origin pages and /api requests| Web["Next.js web"]
    Web -->|rewrites /api to private service| API["Express API"]
    Web -.->|shared schemas and types| Contracts["Zod contracts"]
    API -.->|shared schemas and types| Contracts
    API -->|parameterized SQL over pooled connections| Postgres[("PostgreSQL")]
    API -->|distributed rate limits| Redis[("Redis")]
```

The browser only calls the web origin. Next.js forwards `/api` traffic to Express, keeping staff session cookies first-party; the browser never connects directly to PostgreSQL or Redis. Both application workspaces import the same contracts package.

## Quick start with Docker

**You need:** Docker Desktop with Docker Compose.

1. Clone the repository and enter its folder:

   ```powershell
   git clone https://github.com/Maanya89/library-management.git
   Set-Location library-management
   ```

2. Create your local Compose environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

   Replace the three password/secret placeholders in `.env` with **different**, randomly generated secrets. On PowerShell, this prints three independent 64-character hexadecimal values:

   ```powershell
   $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
   1..3 | ForEach-Object {
     $bytes = New-Object byte[] 32
     $rng.GetBytes($bytes)
     [BitConverter]::ToString($bytes).Replace("-", "").ToLowerInvariant()
   }
   $rng.Dispose()
   ```

   Use one value each for `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, and `SESSION_SECRET`. Keep `.env` private; it is ignored by Git.

3. Build and start the stack:

   ```powershell
   docker compose up --build -d
   docker compose ps
   ```

   Wait for the services to report healthy before continuing.

4. Create the first staff account. The first account is an administrator; subsequent accounts are librarians.

   ```powershell
   docker compose exec api node apps/api/dist/create-staff.js
   ```

5. Open [http://localhost:3000](http://localhost:3000) and sign in.

To stop the services without deleting library data:

```powershell
docker compose down
```

To also permanently remove the PostgreSQL and Redis volumes, use `docker compose down -v`.

The Compose file is a convenient **local stack**: only the web app is published to `127.0.0.1`; the API, PostgreSQL, and Redis stay on a private internal network. For production, use a deployment configuration with trusted TLS connections to PostgreSQL and Redis, production secrets, HTTPS ingress, and operational backups.

## Local development

**You need:** Node.js 22 or newer, npm, PostgreSQL, and Redis.

Start PostgreSQL and Redis locally, create the `shelfwise` database, and configure the API environment in `apps/api/.env` (dotenv loads the API workspace's file):

```dotenv
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://shelfwise:YOUR_LOCAL_PASSWORD@127.0.0.1:5432/shelfwise
REDIS_URL=redis://127.0.0.1:6379
SESSION_SECRET=replace-with-a-random-secret-at-least-32-characters-long
WEB_ORIGINS=http://localhost:3000
```

Replace the database password and session secret with local values. Then run these commands from the repository root:

```powershell
npm ci
npm run db:migrate
npm run db:create-staff
npm run dev
```

The desk is served at [http://localhost:3000](http://localhost:3000), and the API listens on port `4000`. The frontend's API rewrite defaults to `http://127.0.0.1:4000`; no browser-side cross-origin API configuration is needed.

## Useful commands

Run these from the repository root:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the API and web app for development |
| `npm run typecheck` | Type-check all workspaces |
| `npm test` | Run shared contract tests |
| `npm run build` | Build contracts, API, and web app |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:create-staff` | Interactively provision a staff account |

## Security

- Staff accounts are provisioned through the interactive CLI; there is no public signup route.
- Passwords are bcrypt-hashed. Session tokens are opaque, stored as hashes in PostgreSQL, and delivered only in `HttpOnly`, `Secure`, `SameSite=Strict` cookies.
- State-changing requests require a session-bound CSRF token and a trusted `Origin`.
- Helmet and a per-request Content Security Policy nonce provide security headers and script restrictions.
- API routes use Redis-backed rate limiting, with a stricter limit for login attempts.
- Database values are passed as parameterized query arguments. Connection pooling is bounded; loan creation locks book rows within a transaction to prevent over-issuing copies.
- Production configuration requires verified PostgreSQL TLS and a `rediss://` Redis URL. Never disable certificate validation or commit secrets.

## Technology

| Layer | Technology |
| --- | --- |
| Web | Next.js App Router, React, TypeScript |
| API | Node.js, Express, TypeScript |
| Validation and contracts | Zod, shared npm workspace |
| Persistence | PostgreSQL, `pg` connection pool |
| Rate limiting | Redis |
| Local orchestration | Docker Compose |
