# Deployment Specification & Runbook (Lab 5 & GCP CI/CD)

**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Team:**  
- **Patiharn Liangkobkit** (`66070503489`, GitHub: [`@Richyboy170`](https://github.com/Richyboy170))  
- **Tanakrit Sunthonwetchapong** (`67070503464`, GitHub: [`@Tanakrit-triton`](https://github.com/Tanakrit-triton))  
**Repository:** [Richyboy170/Software-Engineering-Project](https://github.com/Richyboy170/Software-Engineering-Project)  
**Domain:** QuickOrder Ordering Platform  
**Target Architecture:** Google Cloud Run + Cloud SQL (PostgreSQL 16) + Secret Manager + Workload Identity Federation

---

## 1. Selected Stack & Changes from Reference

| Layer | Selected Technology | Deviation / Change from Course Reference |
|---|---|---|
| **Frontend** | React 18, Vite, TypeScript | Pure modern responsive CSS and SPA routing; zero heavyweight external UI component dependencies. |
| **Backend API**| Express 4, Node.js 24, TypeScript | Modular router design with typed session middleware; server-side authoritative price calculation. |
| **ORM & Database**| Prisma 5, PostgreSQL 16 | Relational schema with transactional atomic stock reservation and foreign key cascades. |
| **Container** | Docker multi-stage Alpine build | Unified container serving both Express API and React static build on port 3000. |
| **Cloud Hosting**| Google Cloud Run | Serverless scaling with min instances = 0 and max instances = 3 for budget safety. |
| **CI/CD** | GitHub Actions | Workload Identity Federation (keyless OIDC authentication), branch protection merge gates. |

---

## 2. Environment Variables Specification

No real secrets are committed to Git. All runtime settings are supplied via environment variables or Secret Manager:

| Variable Name | Purpose / Description | Secret? | Source / Where Value Comes From | Example / Default |
|---|---|:---:|---|---|
| `PORT` | Listening port for the application container (`server/src/index.ts`) | No | Cloud Run container contract | `3000` |
| `NODE_ENV` | Application environment mode (`server/src/index.ts`, `server/src/db.ts`, `server/src/persistence/runtime.ts`, `server/prisma/seed.ts`) | No | Set by `deploy/deploy.sh` / Docker | `production` |
| `DATABASE_URL` | PostgreSQL connection string (read by Prisma via `server/prisma/schema.prisma`) | **Yes** | Google Secret Manager (`quickorder-database-url`) | `postgresql://USER:PASS@/quickorder?host=/cloudsql/PROJECT:REGION:INSTANCE` |
| `DEMO_USER_PASSWORD` | Password for seeded demo users (`server/prisma/seed.ts`); required when `NODE_ENV=production`, falls back to a dev-only default otherwise | **Yes** | Google Secret Manager (`quickorder-demo-password`), injected into the migrate/seed job by `deploy/deploy.sh --demo` | `replace-with-demo-password` |
| `SEED_DEMO_DATA` | In production, demo users are seeded only when this is `true` (`prisma/seed.ts`). | No | Set by `deploy/deploy.sh` (`true` with `--demo`, otherwise `false`) | `false` |
| `TZ` | Container timezone; read by the Node.js runtime, not by app code | No | Set by the Dockerfiles and `deploy/deploy.sh` | `Asia/Bangkok` |
| `ADMIN_PASSWORD` | Created by `deploy/deploy.sh` as Secret Manager secret `quickorder-admin-password` and passed to the migrate job; not read by the current app (no admin role in Sprint 1). | **Yes** | Google Secret Manager (`quickorder-admin-password`) | `replace-with-admin-password` |

---

## 3. Operational Commands

### 3.1 Local Development
```bash
# Install root, server, and client dependencies
npm install
cd server && npm install
cd ../client && npm install

# Generate the Prisma client, apply committed migrations, and seed
cd server
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed

# Start backend in watch mode (localhost:3000)
npm run dev

# In a separate terminal, start frontend (localhost:5173)
cd client
npm run dev
```

### 3.2 Running Automated Tests
```bash
# Set DATABASE_URL to the PostgreSQL 16 test database, then migrate and seed it.
cd server
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed

# Run backend test suite (in-memory unit tests and PostgreSQL integration checks)
npm test

# Run frontend build check
cd client
npm run build
```

### 3.3 Running Locally with Docker Compose
```bash
# Build and run Postgres, migration job, backend, and frontend
# If port 5173 is occupied, set CLIENT_PORT=5174 before this command.
docker compose up --build -d

# Verify all containers are running and healthy
docker compose ps -a

# Check API health
curl.exe http://localhost:3000/api/health
curl.exe http://localhost:3000/api/ready

# Readiness should report 503 while PostgreSQL is stopped; health stays 200.
docker compose stop db
curl.exe -i http://localhost:3000/api/ready
curl.exe -i http://localhost:3000/api/health
docker compose start db

# Tear down containers but keep database volume
docker compose down

# Clean teardown including database volume
docker compose down -v
```

---

## 4. Google Cloud Platform (GCP) Resource Allocation

| Resource | GCP Service | Resource Name / ID | Configuration Details |
|---|---|---|---|
| **Project ID** | GCP Project | `cpe334-quickorder` | Owner: Tanakrit. Billing account uses the welcome credit (a refundable THB 1,000 prepayment was required by the payment method). Alerts-only budget `CPE334-Alert` (USD 50, 50/90/100%, until 15 Dec 2026). |
| **Region** | Single region | `asia-southeast1` | Singapore. |
| **Container Registry** | Artifact Registry | `quickorder` | Docker repository; images are tagged with the commit SHA by `deploy.yml` (`:latest` from the first manual deploy). |
| **Compute Service** | Cloud Run | `quickorder` | CPU 1, memory 512Mi, min 0, max 3, port 3000, public (`--allow-unauthenticated`). |
| **Migration Job** | Cloud Run Jobs | `quickorder-migrate` | Runs `npx prisma migrate deploy && npm run prisma:seed` before the service is updated. |
| **Database** | Cloud SQL | `quickorder-pg` | PostgreSQL 16, Enterprise, `db-f1-micro`, 10 GB SSD, storage auto-increase OFF, database `quickorder`. |
| **Runtime Identity** | IAM Service Account | `quickorder-runner` | Project role `Cloud SQL Client` only; `Secret Manager Secret Accessor` granted on each of the three secrets individually. |
| **Secrets** | Secret Manager | `quickorder-database-url`, `quickorder-demo-password`, `quickorder-admin-password` | Generated by `deploy/deploy.sh`; values never stored in Git. |
| **Team access** | IAM | Tanakrit (Owner), Patiharn (Editor) | Editor so that both members can deploy and configure WIF. The default compute service account (Editor) is created by Google and used by Cloud Build. |
| **Deployer Identity** | IAM Service Account + WIF | `quickorder-deployer@cpe334-quickorder.iam.gserviceaccount.com` via `projects/507393643031/locations/global/workloadIdentityPools/github-actions/providers/github-main` | Keyless GitHub Actions login; no JSON key. |
| **Merge Gate** | GitHub Ruleset | `protect-main`, `protect-sprint1-release` | Required check `test-and-docker` and 1 approval on `main` and `sprint-1-staging`. |

### 4.1 Live deployment record

| Item | Value |
|---|---|
| Public URL | https://quickorder-fzeemousqa-as.a.run.app |
| First deploy | 20 Nov 2026, manual `deploy/deploy.sh --demo` from Cloud Shell on `sprint-1-staging` commit `b12daeb` (Episode 5). `main` was still the pre-persistence Sprint 1 commit, so the first deploy used staging; pipeline releases from `main` start in Episode 7. |
| Revisions | `quickorder-00001-str` (first deploy), `quickorder-00002-7s8` (restart check), `quickorder-00003-55s` (pipeline release of `12c18be`) |
| Migration | `quickorder-migrate-h9j95` completed (1 migration applied, 3 demo users and 5 menu items seeded) |
| Checks | `/api/health` ok; `/api/ready` db=connected; `/api/menu` returns seeded rows; C-04 and C-05 (restart) recorded in Issue #15 |

---

## 5. Repeatable Release Procedure & Verification

1. **Feature Branching:** Developers create feature branches from `sprint-1-staging` (e.g. `feature/order-summary`).
2. **Pull Request & CI Quality Gate:** PR opened into `sprint-1-staging`. GitHub Actions runs `test-and-docker` (unit tests, integration tests, Docker build).
3. **Peer Review:** Teammate reviews code changes, tests, and leaves written findings before approval.
4. **Release PR:** Release PR opened from `sprint-1-staging` into `main`.
5. **Deployment Automation:** Merge into `main` automatically triggers `deploy.yml`:
   - Builds container tagged with full 40-character commit SHA.
   - Pushes image to Artifact Registry and resolves image digest.
   - Executes Cloud Run migration job.
   - Updates Cloud Run service with zero downtime.
   - Executes automated smoke test against the live public URL (`/api/health`, `/api/ready`, `/`, `/api/menu`; optional login when `SMOKE_EMAIL`/`SMOKE_PASSWORD` are set).
6. **Determining Running Revision Commit:**
   - Run `gcloud run services describe quickorder --region asia-southeast1 --format='value(metadata.annotations["client.knative.dev/user-image"])'`
   - Or open Cloud Run Console -> Revisions -> inspect container image tag.

## 6. CI, Quality Gates, and Release Evidence

The required pull-request check is the `test-and-docker` job in
[ci-docker.yml](../../../.github/workflows/ci-docker.yml). It must pass backend
tests against PostgreSQL, the frontend build, deployment-script syntax and
offline tests, and the production Docker build before a pull request can merge.
The branch ruleset for `main` requires this check and a peer approval.

For the Lab 5 evidence, record:

- one normal pull-request run where `test-and-docker` passes;
- one deliberately failing pull-request change where the required check fails
  and the pull request is blocked, without merging that change;
- the successful release workflow run after the staging-to-main release;
- the commit SHA/image tag, resolved image digest, Cloud Run revision, public URL,
  and smoke-test results;
- for rollback, the manually entered 40-character image tag and the workflow
  result showing that migration was skipped.

Keep Patiharn's CI and release screenshots or source notes in
`submission/lab5/evidence/patiharn/`. Do not claim that a check or deployment
passed until its GitHub Actions or Cloud Run result has been captured.
