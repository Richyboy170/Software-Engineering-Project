# Deliverable 2 Patiharn Status

## Implemented

- F-08 pickup code and digital receipt API/UI.
- F-11 login attempt protection and security/request observability headers.
- Lab 6 evidence templates and partner dependency disclosure.

## Verified

- Server TypeScript build passed.
- Client TypeScript/Vite production build passed.
- Prisma 5.22 client generated locally.
- GitHub CI will verify the test suite and Docker build.

## Not yet verified locally

- Vitest/Supertest loopback tests are blocked by the active OS sandbox with `EACCES 127.0.0.1:<port>`.
- No result is claimed for those tests until the GitHub CI runner or an authorized environment executes them.

## Partner-blocked

- Independent partner UAT cases and actual execution.
- Partner defect reports and re-tests.
- Independent partner acceptance decision.

## Remaining

- Tanakrit-owned F-07/F-09/Sprint 3 work.
- Complete candidate release on `main`.
- Final PDF assembly after actual evidence exists.
