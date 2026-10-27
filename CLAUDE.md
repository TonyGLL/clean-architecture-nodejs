# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # nodemon + ts-node on src/main/server.ts
pnpm build        # tsc -> dist/
pnpm typecheck    # tsc --noEmit
pnpm lint            # eslint src (flat config; style rules are warnings, CI fails on errors)
pnpm start            # node dist/main/server.js (API)
pnpm worker           # node dist/main/worker.js (cron + mail queue consumer; `pnpm dev:worker` for ts-node)
pnpm test             # jest (ts-jest, tests live in src/__tests__)
pnpm jest src/__tests__/application/use-cases/auth.use-case.test.ts -t "test name"   # single test
docker-compose up --build -d   # app + postgres + nginx (app reads env_file: dev.env)
pnpm migrate up                # node-pg-migrate via scripts/migrate.js (reads PSQL_* or DATABASE_URL); also `down 1`
```

The project uses **pnpm** (version pinned in `packageManager`; commit `pnpm-lock.yaml`). Use `pnpm install --frozen-lockfile` in CI/Docker. Native build scripts are disabled in `pnpm-workspace.yaml` (`allowBuilds`). pnpm is strict, so every imported package (including `@types/*`) must be declared in `package.json`. 

Env vars are validated with zod in `src/infraestructure/config/env.ts`; the process exits at startup if any required one is missing (JWT_SECRET_CLIENT/ADMIN, PSQL_*, SMTP_*, EMAIL_FROM, STRIPE_*). `CORS_ORIGIN` is optional. Never read `.env`/`dev.env` files; ask the user for values.

## Architecture

Full human-oriented documentation (flows, API catalog, DB, operations, known limitations) lives in `docs/`; keep it in sync when behavior changes.

Clean Architecture in `src/` (note the folder is spelled `infraestructure`):

- `domain/`: entities, repository/service **interfaces**, `HttpError`, status codes.
- `application/`: one file of use-case classes per feature (`XxxUseCase.execute(dto)` returns a `[httpStatus, payload]` tuple), plus DTOs.
- `infraestructure/`: Postgres repositories (raw `pg`, no ORM), driven services (bcrypt, jwt, nodemailer, stripe), Express controllers/routes/middlewares/validators, IoC.
- `main/`: `app.ts` builds Express, `server.ts` boots the API, `worker.ts` boots the background process (both shut down gracefully on SIGTERM/SIGINT).
- `cron/products.ts`: daily job (America/Mexico_City) syncing products from fakestoreapi.com. Runs only in the worker, guarded by a Postgres advisory lock so replicas never run it twice. The sync does not overwrite stock.
- `infraestructure/queue/`: optional Redis (`REDIS_URL`) — BullMQ mail queue (`QueuedMailService` enqueues in the API, `mail.worker.ts` sends via SMTP with retries) and the shared rate-limit store. Without `REDIS_URL` emails are sent inline and the limiter is in-memory. API-side Redis calls must go through `withTimeout` (ioredis queues commands while disconnected).
- `migrations/` (repo root): plain-SQL node-pg-migrate files — schema, RBAC seed, stored procedures (SQL functions called by repositories). Change the DB only by adding a new migration; redefine a function with `CREATE OR REPLACE FUNCTION` in a new file. Compose runs them through the `migrate` service before the app.

### Dependency injection (Inversify)
Everything is wired in `infraestructure/ioc/config.ts`: interfaces are bound via symbols in `domain/ioc.types.ts`, `application/ioc.types.ts` and `infraestructure/ioc/types.ts`; use cases and controllers are bound `toSelf()`. **Adding a use case/controller/repository requires a binding there**, and route files pull controllers with `container.get(...)` at import time. Middlewares also resolve services from the container.

### HTTP layer
`/api/v1/client/*` and `/api/v1/admin/*` are separate trees with **separate JWT secrets** (`ServiceType` = `'client' | 'admin'`). Admin routes after `/auth` go through `adminAuthMiddleware` then `permissionsMiddleware`, which derives the *module name from the first URL path segment* (e.g. `/roles/...` -> module `roles`), maps the HTTP method to `can_read/can_write/can_update/can_delete`, and grants access if any of the user's roles has that permission. A new admin route therefore needs a matching row in the `modules` table plus role permissions.

Unauthenticated auth routes (`auth.*.routes.ts`) sit behind `authRateLimiter` (20 req / 15 min per IP; Redis store when `REDIS_URL` is set, fails open if Redis is down); `trust proxy` is set to 1 so it sees the real client IP behind nginx / a load balancer.

Errors: throw `HttpError(status, message)`; `error.handler.ts` serializes it, anything else is logged by winston and returned as 500 (Express 5 forwards rejected async handlers automatically).

### Stripe / orders / transactions
- The webhook route (`/api/v1/stripe-webhooks`) is mounted **before** `express.json()` and uses `express.raw`; keep that order so signature verification works.
- Multi-step writes use an explicit `pool.connect()` client with `BEGIN/COMMIT/ROLLBACK`/`release()` passed down to repository methods as `poolClient`. Always release in `finally`.
- Orders are created `pending` in `stripe.use-case.ts` (`CreatePaymentIntentUseCase`), which reserves stock and snapshots the address. The worker's `cron/orders.ts` (every 5 min) runs `ExpirePendingOrdersUseCase`: orders unpaid after `ORDER_RESERVATION_MINUTES` get their PaymentIntent cancelled in Stripe, the order `cancelled` and stock returned. Admin fulfilment transitions are limited to `succeeded→processing→shipped→delivered` (`ORDER_STATUS_TRANSITIONS`). `payment_intent.succeeded` in the webhook marks the order paid only if it is still `pending` (`markOrderPaid`), completes the cart, creates a new cart and records coupon redemption. The event id is recorded in `payment_provider_events` (`recordProviderEvent`) in the same transaction, so duplicate deliveries are skipped and a rollback lets Stripe retry. `payment_intent.payment_failed` only logs (the cart stays active for a retry). The webhook answers 500 on processing errors so Stripe retries.

### Views
EJS pages (`src/views`, routes in `views.routes.ts`) and static assets in `public/` (served by nginx in Docker) support the Stripe checkout/add-card flow; helmet CSP is allow-listed for `js.stripe.com` in `main/app.ts`.

### Logging, tracing and probes
Each request gets an `X-Request-Id` (`request-context.middleware.ts`, AsyncLocalStorage) that winston adds to every log line and the 500 body returns. Prometheus metrics (`http_request_duration_seconds` + default process metrics) are served at `/metrics`; nginx returns 404 for it, so scrape from inside the network. Use the winston `logger` (`infraestructure/config/winston.ts`), not `console`. In production it emits JSON to stdout; rotating files in `logs/` only with `LOG_TO_FILE=true`. `LOG_LEVEL` overrides the level. `/health` is liveness; `/ready` runs `SELECT 1` against Postgres (and pings Redis if enabled) and returns 503 when a dependency is down.
