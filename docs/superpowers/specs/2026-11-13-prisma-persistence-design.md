# Prisma Persistence Design

**Status:** Approved by user; Lab 5 PostgreSQL integration coverage included

**Date:** 2026-11-13
**Scope:** Replace process-local production state with PostgreSQL persistence while preserving the current API behavior and lightweight in-memory test setup.

## Intent

QuickOrder's plan calls for a database-backed vertical slice and Cloud SQL deployment, but the current auth middleware and route handlers call the process-local `InMemoryStore`. Data disappears on restart and is not shared by multiple Cloud Run instances. Use the existing Prisma/PostgreSQL stack for normal app runs so accounts, sessions, menu data, and orders are durable and shared.

## Goals

- Persist users, session tokens, menu items, orders, and order items using the existing Prisma models and PostgreSQL database.
- Keep current HTTP paths, response shapes, role checks, ownership rules, price calculation, documented status transition rules, and error codes.
- Keep an in-memory adapter for the existing test setup; tests can continue resetting and inspecting the fixture store without requiring a database.
- Add focused PostgreSQL integration coverage for the Prisma-backed adapter and production routes using the PostgreSQL service already defined in CI.
- Make order placement and cancellation transactional. Stock decrements must be conditional on sufficient database stock, and a failed reservation must roll back the entire order.
- Make cancellation restore stock only when a pending order is successfully changed to cancelled.
- Keep cancellation customer-only through `POST /api/orders/:id/cancel`; staff status updates only advance the kitchen lifecycle (`PENDING` -> `PREPARING` -> `READY` -> `COMPLETED`).
- Keep `/api/ready` meaningful for the Prisma-backed app by reporting unavailable when the database cannot be reached.
- Use Prisma migrations and the existing seed command to provision persistent data.

## Non-goals

- Staff menu CRUD (`F-07`), pickup codes and printable receipts (`F-08`), analytics (`F-10`), and operations hardening (`F-11`).
- A broad rewrite of existing in-memory test assertions.
- Deployment to GCP or changing the Cloud Run / Cloud SQL architecture.
- Contention retry policy and dedicated load/concurrency verification beyond the database-safe stock reservation required for correctness; those remain explicit follow-up work under `F-09`.

## Approaches considered

1. **Repository boundary with Prisma production adapter and in-memory test adapter (selected).** Routes and middleware use one asynchronous storage contract. Normal app runs use Prisma; test runs use the current in-memory fixtures. This preserves the existing test setup while making production state durable.
2. **Prisma in every environment.** This removes duplicate storage behavior, but requires a PostgreSQL-backed test setup and changes to the current tests, which directly seed and inspect the in-memory store.
3. **Persist menu and orders only.** This leaves users and sessions process-local, so logins can fail across instances and logout state is not shared. It does not meet the Cloud Run persistence goal.

## Proposed design

- Define a storage contract for user lookup, session lifecycle, menu reads, and order operations. Move the current in-memory behavior behind that contract and add a Prisma-backed implementation using the shared client in `server/src/db.ts`.
- Select the in-memory implementation for the existing unit-test environment and Prisma for normal application runs. Keep the existing fixture identities and menu values available to those tests; ensure the database seed supports the same intended demo users and menu.
- Add a focused PostgreSQL integration suite using the existing CI Postgres service and `DATABASE_URL`. The suite must exercise the Prisma-backed production path without replacing the in-memory unit tests.
- Convert storage calls in auth, menu, order, and auth-middleware paths to asynchronous calls. Preserve middleware's 401/403 behavior and map Prisma not-found, unique-conflict, and stock-reservation outcomes to the existing API error format.
- Create order header and items in a single transaction. For each requested item, decrement stock with a database condition that requires `stock >= quantity`; if any decrement fails, roll back every decrement and insert. Compute prices from the database records, not request values. Return the existing JSON shape, including each line's menu name and price at order time.
- Cancel a customer-owned order in a transaction that changes status only from `PENDING`, restores its item quantities, and returns the updated order. Reject repeated or invalid cancellation without restoring stock twice. The staff status endpoint permits only the documented kitchen progression and cannot set `CANCELLED`.
- Keep Prisma schema changes limited to fields needed to preserve current order-response semantics, including an order-time item-name snapshot if required by the implementation. Create a migration for any schema change.
- In normal app runs, readiness requires a successful database query. Health remains a liveness-only check.

## Constraints and implementation calls

- Reuse PostgreSQL, Prisma, Docker Compose, and the existing schema/seed workflow; do not add another database or ORM.
- Do not change route paths or response contracts as part of this work.
- Keep generated IDs database-safe and order numbers unique without relying on a process-local counter.
- Existing tests are coupled to the exported in-memory store. Preserve a test-mode adapter that supports those fixture operations rather than silently switching them to a live database.
- A database migration must be safe for the current empty/demo database setup. No production data migration is planned for this course project.

## Acceptance outcomes

- Across app restarts and separate app instances using the same database, users, sessions, menu stock, and orders remain consistent.
- Login, logout, menu retrieval, order creation/history/detail/cancellation, kitchen queue, and staff status progression preserve current behavior and API envelopes.
- Customer cancellation is permitted only for the customer's own `PENDING` order; staff status updates permit only the documented kitchen progression.
- Failed orders leave neither partial order rows nor partially decremented stock; successful cancellation restores stock once.
- Test runs continue to use isolated in-memory fixtures; production app runs use PostgreSQL through Prisma.
- PostgreSQL integration coverage proves data survives application reinitialization and transactional order/cancellation behavior is persisted through Prisma.
- Readiness returns failure when the configured database is unreachable.

## Left to the implementer

- Exact module/file boundaries for the storage contract and adapters.
- The order-number encoding and Prisma transaction isolation strategy, provided uniqueness and the stock invariants above hold.
- Exact seed idempotency details and Prisma error-code mapping, provided public API behavior stays stable.
