# Requirements-to-Feature-to-Sprint Traceability Matrix

**Course:** CPE 334 Deliverable 1  
**Team Members:**  
- **Patiharn Liangkobkit** (`66070503489`, GitHub: [`@Richyboy170`](https://github.com/Richyboy170))  
- **Tanakrit Sunthonwetchapong** (`67070503464`, GitHub: [`@Tanakrit-triton`](https://github.com/Tanakrit-triton))  
**Domain:** QuickOrder System

---

## 1. Traceability Matrix

| Requirement ID | Type | Requirement Summary | Feature ID & Responsibility | Planned Sprint | Verification Method / Planned Test ID |
|---|---|---|---|---|---|
| **FR-01** | FR | User Authentication (email + password) | **F-01** User Auth & Identity | **Sprint 1** | `AC-AUTH-01` / `TEST-AUTH-01` (Supertest API) |
| **FR-02** | FR | User Session & Logout | **F-01** User Auth & Identity | **Sprint 1** | `AC-AUTH-02` / `TEST-AUTH-02` (Supertest API) |
| **FR-03** | FR | Menu Catalog Browsing with Stock | **F-02** Menu Item Catalog | **Sprint 1** | `AC-MENU-01` / `TEST-MENU-01` (Supertest API + UI) |
| **FR-04** | FR | Order Placement & Total Computation | **F-03** Order Creation | **Sprint 1** | `AC-ORD-01` / `TEST-ORD-01` (Integration Test) |
| **FR-05** | FR | Customer Order History | **F-04** Order History | **Sprint 1** | `AC-ORD-02` / `TEST-ORD-02` (Supertest API + UI) |
| **FR-06** | FR | Staff Order Queue & Status Update | **F-06** Staff Kitchen Queue | **Sprint 1** | `AC-STAFF-01` / `TEST-STAFF-01` (Supertest API + UI) |
| **FR-07** | FR | Customer Order Cancellation (Pending) | **F-05** Order Cancellation | **Sprint 1** | `AC-ORD-03` / `TEST-ORD-03` (Integration Test) |
| **FR-08** | FR | Menu Item & Stock Management | **F-07** Menu Inventory Management | **Sprint 2** | Sprint 2 Contract & Test Suite |
| **FR-09** | FR | Order Receipt & Pickup Code | **F-08** Digital Order Receipt | **Sprint 2** | Sprint 2 Contract & Test Suite |
| **FR-10** | FR | Sales Reporting & Analytics | **F-10** Sales Analytics | **Sprint 3** | Sprint 3 Contract & Test Suite |
| **BR-01** | BR | Order Must Have $\ge 1$ Positive Item | **F-03** Order Creation | **Sprint 1** | `AC-ORD-04` / `TEST-ORD-04` (Unit + API Test) |
| **BR-02** | BR | Insufficient Stock Rejection | **F-03** Order Creation | **Sprint 1** | `AC-ORD-05` / `TEST-ORD-05` (Integration Test) |
| **BR-03** | BR | Server-Authoritative Price Calculation | **F-03** Order Creation | **Sprint 1** | `AC-ORD-06` / `TEST-ORD-06` (API Price Tamper Test) |
| **BR-04** | BR | Customer Data Isolation (No cross-access) | **F-04** Order History | **Sprint 1** | `AC-SEC-01` / `TEST-SEC-01` (Forbidden Access Test) |
| **BR-05** | BR | Cancel Allowed Only When PENDING | **F-05** Order Cancellation | **Sprint 1** | `AC-ORD-07` / `TEST-ORD-07` (Status Boundary Test) |
| **BR-06** | BR | Only Staff May Promote Status | **F-06** Staff Kitchen Queue | **Sprint 1** | `AC-SEC-02` / `TEST-SEC-02` (Role Permission Test) |
| **NFR-01** | NFR | Protected Endpoints Reject Unauth (401) | System Responsibility: Auth Middleware | **Sprint 1** | `AC-SEC-03` / `TEST-SEC-03` (Supertest API Security) |
| **NFR-02** | NFR | Customer Forbidden on Staff Endpoints (403) | System Responsibility: Role Middleware | **Sprint 1** | `AC-SEC-04` / `TEST-SEC-04` (Supertest API Security) |
| **NFR-03** | NFR | Response Time $\le 200\text{ ms}$ | System Responsibility: API Layer | **Sprint 1** | `AC-PERF-01` / `TEST-PERF-01` (API Benchmark) |
| **NFR-04** | NFR | Zero Negative Stock Tolerance | **F-09** Concurrency Locking | **Sprint 2** | Concurrency Test Suite |
| **NFR-05** | NFR | Container Packaging & Zero Hardcoded Secrets | System Responsibility: DevOps / Docker | **Sprint 1** / Lab 5 | GitHub Actions CI `test-and-docker` |
| **NFR-06** | NFR | Data Persistence across Container Restart | System Responsibility: Cloud SQL / Storage | Lab 5 | Lab 5 Verification Check `C-05` |

---

## 2. Coverage Gaps and Scope Baseline Analysis

- **Sprint 1 Coverage:**  
  Covers **100%** of foundational requirements: Authentication (`FR-01`, `FR-02`), Menu Catalog (`FR-03`), Order Submission & Retrieval (`FR-04`, `FR-05`), Staff Queue (`FR-06`), Order Cancellation (`FR-07`), all core Business Rules (`BR-01` to `BR-06`), and baseline security/performance NFRs (`NFR-01`, `NFR-02`, `NFR-03`, `NFR-05`).
- **Sprint 2 Coverage:**  
  Covers expansion features: Staff-side menu editing/restocking (`FR-08`), printable digital receipt (`FR-09`), and high-concurrency race condition testing (`NFR-04`).
- **Sprint 3 Coverage:**  
  Covers product hardening: Analytics dashboard (`FR-10`), structured audit logging, rate limiting, and final release tuning (`F-11`).
- **Explicit Exclusions / Approved Deferrals:**  
  Third-party payment gateways and physical thermal printing hardware are excluded from product scope by architectural design decision. Simulated payment confirmations are utilized.

## 3. Sprint 2 Persistence Foundation Traceability

The persistence foundation in [Issue #4](https://github.com/Richyboy170/Software-Engineering-Project/issues/4) makes the existing F-01 through F-06 journey durable before Sprint 2 expansion work. The acceptance IDs below are defined in the [Sprint 2 persistence contract](./sprints/sprint-2/persistence-spec.md).

| Acceptance ID | Source requirement / rule | Persistence behavior | Verification test |
|---|---|---|---|
| `AC-PERSIST-01` | F-01; test architecture constraint | Two apps can share the in-memory adapter without changing fixture-based tests. | `TEST-PERSIST-01` |
| `AC-PERSIST-02` | NFR-06; Lab 5 C-05 | Migrations and idempotent seed provision the PostgreSQL demo fixtures. | `TEST-PERSIST-02` |
| `AC-PERSIST-03` | FR-04; BR-03 | Order lines preserve the name and price captured at order time. | `TEST-PERSIST-03` |
| `AC-PERSIST-04` | FR-01; FR-02; NFR-01 | Login, cross-instance session lookup, expiry, and logout revocation use PostgreSQL. | `TEST-PERSIST-04` |
| `AC-PERSIST-05` | FR-03 | Menu reads return database-backed stock availability and numeric prices. | `TEST-PERSIST-05` |
| `AC-PERSIST-06` | FR-04; BR-03 | Successful orders use database prices, persist across instances, and reserve stock once. | `TEST-PERSIST-06` |
| `AC-PERSIST-07` | BR-01; BR-02; NFR-04 | Invalid, insufficient, duplicate-line, and final-unit race cases cannot partially write or oversell. | `TEST-PERSIST-07` |
| `AC-PERSIST-08` | FR-05; FR-06; FR-07; BR-04; BR-05; BR-06 | Customer ownership and pending-only cancellation, one-time stock restoration, and staff-only forward status changes remain enforced. | `TEST-PERSIST-08` |
| `AC-PERSIST-09` | NFR-06; Lab 5 readiness check | Readiness reflects database connectivity while liveness remains independent. | `TEST-PERSIST-09` |
