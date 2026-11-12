# Sprint 1 Verification, Evidence Guide & Contribution Record

**Course:** CPE 334 Deliverable 1  
**Team Members:**  
- **Patiharn Liangkobkit** (`66070503489`, GitHub: [`@Richyboy170`](https://github.com/Richyboy170))  
- **Tanakrit Sunthonwetchapong** (`67070503464`, GitHub: [`@Tanakrit-triton`](https://github.com/Tanakrit-triton))  
**Repository:** [Richyboy170/Software-Engineering-Project](https://github.com/Richyboy170/Software-Engineering-Project)  
**Release Target:** Sprint 1 Release on `main`  
**Domain:** QuickOrder System

---

## 1. Program Demonstration Scenarios

### Scenario 1: Normal Domain Journey (Customer Order & Persistence)
- **Feature / AC IDs:** `F-01`, `F-02`, `F-03`, `F-04` | `AC-AUTH-01`, `AC-MENU-01`, `AC-ORD-01`, `AC-SEC-01`
- **User Role:** `CUSTOMER` (`customer@quickorder.local`)
- **Starting Condition:** Database seeded with active menu items ("Classic Cheeseburger", price 149.00, stock 20).
- **Steps:**
  1. Customer signs in via `/login` with seeded credentials.
  2. Customer navigates to Menu Catalog, observes available burger stock (20).
  3. Customer adds 2 burgers to cart and submits order.
  4. Server calculates total price (298.00) and returns order #ORD-101 in `PENDING` status.
  5. Customer navigates to My Orders; order #ORD-101 is retrieved and displayed.
- **Expected Result:** Order is saved in the database with status `PENDING`, total price 298.00, and burger stock decreases from 20 to 18.
- **Actual Result:** Order created successfully with HTTP 201; stock decremented to 18; persisted order retrieved via `GET /api/orders/my`.

### Scenario 2: Business Rule Rejection (Insufficient Stock Boundary)
- **Feature / AC IDs:** `F-03` | `AC-ORD-03`, `BR-02`
- **User Role:** `CUSTOMER`
- **Starting Condition:** Item "Truffle Fries" has only 2 units in stock.
- **Steps:**
  1. Customer attempts to place an order requesting 5 units of Truffle Fries.
  2. Server receives payload and checks available stock inside transaction.
- **Expected Result:** Order is rejected with HTTP 400 Bad Request and error code `INSUFFICIENT_STOCK`. No order is inserted and stock remains 2.
- **Actual Result:** Server returns HTTP 400 with message `"Requested quantity exceeds available stock."`; database transaction rollbacks cleanly.

### Scenario 3: Access Control & Role Protection (Cross-User & Non-Staff Rejection)
- **Feature / AC IDs:** `F-04`, `F-06` | `AC-SEC-02`, `AC-STAFF-02`, `BR-04`, `BR-06`, `NFR-01`, `NFR-02`
- **User Role:** `CUSTOMER` (Customer A)
- **Starting Condition:** Order #ORD-200 belongs to Customer B.
- **Steps:**
  1. Customer A requests `GET /api/orders/ORD-200`.
  2. Customer A attempts `PATCH /api/orders/ORD-200/status` to advance status to `PREPARING`.
- **Expected Result:**
  - `GET /api/orders/ORD-200` is rejected with HTTP 403 Forbidden without disclosing order contents.
  - `PATCH /api/orders/ORD-200/status` is rejected with HTTP 403 Forbidden because only `STAFF` may update status.
- **Actual Result:** Backend auth middleware verifies ownership and role, enforcing HTTP 403 Forbidden on both requests.

---

## 2. Test Execution & Results Mapping

| Acceptance Criteria | Planned Test ID | Test Suite File | Type | Result |
|---|---|---|---|---|
| `AC-AUTH-01` | `TEST-AUTH-01` | `server/tests/auth.test.ts` | Integration / Supertest | **PASS** |
| `AC-AUTH-02` | `TEST-AUTH-02` | `server/tests/auth.test.ts` | Integration / Supertest | **PASS** |
| `AC-AUTH-03` | `TEST-AUTH-03` | `server/tests/auth.test.ts` | Integration / Supertest | **PASS** |
| `AC-AUTH-04` | `TEST-AUTH-04` | `server/tests/auth.test.ts` | Integration / Supertest | **PASS** |
| `AC-MENU-01` | `TEST-MENU-01` | `server/tests/order.test.ts` | Integration / Supertest | **PASS** |
| `AC-ORD-01` | `TEST-ORD-01` | `server/tests/order.test.ts` | Integration / Database | **PASS** |
| `AC-ORD-02` | `TEST-ORD-02` | `server/tests/order.test.ts` | Unit / Validation | **PASS** |
| `AC-ORD-03` | `TEST-ORD-03` | `server/tests/order.test.ts` | Integration / Transaction | **PASS** |
| `AC-ORD-04` | `TEST-ORD-04` | `server/tests/order.test.ts` | Integration / Supertest | **PASS** |
| `AC-ORD-05` | `TEST-ORD-05` | `server/tests/order.test.ts` | Integration / Database | **PASS** |
| `AC-ORD-06` | `TEST-ORD-06` | `server/tests/order.test.ts` | Integration / State Machine | **PASS** |
| `AC-SEC-01` | `TEST-SEC-01` | `server/tests/permissions.test.ts` | Security / Access Control | **PASS** |
| `AC-SEC-02` | `TEST-SEC-02` | `server/tests/permissions.test.ts` | Security / Role Guard | **PASS** |
| `AC-SEC-03` | `TEST-SEC-03` | `server/tests/permissions.test.ts` | Security / Middleware | **PASS** |
| `AC-STAFF-01`| `TEST-STAFF-01`| `server/tests/permissions.test.ts` | Integration / Supertest | **PASS** |
| `AC-STAFF-03`| `TEST-STAFF-02`| `server/tests/permissions.test.ts` | Integration / Supertest | **PASS** |

---

## 3. Git Workflow & Peer Review Evidence

Following CPE 334 branch and review discipline:
- Staging branch: `sprint-1-staging`
- Production release branch: `main`

### Issue & Pull Request Tracking

| Issue # | Title | Branch | Author | Reviewer | Review Focus & Finding | Staging PR | Main Release PR |
|---|---|---|---|---|---|---|---|
| **#1** | Part A-E Documentation Baseline | `docs/sprint-1-baseline` | Patiharn (`Richyboy170`) | Tanakrit (`Tanakrit-triton`) | Verified requirement IDs, traceability mapping, and role-permission matrix consistency. Approved. | PR #2 | Release PR #6 |
| **#2** | Backend API & Data Model Vertical Slice | `feature/order-backend` | Tanakrit (`Tanakrit-triton`) | Patiharn (`Richyboy170`) | Verified Prisma transaction rollback on out-of-stock and server-side price calculation. Approved. | PR #3 | Release PR #6 |
| **#3** | Security, Auth Middleware & Tests | `feature/auth-and-tests` | Patiharn (`Richyboy170`) | Tanakrit (`Tanakrit-triton`) | Verified customer data isolation (User A vs User B) and 401/403 HTTP status responses. Approved. | PR #4 | Release PR #6 |
| **#4** | Frontend Customer & Staff Web UI | `feature/order-frontend` | Tanakrit (`Tanakrit-triton`) | Patiharn (`Richyboy170`) | Verified responsive cart controls, loading/empty states, and cancel button enabling. Approved. | PR #5 | Release PR #6 |

---

## 4. Team Contribution Table

| Member | Primary Responsibilities & Contributions |
|---|---|
| **Patiharn Liangkobkit** (`66070503489`) | - System-level SDS and architecture design (`docs/system-sds.md`).<br>- Authentication and authorization middleware (`server/src/middleware/auth.middleware.ts`).<br>- Security and role permission test suite (`server/tests/permissions.test.ts`).<br>- Docker containerization, `.env.example`, and Lab 5 deployment configuration.<br>- Peer code review on backend ordering and frontend PRs. |
| **Tanakrit Sunthonwetchapong** (`67070503464`) | - Software Requirements Specification (`docs/srs.md`) & Traceability (`docs/traceability.md`).<br>- Prisma data schema design and seed script (`prisma/schema.prisma`, `prisma/seed.ts`).<br>- Core order placement, stock deduction, and status transition API (`server/src/routes/order.routes.ts`).<br>- Frontend React interface for Menu Catalog, Cart, and Kitchen Queue.<br>- Peer review on documentation and auth test PRs. |

---

## 5. AI Use Declaration

- **AI Tools Used:** Claude / Gemini AI Coding Agents via Google Antigravity IDE.
- **Purposes:** Drafting formal specification documentation tables, generating TypeScript interfaces, structuring Prisma relational models, and designing comprehensive boundary test suites.
- **Human Accountability:** Both team members reviewed every generated schema definition, verified that all business rules are enforced authoritatively on the backend, validated test execution results independently, and conducted reciprocal peer reviews on all pull requests.
