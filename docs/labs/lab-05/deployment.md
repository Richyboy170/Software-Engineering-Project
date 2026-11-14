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
| `PORT` | Listening port for the application container | No | Cloud Run container contract | `3000` |
| `NODE_ENV` | Application environment mode | No | Injected by runtime / Docker | `production` |
| `TZ` | Container timezone | No | Injected by Dockerfile | `Asia/Bangkok` |
| `DATABASE_URL` | PostgreSQL connection string | **Yes** | Google Secret Manager (`quickorder-database-url`) | `postgresql://quickorder:PASS@/quickorder?host=/cloudsql/...` |
| `CORS_ORIGIN` | Allowed client origin | No | Environment variable | `http://localhost:5173` |
| `SESSION_SECRET`| Token encryption and signing seed | **Yes** | Google Secret Manager (`quickorder-session-secret`) | (Random 64-char hex string) |

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
| **Project ID** | GCP Project | `cpe334-sec1-team-quickorder` | Free Trial billing linked; budget alert configured. |
| **Region** | Multi-region | `asia-southeast1` | Low-latency Singapore region. |
| **Container Registry**| Artifact Registry | `quickorder` | Docker repository storing commit-tagged images. |
| **Compute Service** | Cloud Run | `quickorder` | CPU: 1, Memory: 512Mi, Min: 0, Max: 3, Port: 3000. |
| **Migration Job** | Cloud Run Jobs | `quickorder-migrate` | Ephemeral job running `prisma migrate deploy && seed`. |
| **Database** | Cloud SQL | `quickorder-pg` | PostgreSQL 16 Enterprise, `db-f1-micro`, storage auto-increase: OFF. |
| **Runtime Identity**| IAM Service Account| `quickorder-runner` | Roles: `Cloud SQL Client`, `Secret Manager Secret Accessor`. |
| **Deployer Identity**| IAM Service Account| `quickorder-deployer`| Roles: `Cloud Run Developer`, `Artifact Registry Writer`, `Service Account User`. |
| **Merge Gate** | GitHub Ruleset | `protect-main` | Requires PR, 1 approval, passing check `test-and-docker`. |

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
   - Executes automated smoke test against the live public URL (`/api/health`, `/api/ready`, `/`, `/api/categories`).
6. **Determining Running Revision Commit:**
   - Run `gcloud run services describe quickorder --region asia-southeast1 --format='value(metadata.annotations["client.knative.dev/user-image"])'`
   - Or open Cloud Run Console -> Revisions -> inspect container image tag.
