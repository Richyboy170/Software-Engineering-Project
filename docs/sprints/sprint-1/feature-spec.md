# Sprint 1 Feature Engineering Contracts & Specifications

**Course:** CPE 334 Deliverable 1  
**Team Members:**  
- **Patiharn Liangkobkit** (`66070503489`, GitHub: [`@Richyboy170`](https://github.com/Richyboy170))  
- **Tanakrit Sunthonwetchapong** (`67070503464`, GitHub: [`@Tanakrit-triton`](https://github.com/Tanakrit-triton))  
**Target Milestone:** Sprint 1 Release on `main`  
**Domain:** QuickOrder System

---

## 1. Feature Specifications

### 1.1 Feature F-01: User Authentication & Session Management
- **Linked Requirements:** `FR-01`, `FR-02`, `NFR-01`, `NFR-02`
- **Description:** Provides secure user sign-in using email and password, session token issuance, current authenticated user profile inspection, and session termination upon logout.
- **Roles & Permissions:** Open to public for login; all authenticated roles can query `/api/auth/me` and logout.
- **API Specification:**
  - `POST /api/auth/login`
    - Request: `{ "email": "customer@quickorder.local", "password": "Password123!" }`
    - Response (200): `{ "success": true, "data": { "token": "hex-token", "user": { "id": "...", "email": "...", "fullName": "...", "role": "CUSTOMER" } } }`
    - Error (401): `{ "success": false, "error": { "code": "INVALID_CREDENTIALS", "message": "Invalid email or password." } }`
  - `GET /api/auth/me`
    - Header: `Authorization: Bearer <token>`
    - Response (200): `{ "success": true, "data": { "id": "...", "email": "...", "fullName": "...", "role": "CUSTOMER" } }`
    - Error (401): `{ "success": false, "error": { "code": "UNAUTHORIZED", "message": "Authentication required." } }`
  - `POST /api/auth/logout`
    - Header: `Authorization: Bearer <token>`
    - Response (200): `{ "success": true, "data": { "message": "Logged out successfully." } }`

#### Acceptance Criteria
- **`AC-AUTH-01`**: Given valid credentials for an existing user, posting to `/api/auth/login` must return HTTP 200, a non-empty session token, and the user profile containing the assigned role.
- **`AC-AUTH-02`**: Given incorrect password or non-existent email, posting to `/api/auth/login` must return HTTP 401 without creating a session.
- **`AC-AUTH-03`**: An authenticated user providing a valid token to `/api/auth/me` receives HTTP 200 with their own user details.
- **`AC-AUTH-04`**: Calling `/api/auth/logout` revokes the token in the database; subsequent requests using that token must return HTTP 401.

---

### 1.2 Feature F-02: Menu Catalog & Real-Time Stock Inspection
- **Linked Requirements:** `FR-03`, `NFR-03`
- **Description:** Allows any user (guest or authenticated) to view active food and beverage offerings, current prices, descriptions, and remaining inventory stock.
- **API Specification:**
  - `GET /api/menu`
    - Response (200):
      ```json
      {
        "success": true,
        "data": [
          {
            "id": "menu_01",
            "name": "Classic Cheeseburger",
            "description": "Grilled beef patty with cheddar and secret sauce",
            "category": "Mains",
            "price": "149.00",
            "stock": 25,
            "isAvailable": true
          }
        ]
      }
      ```

#### Acceptance Criteria
- **`AC-MENU-01`**: Querying `GET /api/menu` returns HTTP 200 with all active menu items, exact pricing, and non-negative stock counts.
- **`AC-MENU-02`**: When stock drops to 0, `stock` reports 0 and `isAvailable` evaluates to `false` in the response.

---

### 1.3 Feature F-03: Order Placement & Stock Validation
- **Linked Requirements:** `FR-04`, `BR-01`, `BR-02`, `BR-03`, `NFR-01`, `NFR-04`
- **Description:** Authenticated customers place orders with line items. The backend verifies positive quantities, confirms sufficient stock inside an atomic transaction, decrements inventory, computes total price from database prices, and persists the order as `PENDING`.
- **API Specification:**
  - `POST /api/orders`
    - Header: `Authorization: Bearer <token>`
    - Request:
      ```json
      {
        "items": [
          { "menuItemId": "menu_01", "quantity": 2 }
        ]
      }
      ```
    - Response (201):
      ```json
      {
        "success": true,
        "data": {
          "id": "ord_101",
          "customerId": "usr_01",
          "status": "PENDING",
          "totalPrice": "298.00",
          "items": [
            {
              "id": "item_1",
              "menuItemId": "menu_01",
              "name": "Classic Cheeseburger",
              "quantity": 2,
              "unitPrice": "149.00",
              "subtotal": "298.00"
            }
          ]
        }
      }
      ```
    - Error - Empty Items (400): `{ "success": false, "error": { "code": "INVALID_ITEMS", "message": "Order must contain at least one item with quantity >= 1." } }`
    - Error - Out of Stock (400): `{ "success": false, "error": { "code": "INSUFFICIENT_STOCK", "message": "Requested quantity exceeds available stock." } }`

#### Acceptance Criteria
- **`AC-ORD-01`**: A valid customer order with sufficient stock returns HTTP 201 with status `PENDING`, correct server-computed total price, and decrements stock in the database.
- **`AC-ORD-02`**: An order submitted with empty `items` list or non-positive quantities ($q \le 0$) returns HTTP 400 Bad Request (`BR-01`).
- **`AC-ORD-03`**: An order requesting quantity greater than available stock returns HTTP 400 Bad Request, commits no order, and leaves inventory untouched (`BR-02`).
- **`AC-ORD-04`**: Client-tampered `price` or `totalPrice` fields in the request body are ignored; the stored total strictly reflects current database item prices (`BR-03`).

---

### 1.4 Feature F-04: Order History & Ownership Isolation
- **Linked Requirements:** `FR-05`, `BR-04`, `NFR-01`
- **Description:** Customers view only their own orders. Attempting to query another customer's order directly returns HTTP 403 Forbidden.
- **API Specification:**
  - `GET /api/orders/my` (Lists orders for authenticated customer)
  - `GET /api/orders/:id` (Returns single order details if requester is owner or Staff)

#### Acceptance Criteria
- **`AC-SEC-01`**: `GET /api/orders/my` returns HTTP 200 containing only orders where `customerId == req.user.id`.
- **`AC-SEC-02`**: When Customer A attempts `GET /api/orders/:id` for an order owned by Customer B, the server responds with HTTP 403 Forbidden without disclosing order details (`BR-04`).

---

### 1.5 Feature F-05: Customer Order Cancellation
- **Linked Requirements:** `FR-07`, `BR-05`
- **Description:** Customers may cancel an order they own if and only if it is in `PENDING` status. Cancelled orders restore item stock back to inventory.
- **API Specification:**
  - `POST /api/orders/:id/cancel`
    - Header: `Authorization: Bearer <token>`
    - Response (200): `{ "success": true, "data": { "id": "ord_101", "status": "CANCELLED" } }`
    - Error - Non-Pending (400): `{ "success": false, "error": { "code": "INVALID_TRANSITION", "message": "Only PENDING orders can be cancelled." } }`

#### Acceptance Criteria
- **`AC-ORD-05`**: A customer cancelling their own `PENDING` order receives HTTP 200, status becomes `CANCELLED`, and inventory stock is restored.
- **`AC-ORD-06`**: Attempting to cancel an order whose status is `PREPARING`, `READY`, or `COMPLETED` returns HTTP 400 Bad Request (`BR-05`).

---

### 1.6 Feature F-06: Staff Kitchen Queue & State Progression
- **Linked Requirements:** `FR-06`, `BR-06`, `NFR-02`
- **Description:** Staff view all customer orders and promote preparation status sequentially (`PENDING` -> `PREPARING` -> `READY` -> `COMPLETED`).
- **API Specification:**
  - `GET /api/orders` (Staff only: returns all active orders)
  - `PATCH /api/orders/:id/status`
    - Request: `{ "status": "PREPARING" }`
    - Response (200): `{ "success": true, "data": { "id": "...", "status": "PREPARING" } }`

#### Acceptance Criteria
- **`AC-STAFF-01`**: A user with `STAFF` role calling `GET /api/orders` receives HTTP 200 with all orders across all customers.
- **`AC-STAFF-02`**: A user with `CUSTOMER` role calling `GET /api/orders` receives HTTP 403 Forbidden (`NFR-02`).
- **`AC-STAFF-03`**: Staff can update status through valid transitions (`PENDING` -> `PREPARING` -> `READY` -> `COMPLETED`).
- **`AC-STAFF-04`**: Customers attempting `PATCH /api/orders/:id/status` receive HTTP 403 Forbidden (`BR-06`).
