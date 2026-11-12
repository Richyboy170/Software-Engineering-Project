# Software Test Specification (STS) - Sprint 1

**Course:** CPE 334 Deliverable 1  
**Team Members:**  
- **Patiharn Liangkobkit** (`66070503489`, GitHub: [`@Richyboy170`](https://github.com/Richyboy170))  
- **Tanakrit Sunthonwetchapong** (`67070503464`, GitHub: [`@Tanakrit-triton`](https://github.com/Tanakrit-triton))  
**Domain:** QuickOrder System

---

## 1. Test Suite Overview & Verification Mapping

| Test ID | Linked AC | Test Level | Preconditions / Input | Executed Action | Expected Result |
|---|---|---|---|---|---|
| **TEST-AUTH-01** | `AC-AUTH-01` | Integration / API | Seeded Customer account (`customer@quickorder.local`, `Password123!`). | `POST /api/auth/login` with correct email & password. | HTTP 200, valid session token returned, `user.role == "CUSTOMER"`. |
| **TEST-AUTH-02** | `AC-AUTH-02` | Integration / API | None. | `POST /api/auth/login` with wrong password (`WrongPass!`). | HTTP 401 Unauthorized, error code `INVALID_CREDENTIALS`. |
| **TEST-AUTH-03** | `AC-AUTH-03` | Integration / API | Authenticated customer session token. | `GET /api/auth/me` with `Bearer <token>`. | HTTP 200, matching customer ID, email, and role. |
| **TEST-AUTH-04** | `AC-AUTH-04` | Integration / API | Authenticated session token. | `POST /api/auth/logout`, then subsequent `GET /api/auth/me`. | First call returns HTTP 200; subsequent call returns HTTP 401 Unauthorized. |
| **TEST-MENU-01** | `AC-MENU-01` | Integration / API | Database seeded with menu items. | `GET /api/menu` without auth header. | HTTP 200, array of items with id, name, price, stock $\ge 0$. |
| **TEST-ORD-01** | `AC-ORD-01` | Integration / API | Customer token, item stock = 10. | `POST /api/orders` requesting quantity = 2. | HTTP 201 Created, status `PENDING`, server calculates correct total, stock reduced to 8. |
| **TEST-ORD-02** | `AC-ORD-02` | Unit / API | Customer token. | `POST /api/orders` with empty `items: []` or `quantity: 0`. | HTTP 400 Bad Request, error `INVALID_ITEMS` (`BR-01`). |
| **TEST-ORD-03** | `AC-ORD-03` | Integration / API | Item has available stock = 1. | `POST /api/orders` requesting quantity = 5. | HTTP 400 Bad Request, error `INSUFFICIENT_STOCK`, stock remains 1 (`BR-02`). |
| **TEST-ORD-04** | `AC-ORD-04` | Integration / API | Item DB price = $149.00$. Customer payload injects `unitPrice: 1.00`. | `POST /api/orders` with tampered pricing. | Stored order and response reflect $149.00 \times \text{qty}$, tampered price discarded (`BR-03`). |
| **TEST-ORD-05** | `AC-ORD-05` | Integration / API | Customer owns an order in `PENDING` state with item qty = 2. | `POST /api/orders/:id/cancel` by owner. | HTTP 200, order status becomes `CANCELLED`, item stock restored (+2). |
| **TEST-ORD-06** | `AC-ORD-06` | Integration / API | Order status is `PREPARING` (advanced by staff). | Customer attempts `POST /api/orders/:id/cancel`. | HTTP 400 Bad Request, error `INVALID_TRANSITION`, order stays `PREPARING` (`BR-05`). |
| **TEST-SEC-01** | `AC-SEC-01` | Integration / API | Customer A logged in. Order #200 belongs to Customer B. | Customer A calls `GET /api/orders/200`. | HTTP 403 Forbidden without exposing Customer B's order details (`BR-04`). |
| **TEST-SEC-02** | `AC-SEC-02` | Integration / API | Customer token. | Customer calls `PATCH /api/orders/:id/status` or `GET /api/orders`. | HTTP 403 Forbidden, role guard rejects non-staff access (`BR-06`, `NFR-02`). |
| **TEST-SEC-03** | `AC-SEC-03` | Integration / API | No Authorization header. | Unauthenticated request to `POST /api/orders`. | HTTP 401 Unauthorized (`NFR-01`). |
| **TEST-STAFF-01**| `AC-STAFF-01`| Integration / API | Staff token (`staff@quickorder.local`). | `GET /api/orders` | HTTP 200, returns full list of orders across all customers. |
| **TEST-STAFF-02**| `AC-STAFF-03`| Integration / API | Staff token, order in `PENDING`. | `PATCH /api/orders/:id/status` to `PREPARING`. | HTTP 200, order status updated to `PREPARING`. |
| **TEST-E2E-01** | System Flow | E2E / UI | Clean seeded test environment. | 1. Customer login<br>2. Browse menu<br>3. Add 2 burgers to cart<br>4. Submit order<br>5. Check status in My Orders. | Order appears in My Orders with `PENDING` status and correct price. |
| **TEST-E2E-02** | System Flow | E2E / UI | Staff user logged in. | 1. Open Kitchen Queue<br>2. View customer's order<br>3. Advance to PREPARING<br>4. Advance to READY<br>5. Advance to COMPLETED. | Order cards update visually; customer sees updated status. |

---

## 2. Test Execution Commands & Structure

- **Backend Unit & Integration Tests:**
  ```bash
  cd server
  npm test
  ```
  Runs Vitest / Jest against in-memory or PostgreSQL test database:
  - `server/tests/auth.test.ts` (Authentication, sessions, logout, 401/403)
  - `server/tests/order.test.ts` (Order placement, stock reduction, price calculation, cancellation)
  - `server/tests/permissions.test.ts` (Cross-customer boundary isolation, Staff queue access)
- **Frontend Build & Lint Checks:**
  ```bash
  cd client
  npm run build
  ```
