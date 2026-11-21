# Sprint 2 Persistence Evidence

**Issue:** [#4 — Sprint 2: Persist QuickOrder state with Prisma and PostgreSQL](https://github.com/Richyboy170/Software-Engineering-Project/issues/4)

**Feature branch:** `feature/prisma-persistence` → `sprint-1-staging`

**Local verification date:** 2026-11-13

## Database setup

- `npx prisma validate` and `npx prisma generate` completed successfully.
- `npx prisma migrate deploy` applied the initial persistence migration. A subsequent deployment reported no pending migrations.
- The seed completed with three users and five menu items. A repeat-run check confirmed that an existing password hash and menu stock were preserved.

## Backend checks

With the local PostgreSQL `DATABASE_URL` configured:

```text
npm --prefix server test
Test Files  5 passed (5)
     Tests  32 passed (32)
```

`npm --prefix server run build` completed successfully.

The first independent code review found that the cancellation route did not restrict callers to the `CUSTOMER` role. A PostgreSQL regression test reproduced a staff-owned pending order being cancelled with HTTP 200. The route now returns HTTP 403 for staff and the test confirms the order remains pending and stock unchanged. The snapshot test also asserts exact numeric `unitPrice` and `subtotal` values.

After these review fixes, the focused Prisma integration suite passed 9/9 tests, and the complete backend suite passed again with 32/32 tests across five files. The backend build passed again.

The Compose images were rebuilt from the reviewed source after the authorization fix. Startup completed with exit code 0; the migration container exited 0, PostgreSQL was healthy, the server and client were running, and the frontend, `/api/health`, and `/api/ready` returned HTTP 200.

## Docker Compose checks

The first client image build exposed that `COPY . .` copied Windows `node_modules` over the Linux dependencies installed in the image. Adding `client/.dockerignore` fixed the build context, and both client and backend images then built successfully.

An unrelated local container already used host port 5173. Compose now accepts `CLIENT_PORT`; running `$env:CLIENT_PORT='5174'; docker compose up --build -d` completed with exit code 0. `docker compose ps -a` showed PostgreSQL healthy, the migration container exited with code 0, and the server and client running. Migration output said no migrations were pending; the seed reported three users and five menu items.

The frontend returned HTTP 200 at `http://127.0.0.1:5174/`. With PostgreSQL running, `/api/health` and `/api/ready` both returned HTTP 200. With the PostgreSQL container stopped, `/api/health` remained HTTP 200 and `/api/ready` returned HTTP 503 with `{"status":"not_ready","db":"disconnected"}`. After PostgreSQL restarted, `/api/ready` returned HTTP 200 with `{"status":"ready","db":"connected"}`.

## GitHub review gate

The feature PR, [#5: feat: Persist QuickOrder state with Prisma](https://github.com/Richyboy170/Software-Engineering-Project/pull/5), is open against `sprint-1-staging`. GitHub Actions [`test-and-docker`](https://github.com/Richyboy170/Software-Engineering-Project/actions/runs/43370453753/job/131704720807) passed.

The documented teammate account `Tanakrit-triton` could not be requested: GitHub returned HTTP 422 because the account is not a repository collaborator. The repository collaborator list contains only `Richyboy170`. Teammate review and the release PR remain pending. Do not merge to `main` or deploy until the Lab 5 review gate and documented GCP target mismatch are resolved. The independent pre-PR review findings were addressed locally.
