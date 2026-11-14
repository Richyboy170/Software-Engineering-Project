# Sprint 2 Persistence Contract

**Status:** Approved for implementation

**Implementation issue:** [#4 — Sprint 2: Persist QuickOrder state with Prisma and PostgreSQL](https://github.com/Richyboy170/Software-Engineering-Project/issues/4)

**Feature branch:** `feature/prisma-persistence`

**Feature PR target:** `sprint-1-staging`

**Release PR source and target:** `sprint-1-staging` → `main`

## Purpose and scope

This contract establishes PostgreSQL persistence for the existing Sprint 1 QuickOrder journey before adding the remaining Sprint 2 product features. Authentication, sessions, menu availability, order placement and retrieval, customer cancellation, and the kitchen queue must continue to behave as documented while using Prisma and the existing PostgreSQL database.

The contract preserves the existing in-memory fixture adapter for current unit tests. Order placement and cancellation must be atomic, prices must come from PostgreSQL, and inventory must never be reserved below zero. This includes a focused race test for two requests competing for the final unit; it is correctness coverage, not the broader F-09 load-test program.

F-07 menu management, F-08 receipts and pickup codes, the broad F-09 concurrency program, F-10 analytics, F-11 hardening, and GCP deployment changes remain outside this persistence task. `/api/ready` must still report whether the selected database-backed application can reach PostgreSQL; `/api/health` remains a liveness check.

## Acceptance and verification

| Acceptance ID | Observable acceptance criterion | Existing requirement / rule | Verification |
|---|---|---|---|
| AC-PERSIST-01 | Existing unit tests can inject two apps backed by the same in-memory adapter; a login through one app is visible through the other, and fixture helpers remain available. | F-01; test architecture constraint | TEST-PERSIST-01 |
| AC-PERSIST-02 | Applying migrations to an empty PostgreSQL database and running the seed provisions the intended customer accounts, staff account, and five menu fixtures; rerunning the seed preserves existing passwords and stock. | NFR-06; Lab 5 C-05 | TEST-PERSIST-02 |
| AC-PERSIST-03 | Order lines retain the menu item name and unit price captured at order time after the menu item is renamed or repriced. | FR-04; BR-03 | TEST-PERSIST-03 |
| AC-PERSIST-04 | Case-insensitive login creates a database session usable by a second Prisma-backed app instance; logout revokes it, and expired or revoked sessions receive 401. | FR-01; FR-02; NFR-01 | TEST-PERSIST-04 |
| AC-PERSIST-05 | Menu responses come from PostgreSQL, expose numeric prices, and report an item with zero stock as unavailable. | FR-03 | TEST-PERSIST-05 |
| AC-PERSIST-06 | A successful order uses database prices, returns the existing numeric JSON fields and snapshots, persists across app instances, and decrements stock once. | FR-04; BR-03 | TEST-PERSIST-06 |
| AC-PERSIST-07 | Empty or invalid carts and insufficient stock are rejected without order rows or partial stock changes; duplicate cart lines are checked by their combined quantity, and concurrent requests cannot oversell the final unit. | BR-01; BR-02; NFR-04 | TEST-PERSIST-07 |
| AC-PERSIST-08 | Customers can read and cancel only their own orders; cancellation succeeds only while PENDING and restores stock once. Staff can advance only PENDING → PREPARING → READY → COMPLETED; customers cannot change staff status and staff cannot cancel orders. | FR-05; FR-06; FR-07; BR-04; BR-05; BR-06 | TEST-PERSIST-08 |
| AC-PERSIST-09 | `/api/ready` returns 200 when the selected adapter is reachable and 503 when PostgreSQL is unavailable; `/api/health` remains independent of database availability. | NFR-06; Lab 5 readiness check | TEST-PERSIST-09 |

## Lab 5 integration workflow

The issue-linked feature branch is based on the existing `sprint-1-staging` branch. The feature pull request targets `sprint-1-staging` and must pass the existing `test-and-docker` check and receive written teammate review. After review and integration checks, prepare a release pull request from `sprint-1-staging` to `main`. Do not merge the release pull request or trigger deployment until the documented `toktickit` versus `quickorder` deployment target mismatch is resolved.

Record actual migration, seed, test, Docker Compose, CI, and peer-review results in the Sprint 2 evidence file. A planned check is not evidence that it passed.
