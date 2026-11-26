# Deliverable 2 Patiharn Status

## Implemented

- F-08 pickup code and digital receipt API/UI.
- F-11 login attempt protection and security/request observability headers.
- Lab 6 evidence templates and partner dependency disclosure.

## Verified

- Server TypeScript build passed.
- Client TypeScript/Vite production build passed.
- Prisma 5.22 client generated locally.
- Prisma schema validates with a placeholder PostgreSQL URL.
- Latest server test run: 29 passed; 8 database integration tests skipped
  because `DATABASE_URL` is not set. Earlier GitHub CI evidence recorded 35/35.

## Not yet verified with a database

- Prisma-backed integration tests, including the P2002 retry case, were skipped
  because no `DATABASE_URL` is configured locally.

## Partner-blocked

- Independent partner UAT cases and actual execution.
- Partner defect reports and re-tests.
- Independent partner acceptance decision.
- Merge to `main` / auto-deployment is held until the partner retest and
  acceptance are recorded (target: 27 November 2026); any Lab 6 fix release
  must remain Sprint 1 only.

## Remaining

- Tanakrit-owned F-07/F-09/Sprint 3 work.
- Complete candidate release on `main`.
- Final PDF assembly after actual evidence exists.

## Disclosures

- The F-08/F-11 contracts and implementation were added in the same commit
  (`1986b1e`); no earlier contract commit or red/green evidence is recorded.
  This sequencing deviation is disclosed in the F-11 progress contract.
- The login limiter is process-local, keyed by request IP and normalized
  email, and is not shared across Cloud Run instances. Repeated failures from
  one IP can lock out an account, and process restarts clear the counters.
