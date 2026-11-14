# Prisma Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make QuickOrder authentication, sessions, menu, and orders durable in PostgreSQL through Prisma while preserving the existing API and in-memory unit-test fixtures.

**Architecture:** Add an asynchronous persistence contract with a Prisma implementation for normal application runs and an adapter over the current `InMemoryStore` for existing unit tests. Inject the contract into app/router factories so focused integration tests can exercise the Prisma-backed app against PostgreSQL.

**Tech Stack:** Node.js 24, TypeScript, Express 4, Prisma 5, PostgreSQL 16, Vitest, Docker Compose, GitHub Actions.

**Spec:** [Prisma Persistence Design](../specs/2026-11-13-prisma-persistence-design.md)

## Global Constraints

- Reuse PostgreSQL, Prisma, Docker Compose, and the existing schema/seed workflow; do not add another database or ORM.
- Do not change route paths or response contracts as part of this work.
- Persist users, session tokens, menu items, orders, and order items using the existing Prisma models and PostgreSQL database.
- Keep current HTTP paths, response shapes, role checks, ownership rules, price calculation, documented status transition rules, and error codes.
- Make order placement and cancellation transactional. Stock decrements must be conditional on sufficient database stock, and a failed reservation must roll back the entire order.
- Keep an in-memory adapter for the existing test setup; tests can continue resetting and inspecting the fixture store without requiring a database.
- Add focused PostgreSQL integration coverage for the Prisma-backed adapter and production routes using the PostgreSQL service already defined in CI.
- Customer cancellation is only for the customer's own `PENDING` order. Staff status changes only follow `PENDING` -> `PREPARING` -> `READY` -> `COMPLETED`.
- F-07, F-08, F-10, F-11, Cloud Run deployment changes, and a full load-test program remain outside this implementation.

## Lab and Sprint Workflow

- The Lab 5 runbook asks for an issue-linked feature branch, a PR to a staging branch, the `test-and-docker` CI check, teammate review, and then a release PR to `main`.
- The Lab 5 runbook explicitly requires `sprint-1-staging` as the feature PR target and release PR source. Sprint 2 defines no replacement branch name, so follow the exact Lab 5 branch flow rather than inventing `sprint-2-staging`.
- Create the GitHub issue before implementation and link it from the Sprint 2 persistence contract and PR. The current GitHub CLI credential is invalid, so issue/PR operations require restored GitHub authentication.
- Branch flow: `main` -> `sprint-1-staging` -> `feature/prisma-persistence`; open the feature PR into `sprint-1-staging`, then the release PR from `sprint-1-staging` to `main` after CI and peer review.
- Do not merge the release PR or trigger deployment until the team verifies the GCP workflow target. The current deploy workflow names `toktickit` resources, while the QuickOrder deployment runbook names `quickorder` resources.
- Capture actual test, Docker Compose health, CI, and peer-review evidence; do not mark a check complete based only on documentation.

## Review Focus

- Duplicate line items and simultaneous orders must never make a menu item's stock negative; cover with a Prisma-backed integration test where two requests compete for the last unit.
- A repeated or racing cancellation must restore inventory at most once; cover by cancelling the same `PENDING` order twice and asserting one successful restoration.
- Prisma Decimal values must serialize as the numeric prices the current client expects; assert menu, order total, unit price, and subtotal JSON types and values.
- Expired or logged-out sessions must return 401 after a new app instance uses the same database; assert session lookup and logout revocation through Prisma.
- Customer ownership and staff-only status updates must remain enforced after records are loaded from PostgreSQL; assert cross-customer reads and customer status changes are rejected.

---

### Task 1: Add Sprint 2 persistence contract and workflow setup

**Files:**
- Create: `docs/sprints/sprint-2/persistence-spec.md`
- Modify: `docs/sprints/plan.md`
- Modify: `docs/traceability.md`
- GitHub: create a linked implementation issue; confirm `sprint-1-staging` before creating the feature branch from it.

**Interfaces:**
- Produces acceptance IDs `AC-PERSIST-01` through `AC-PERSIST-09` and test IDs `TEST-PERSIST-01` through `TEST-PERSIST-09` for later tasks.
- Uses the existing Lab 5 `sprint-1-staging` pull-request target already listed in CI.

- [ ] **Step 1: Write the Sprint 2 contract before implementation**
  - Define observable acceptance criteria for persistence across app instances, login/session/logout, menu reads, atomic order placement, cancellation, staff progression, and readiness.
  - Map every criterion to existing `F-01` through `F-06` / business rules where applicable, and to a test ID.
  - Record persistence as a Sprint 2 prerequisite in `docs/sprints/plan.md`; add the matching traceability rows.
- [ ] **Step 2: Establish the issue and staging branch**
  - Create the GitHub issue from the contract and include its URL in the contract.
  - Confirm the remote `sprint-1-staging` branch exists. If absent, coordinate restoring that exact Lab 5 branch from `main`; do not invent a replacement staging name.
  - Create `feature/prisma-persistence` from `sprint-1-staging` and link the issue in the branch/PR description.
- [ ] **Step 3: Review the artifact against workflow requirements**
  - Manually verify every `AC-PERSIST-*` maps to a `TEST-PERSIST-*` and to a source requirement or business rule; confirm the issue and exact Lab 5 branch names are recorded.

### Task 2: Define the persistence contract and app injection boundary

**Files:**
- Create: `server/src/persistence/contracts.ts`
- Create: `server/src/persistence/in-memory.adapter.ts`
- Create: `server/src/http/async-handler.ts`
- Modify: `server/src/store.ts`
- Modify: `server/src/app.ts`
- Modify: `server/src/routes/auth.routes.ts`
- Modify: `server/src/routes/menu.routes.ts`
- Modify: `server/src/routes/order.routes.ts`
- Modify: `server/src/middleware/auth.middleware.ts`
- Create: `server/tests/persistence-adapter.test.ts`

**Interfaces:**
- `QuickOrderPersistence` exposes async `findUserByEmail`, `findUserById`, `createSession`, `getSession`, `deleteSession`, `getMenuItems`, `getMenuItem`, `createOrder`, `getOrdersByCustomer`, `getAllOrders`, `getOrderById`, `cancelOrder`, `updateOrderStatus`, and `checkReady` methods.
- `createApp(persistence: QuickOrderPersistence): Express` builds route factories and auth middleware with the supplied implementation; `app` remains the exported default app.
- `InMemoryPersistenceAdapter` wraps the same exported `store` so existing tests can call `store.seedDefaultData()` and inspect store values.
- `asyncHandler` forwards rejected handler promises to Express 4 error middleware.

- [ ] **Step 1: Add the adapter boundary test**
  - Add `TEST-PERSIST-01`: create two apps with the same `InMemoryPersistenceAdapter`, log in through the first, then request `/api/auth/me` through the second; expect HTTP 200 and the same user.
- [ ] **Step 2: Run the focused test to confirm it fails**

Run: `npm --prefix server test -- tests/persistence-adapter.test.ts`

Expected: FAIL because app/router construction cannot yet accept a persistence adapter.

- [ ] **Step 3: Implement the contract and in-memory adapter**
  - Keep `store`'s synchronous fixture helpers available for existing tests; have the adapter return promises from the `QuickOrderPersistence` methods.
  - Refactor routers and `requireAuth` into factories that receive the persistence contract. Await all persistence calls and pass errors to `next` through `asyncHandler`.
  - Make `createApp` accept an adapter and export `app = createApp(defaultPersistence)`; default to the in-memory adapter only when `NODE_ENV === "test"`.
- [ ] **Step 4: Run the focused adapter test and existing in-memory suites**

Run: `npm --prefix server test -- tests/persistence-adapter.test.ts tests/auth.test.ts tests/order.test.ts tests/permissions.test.ts`

Expected: PASS; existing API behavior remains intact while two app instances share the same test store.

### Task 3: Prepare Prisma schema, first migration, and seed fixtures

**Files:**
- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/<timestamp>_initial_persistence/migration.sql`
- Create: `server/prisma/migrations/migration_lock.toml` if Prisma generates it
- Modify: `server/prisma/seed.ts`
- Modify: `.github/workflows/ci-docker.yml`

**Interfaces:**
- The Prisma schema retains existing User, Session, MenuItem, Order, and OrderItem models and adds an order-time item-name snapshot field to OrderItem.
- The seed provides the intended customer, second customer, staff, and five menu fixtures; re-running it must not reset live stock or existing passwords.

- [ ] **Step 1: Add schema/migration expectations to the PostgreSQL integration suite**
  - Add `TEST-PERSIST-02`: seeded user and menu fixtures can be loaded through Prisma after migrations.
  - Add `TEST-PERSIST-03`: an OrderItem retains its name and price from order time after the menu name or price changes.
- [ ] **Step 2: Run the focused integration test to confirm the schema is insufficient**

Run: `npm --prefix server test -- tests/prisma.integration.test.ts`

Expected: FAIL because the first migration and order-time item-name snapshot do not exist yet.

- [ ] **Step 3: Update Prisma schema and create the initial migration**
  - Add `OrderItem.name String @db.VarChar(120)` and preserve the current Decimal precision and unique/index constraints.
  - Generate the initial migration from an empty PostgreSQL schema. The repository currently has no migration directory, so do not assume `migrate deploy` can create the schema without it.
- [ ] **Step 4: Make database seed data idempotent**
  - Add the second customer present in the in-memory fixture. Keep existing users and menu rows stable on repeated seed runs; do not reset stock on an existing row.
- [ ] **Step 5: Apply migrations, seed, and verify Prisma client generation**

Run with PostgreSQL available: `npx prisma generate`, `npx prisma migrate deploy`, and `npm run prisma:seed` from `server/`.

Expected: all complete successfully on an empty database and on a second seed run without duplicate rows or stock resets.

### Task 4: Implement Prisma authentication, sessions, and menu reads

**Files:**
- Create: `server/src/persistence/prisma.adapter.ts`
- Modify: `server/src/persistence/contracts.ts`
- Modify: `server/src/persistence/runtime.ts`
- Modify: `server/src/routes/auth.routes.ts`
- Modify: `server/src/routes/menu.routes.ts`
- Modify: `server/src/middleware/auth.middleware.ts`
- Modify: `server/tests/prisma.integration.test.ts`

**Interfaces:**
- `PrismaPersistence(prisma: PrismaClient)` implements the complete `QuickOrderPersistence` contract; order methods may initially return typed `NOT_IMPLEMENTED` only within this task and must be completed in Task 5 before merge.
- `createRuntimePersistence()` selects `PrismaPersistence` for normal app runs and `InMemoryPersistenceAdapter` for the existing Vitest fixture environment.

- [ ] **Step 1: Add focused failing route integration cases**
  - `TEST-PERSIST-04`: valid login, case-insensitive email lookup, `/me` in a second Prisma-backed app instance, and logout revocation.
  - `TEST-PERSIST-05`: menu response is read from PostgreSQL, reports zero stock as unavailable, and preserves numeric `price` values.
- [ ] **Step 2: Run the focused cases and confirm they fail against the current in-memory production path**

Run: `npm --prefix server test -- tests/prisma.integration.test.ts`

Expected: FAIL because no Prisma persistence implementation is connected to the application.

- [ ] **Step 3: Implement Prisma user/session/menu methods**
  - Query sessions only when unexpired, include the owning user, and delete the session token on logout.
  - Compare email case-insensitively consistently with the current in-memory behavior.
  - Map Prisma Decimal price to the current API's numeric JSON field and derive `isAvailable` from `stock > 0`.
- [ ] **Step 4: Run integration and existing in-memory auth/menu tests**

Run: `npm --prefix server test -- tests/prisma.integration.test.ts tests/auth.test.ts tests/order.test.ts tests/permissions.test.ts`

Expected: PASS for Prisma auth/menu scenarios and existing in-memory tests.

### Task 5: Implement transactional Prisma order operations

**Files:**
- Modify: `server/src/persistence/prisma.adapter.ts`
- Modify: `server/src/persistence/in-memory.adapter.ts`
- Modify: `server/src/routes/order.routes.ts`
- Modify: `server/tests/prisma.integration.test.ts`
- Modify: `server/tests/order.test.ts` only where an existing assertion contradicts the documented contract
- Modify: `server/tests/permissions.test.ts` only where an existing assertion contradicts the documented contract

**Interfaces:**
- `createOrder(customerId, items)` returns either `{ success: true, order }` or `{ success: false, code, message }` matching the existing route error mapping.
- `cancelOrder(orderId, customerId)` returns the existing success/error result including HTTP status.
- `updateOrderStatus(orderId, status)` allows only `PENDING` -> `PREPARING` -> `READY` -> `COMPLETED`; it does not permit staff cancellation.
- Prisma order DTOs map Decimal fields to numeric JSON and preserve order-time item names/prices.

- [ ] **Step 1: Add failing Prisma integration cases for order persistence and rules**
  - `TEST-PERSIST-06`: successful order uses database prices, stores name/price snapshots, returns numeric JSON values, and decrements stock.
  - `TEST-PERSIST-07`: insufficient stock, including duplicate cart lines whose combined quantity exceeds stock, creates no order and changes no stock.
  - `TEST-PERSIST-08`: customer cancellation is owner-only and `PENDING`-only; stock is restored once; staff can advance valid statuses but cannot set `CANCELLED`.
  - Add a focused two-request race against one remaining unit; exactly one order succeeds and stock remains zero.
- [ ] **Step 2: Run the focused cases to confirm transaction failures**

Run: `npm --prefix server test -- tests/prisma.integration.test.ts`

Expected: FAIL on the current in-memory-backed production route and missing transactional Prisma methods.

- [ ] **Step 3: Implement order creation in one Prisma transaction**
  - Validate all item IDs and positive integer quantities; use database menu prices only.
  - Generate a unique `QO-` public order number without a process-local counter.
  - For every requested line, use a conditional `updateMany` requiring `stock >= quantity`; throw a typed insufficient-stock result when count is zero so the whole transaction rolls back.
  - Create the order and snapshot line name, unit price, quantity, and subtotal in the same transaction.
- [ ] **Step 4: Implement history, detail, cancellation, and status transitions**
  - Include order items in customer history, staff queue, and detail results; map all Decimal and date fields without changing API envelopes.
  - In one transaction, conditionally move only an owned `PENDING` customer order to `CANCELLED`, then restore its stock. A failed conditional update must not restore inventory.
  - Enforce staff-only forward lifecycle transitions and map missing, unauthorized, and invalid-transition results to existing HTTP behavior.
- [ ] **Step 5: Run focused Prisma cases and all existing order/permission suites**

Run: `npm --prefix server test -- tests/prisma.integration.test.ts tests/order.test.ts tests/permissions.test.ts`

Expected: PASS; no order can oversell, and no canceled order can restore its stock twice.

### Task 6: Connect readiness and Lab 5 CI/Docker flow

**Files:**
- Modify: `server/src/persistence/prisma.adapter.ts`
- Modify: `server/src/app.ts`
- Modify: `.github/workflows/ci-docker.yml`
- Modify: `README.md`
- Modify: `docs/labs/lab-05/deployment.md`
- Create: `docs/sprints/sprint-2/persistence-evidence.md`

**Interfaces:**
- `QuickOrderPersistence.checkReady(): Promise<void>` succeeds for the test adapter and executes `SELECT 1` for Prisma.
- `/api/ready` returns HTTP 200 only when the selected persistence adapter is reachable; database failure returns HTTP 503. `/api/health` remains liveness-only.

- [ ] **Step 1: Add a failing readiness test**
  - Add `TEST-PERSIST-09`: assert an adapter whose `checkReady()` rejects produces HTTP 503 from `/api/ready`, while the memory test adapter returns 200.
- [ ] **Step 2: Run the readiness test and confirm failure**

Run: `npm --prefix server test -- tests/persistence-adapter.test.ts`

Expected: FAIL because readiness currently reports success when `DATABASE_URL` is absent and is not tied to the selected persistence adapter.

- [ ] **Step 3: Implement adapter-backed readiness**
  - Route `/api/ready` through `checkReady()` and keep `/api/health` independent of database availability.
- [ ] **Step 4: Update CI to migrate and seed PostgreSQL before tests**
  - Keep the existing PostgreSQL service and `DATABASE_URL`; after `npm ci` and `prisma generate`, run `prisma migrate deploy`, `npm run prisma:seed`, and the backend tests before the client checks and Docker build.
  - Keep the `test-and-docker` job name required by the Lab 5 runbook.
- [ ] **Step 5: Run build, database-backed tests, and Docker Compose verification**

Run: `npm --prefix server run build`, the complete backend test suite with the CI-equivalent `DATABASE_URL`, and `docker compose up --build -d` followed by `/api/health` and `/api/ready` checks.

Expected: build and tests pass; Compose migration/seed completes; health and readiness both return 200 with PostgreSQL running; stopping PostgreSQL makes readiness return 503.

- [ ] **Step 6: Update setup and evidence docs from actual outputs**
  - Document the initial migration/seed workflow and capture actual test/Compose output in `docs/sprints/sprint-2/persistence-evidence.md`; do not copy Sprint 1's historical PASS claims.

### Task 7: Staging review and release handoff

**Files:**
- Modify: `docs/sprints/sprint-2/persistence-evidence.md`
- GitHub: feature PR to `sprint-1-staging`; release PR from `sprint-1-staging` to `main` after staging review.

- [ ] **Step 1: Open the issue-linked feature PR into `sprint-1-staging`**
  - Include acceptance IDs, migration notes, CI run, Docker Compose evidence, and the changed API paths.
- [ ] **Step 2: Wait for CI and a teammate's review**
  - Require the `test-and-docker` check and written review findings. The author must not approve their own PR. Record the actual reviewer and disposition in the evidence file.
- [ ] **Step 3: Integrate into `sprint-1-staging` and prepare a release PR to `main`**
  - Run the suite from the integrated staging branch and prepare the release PR only after the Lab 5 checks pass.
  - Before merging to `main`, resolve the documented `toktickit` versus `quickorder` GCP workflow target mismatch; this plan does not deploy or alter live GCP resources.

## Execution Notes

- GitHub issue #4 is created, and the exact remote `sprint-1-staging` and `feature/prisma-persistence` branches exist; the feature branch is based on `sprint-1-staging`. Keep this branch and PR target aligned with the Lab 5 runbook.
- Existing `.github/workflows/deploy.yml` deploys only from `main` and names `toktickit` resources. Keep this work on staging until the team confirms the deployment target and environment settings.
- Keep the implementation on `feature/prisma-persistence`; do not commit directly to `main`.
