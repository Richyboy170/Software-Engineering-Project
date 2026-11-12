# System-Level Software Design Specification (SDS) - QuickOrder

**Course:** CPE 334 Deliverable 1  
**Team Members:**  
- **Patiharn Liangkobkit** (`66070503489`, GitHub: [`@Richyboy170`](https://github.com/Richyboy170))  
- **Tanakrit Sunthonwetchapong** (`67070503464`, GitHub: [`@Tanakrit-triton`](https://github.com/Tanakrit-triton))  
**Theme/Domain:** QuickOrder Ordering Platform  
**Target Checkpoint:** Deliverable 1 (8 November 2026) / Lab 5 CI/CD Ready

---

## 1. System Architecture and Component Responsibilities

### 1.1 Architecture Overview
QuickOrder employs a clean client-server architecture organized into three decoupled tiers:
1. **Presentation Layer (Client):** A single-page application built using **React 18 + Vite + Tailwind CSS**. It manages UI state, form validation, cart staging, dynamic status polling, and session tokens.
2. **Application / API Layer (Server):** Built on **Node.js (TypeScript) + Express**. It enforces all authentication, role permissions, request validation, transaction boundaries, and business rules (`BR-01` through `BR-06`).
3. **Persistence Layer (Database):** A relational **PostgreSQL 16** database managed through **Prisma ORM**. It enforces relational integrity, unique constraints, foreign keys, and atomic operations.

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React / Vite)"]
        UI["Web Browser / Responsive UI"]
        CartState["Cart & Session Storage"]
    end

    subgraph Server ["Application Layer (Express / Node.js)"]
        AuthMiddleware["Auth & Role Guard Middleware"]
        Router["REST API Router (/api/*)"]
        OrderService["Order & Business Rule Engine"]
        HealthRouter["Health & Readiness Probes (/api/health, /api/ready)"]
    end

    subgraph Database ["Persistence Layer (PostgreSQL / Prisma)"]
        Prisma["Prisma ORM Client"]
        Postgres[(PostgreSQL 16 Database)]
    end

    UI -->|HTTP / JSON Requests| AuthMiddleware
    AuthMiddleware --> Router
    Router --> OrderService
    OrderService --> Prisma
    Prisma -->|SQL via Unix Socket / TCP| Postgres
    Router --> HealthRouter
    HealthRouter --> Prisma
```

### 1.2 Enforcement Boundaries
- **No Client Trust:** The frontend validates input for user experience only. The backend API independently validates all payloads (quantity $\ge 1$, valid IDs, inventory sufficiency) and authoritatively computes pricing.
- **Transactional Consistency:** Order placement executes within a single `prisma.$transaction(...)` block. Stock availability is verified and decremented in lockstep with `Order` and `OrderItem` record insertion.
- **Fail-Safe Rollback:** If any item exceeds stock, the transaction immediately aborts, no database changes are committed, and an HTTP 400 error is returned.

---

## 2. Domain Data Model and Schema Specification

### 2.1 Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ SESSION : has
    USER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    MENU_ITEM ||--o{ ORDER_ITEM : referenced_by

    USER {
        string id PK
        string email UK
        string passwordHash
        string fullName
        string role "CUSTOMER | STAFF"
        datetime createdAt
        datetime updatedAt
    }

    SESSION {
        string token PK
        string userId FK
        datetime expiresAt
        datetime createdAt
    }

    MENU_ITEM {
        string id PK
        string name
        string description
        string category
        decimal price
        int stock
        boolean isAvailable
        datetime createdAt
        datetime updatedAt
    }

    ORDER {
        string id PK
        string customerId FK
        string status "PENDING | PREPARING | READY | COMPLETED | CANCELLED"
        decimal totalPrice
        datetime createdAt
        datetime updatedAt
    }

    ORDER_ITEM {
        string id PK
        string orderId FK
        string menuItemId FK
        int quantity
        decimal unitPrice
        decimal subtotal
    }
```

### 2.2 Data Dictionary and Key Constraints

1. **`User` Table:**
   - `id`: CUID/UUID string primary key.
   - `email`: Unique string (`@` format required).
   - `passwordHash`: Bcrypt salt+hash (minimum 10 rounds). Passwords never stored plaintext.
   - `role`: Enum `CUSTOMER` or `STAFF`.
2. **`Session` Table:**
   - `token`: Unique cryptographically generated hex token.
   - `userId`: Foreign key to `User.id` on delete CASCADE.
   - `expiresAt`: DateTime (default 24 hours expiry).
3. **`MenuItem` Table:**
   - `id`: CUID/UUID primary key.
   - `name`: Non-empty string.
   - `price`: Decimal $(10, 2)$ strictly $> 0$.
   - `stock`: Integer $\ge 0$. Constraint: negative values rejected by DB check.
   - `isAvailable`: Boolean flag.
4. **`Order` Table:**
   - `id`: CUID primary key.
   - `customerId`: Foreign key to `User.id`.
   - `status`: Enum (`PENDING`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`).
   - `totalPrice`: Decimal $(10, 2)$, sum of all line item subtotals calculated server-side.
5. **`OrderItem` Table:**
   - `orderId`: Foreign key to `Order.id` on delete CASCADE.
   - `menuItemId`: Foreign key to `MenuItem.id`.
   - `quantity`: Integer $\ge 1$.
   - `unitPrice`: Snapshot of `MenuItem.price` at moment of purchase.
   - `subtotal`: `quantity` $\times$ `unitPrice`.

---

## 3. UI, API, and Access Conventions

### 3.1 Main Screens & Shared UI Behavior
- **Sign In / Registration Screen:** Clean form with email and password inputs, role badge display for seeded accounts, immediate client validation, and clear error banner upon 401.
- **Menu Catalog Screen:** Grid view displaying items, categories, price badges, live stock counter, and "Add to Cart" actions. Out-of-stock items have disabled add buttons.
- **Cart & Order Review Modal/Drawer:** Summarizes selected quantities, live total, and a "Place Order" button with loading spinners to prevent double-click submissions.
- **Customer My Orders Screen:** Lists the authenticated customer's orders with current status badges, line-item summaries, timestamps, and a conditional "Cancel Order" button (enabled only when status is `PENDING`).
- **Staff Kitchen Queue Dashboard:** Live operational board displaying all orders grouped by status, with single-click status advance buttons (`Start Preparing`, `Mark Ready`, `Complete`).
- **Shared States:** Every asynchronous query exhibits 3 explicit UI states:
  - *Loading State:* Accessible skeleton placeholders or spinner.
  - *Empty State:* Meaningful messaging (e.g., "You have no active orders yet").
  - *Error State:* Human-readable alert with retry action.

### 3.2 REST API Endpoint Conventions
All API endpoints follow RESTful standards, utilize JSON payloads, and return predictable envelopes:

- **Success Response:**
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```
- **Error Response:**
  ```json
  {
    "success": false,
    "error": {
      "code": "INSUFFICIENT_STOCK",
      "message": "Requested quantity exceeds available stock."
    }
  }
  ```

#### Core Endpoint Routes
| Method | Path | Auth Required | Allowed Role | Purpose |
|---|---|---|---|---|
| `GET` | `/api/health` | No | Any | System liveness probe (`status: ok`) |
| `GET` | `/api/ready` | No | Any | DB readiness probe (`SELECT 1`) |
| `POST` | `/api/auth/login` | No | Any | User login, returns session token |
| `GET` | `/api/auth/me` | Yes | Any | Returns authenticated user profile |
| `POST` | `/api/auth/logout`| Yes | Any | Invalidates session token |
| `GET` | `/api/menu` | No | Any | Retrieves active menu items & stock |
| `POST` | `/api/orders` | Yes | `CUSTOMER` | Submits new order (validates stock & calculates price) |
| `GET` | `/api/orders/my`| Yes | `CUSTOMER` | Lists current customer's orders |
| `GET` | `/api/orders` | Yes | `STAFF` | Lists all customer orders for queue |
| `GET` | `/api/orders/:id`| Yes | Owner / `STAFF` | Retrieves single order details |
| `POST` | `/api/orders/:id/cancel`| Yes | Owner | Cancels order (only if `PENDING`) |
| `PATCH`| `/api/orders/:id/status`| Yes | `STAFF` | Updates order state progression |

---

## 4. Role and Permission Matrix

| Operation / Resource | Unauthenticated | Customer Role | Staff Role |
|---|:---:|:---:|:---:|
| View API Health (`/api/health`, `/api/ready`) | ✅ Yes | ✅ Yes | ✅ Yes |
| View Menu Items & Stock (`GET /api/menu`) | ✅ Yes | ✅ Yes | ✅ Yes |
| Sign In / Sign Out | ✅ Sign In | ✅ Sign Out | ✅ Sign Out |
| Place Order (`POST /api/orders`) | ❌ 401 | ✅ Yes | ❌ 403 (Customer only) |
| View Own Orders (`GET /api/orders/my`) | ❌ 401 | ✅ Yes | ❌ 403 |
| View All Orders (`GET /api/orders`) | ❌ 401 | ❌ 403 Forbidden | ✅ Yes |
| View Order Details (`GET /api/orders/:id`) | ❌ 401 | ✅ Own Only (403 if other) | ✅ Any Order |
| Cancel Order (`POST /api/orders/:id/cancel`) | ❌ 401 | ✅ Own & PENDING only | ❌ 403 |
| Advance Status (`PATCH /api/orders/:id/status`)| ❌ 401 | ❌ 403 Forbidden | ✅ Yes |

---

## 5. Security and Credential Handling

1. **Password Security:** Passwords hashed with `bcryptjs` using a minimum work factor of 10. Passwords are never returned in responses or logged.
2. **Session Authentication:**
   - Client sends session token via `Authorization: Bearer <token>` or `x-session-token` header.
   - Express middleware queries the `Session` table, checks `expiresAt > NOW()`, and attaches `req.user` to the request object.
   - Logout removes the session token from the database, immediately invalidating any subsequent requests.
3. **Safe Seed Credentials:**
   - Pre-seeded accounts are provided for local development and TA evaluation (`customer@quickorder.local`, `staff@quickorder.local`). Passwords default to known non-production credentials locally and are driven by environment variables in cloud environments.

---

## 6. Configuration and Cloud Delivery Design

### 6.1 Environment Variables
All configuration is loaded via environment variables; no secrets are committed to Git:

| Variable | Description | Example / Local Default |
|---|---|---|
| `PORT` | Listening HTTP port for the container | `3000` |
| `NODE_ENV` | Application mode (`development` or `production`) | `development` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://quickorder:devpassword@localhost:5432/quickorder` |
| `CORS_ORIGIN` | Allowed client origins | `http://localhost:5173` |
| `SESSION_SECRET`| Secret used for session generation | `quickorder-super-secret-key-2026` |

### 6.2 Cloud Packaging and Target GCP Architecture (Lab 5 Ready)
- **Containerization:** Multi-stage Docker build packaging both static React client build and Express backend into a single lean container.
- **Hosting:** Google Cloud Run (serverless container hosting with 0-to-3 instance scaling).
- **Database:** Google Cloud SQL (PostgreSQL 16) with storage auto-increase disabled.
- **Secrets:** Google Secret Manager stores `DATABASE_URL` and admin credentials.
- **CI/CD:** GitHub Actions with Workload Identity Federation (WIF) ensuring keyless zero-credential deployment.
