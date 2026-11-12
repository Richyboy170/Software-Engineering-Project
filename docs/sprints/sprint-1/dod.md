# Sprint 1 Product Definition of Done (DoD)

**Course:** CPE 334 Deliverable 1  
**Team Members:**  
- **Patiharn Liangkobkit** (`66070503489`, GitHub: [`@Richyboy170`](https://github.com/Richyboy170))  
- **Tanakrit Sunthonwetchapong** (`67070503464`, GitHub: [`@Tanakrit-triton`](https://github.com/Tanakrit-triton))  
**Domain:** QuickOrder System

---

## 1. Definition of Done Checklist

Before any feature increment or release PR is merged into `staging` and ultimately into `main`, every item in this Definition of Done must be fulfilled and supported by verifiable execution evidence:

### 1.1 Specification & Design
- [x] Feature engineering contract documented in `docs/sprints/sprint-1/feature-spec.md` prior to code implementation.
- [x] Acceptance criteria assigned stable IDs (`AC-*`) with observable outcomes, including boundary conditions and negative test scenarios.
- [x] Traceability mapped between functional requirements (`FR-*`), business rules (`BR-*`), features (`F-*`), and test IDs (`TEST-*`) in `docs/traceability.md`.

### 1.2 Implementation & Code Quality
- [x] Full vertical slice implemented: UI components, REST API endpoints, and Prisma database schema.
- [x] Business rules (`BR-01` to `BR-06`) enforced authoritatively on the backend, not solely in client UI logic.
- [x] Zero hardcoded secrets, database passwords, or private keys committed to the Git repository.
- [x] All environment variables documented with example placeholder values in `.env.example`.

### 1.3 Testing & TDD Verification
- [x] Automated unit and integration tests created for every feature contract.
- [x] Test-Driven Development (TDD) discipline applied: test failure verified before implementation and passing status verified afterward.
- [x] Real API and database integration verified (positive flow, out-of-stock rejection, unauthenticated rejection, cross-user forbidden access).
- [x] 100% of required test suite passes cleanly with zero disabled or skipped critical assertions.

### 1.4 Code Review & Team Collaboration
- [x] Every change implemented on an isolated feature branch branched from `sprint-1-staging`.
- [x] Feature Pull Request opened into `sprint-1-staging`, explicitly linked to its GitHub Issue.
- [x] Teammate review performed: author never approves their own PR; reviewer records specific checks, questions, or findings in the PR review comments.
- [x] Staging branch integrated and tested before the final release PR is merged into `main`.

### 1.5 Documentation & Reproducibility
- [x] Root `README.md` updated with exact dependencies, local installation steps, database migration commands, and seed execution.
- [x] Safe local seed test accounts documented for TA and peer evaluation.
- [x] Dockerfile and `docker-compose.yml` verified to build and run from a clean clone.
