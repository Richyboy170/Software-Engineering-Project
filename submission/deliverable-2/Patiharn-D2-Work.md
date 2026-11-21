# Patiharn Deliverable 2 Work

**Author:** Patiharn Liangkobkit (`66070503489`, `@Richyboy170`)  
**Repository:** https://github.com/Richyboy170/Software-Engineering-Project  
**Feature PR:** https://github.com/Richyboy170/Software-Engineering-Project/pull/24  
**Issues:** Lab 6 #23, F-08 #22

## F-08 Receipt and Pickup Code

Patiharn implemented a persisted four-character pickup code and owner/staff-readable digital receipt.

- Schema: `pickupCode` is unique and required on `Order`.
- Migration: existing orders receive a backfilled code.
- API: `GET /api/orders/:id/receipt`.
- Access: customers may retrieve only their own receipt; staff may retrieve.
- UI: My Orders shows **Receipt / Pickup**, pickup code, items, total and print action.
- Staff UI: Kitchen Queue shows the pickup code beside the order number.

Contracts:

- [F-08 contract](../../docs/sprints/deliverable-2/f08-receipt-contract.md)
- [F-11 progress contract](../../docs/sprints/deliverable-2/f11-progress-contract.md)
- [Traceability](../../docs/sprints/deliverable-2/traceability.md)

Tests:

- `TEST-RECEIPT-01`: owner receipt and stable four-character pickup code.
- `TEST-RECEIPT-02`: cross-customer receipt returns 403.
- `TEST-F11-01`: repeated invalid login attempts return 429.
- Request-ID and security-header test is included in the authentication suite.

## F-11 Sprint 3 Progress

Patiharn added:

- login failure limiting with a 15-minute window;
- HTTP 429 and `Retry-After`;
- `X-Request-ID`;
- `X-Content-Type-Options`;
- `X-Frame-Options`;
- `Referrer-Policy`;
- structured request completion logs.

This is implementation and test progress, not a claim that all F-11 observability work is complete.

## Verification

- Server build: passed.
- Client production build: passed.
- Prisma generation: passed.
- GitHub CI: 5 test files passed, 35 tests passed.
- CI run: https://github.com/Richyboy170/Software-Engineering-Project/actions/runs/44958787735

## Lab 6 Status

Issue #23 is the independent-UAT packet. Patiharn has prepared truthful execution, defect and acceptance templates. Partner team details and partner UAT cases are not available, so independent execution and acceptance are not fabricated or marked passed.

## Remaining Patiharn/Evaluation Work

- Receive the partner UAT cases and tested release.
- Execute every partner case as the independent UAT Team.
- Record actual PASS/FAIL/BLOCKED and evidence.
- Submit reproducible findings and closure/retest records.
- Complete a final Lab 6 PDF after the partner acceptance decision exists.
- Complete final Deliverable 2 PDF assembly after Tanakrit-owned F-07/F-09/Sprint 3 work and the integrated candidate are known.
