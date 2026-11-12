# Feature Inventory - QuickOrder System

**Course:** CPE 334 Deliverable 1  
**Team Members:**  
- **Patiharn Liangkobkit** (`66070503489`, GitHub: [`@Richyboy170`](https://github.com/Richyboy170))  
- **Tanakrit Sunthonwetchapong** (`67070503464`, GitHub: [`@Tanakrit-triton`](https://github.com/Tanakrit-triton))  
**Domain:** QuickOrder System

---

## 1. Feature Catalog

| Feature ID | Feature Name | Short Description | Related Requirements | Dependencies | Planned Sprint |
|---|---|---|---|---|---|
| **F-01** | User Authentication & Identity | Login with email and password, secure password verification via bcrypt, role retrieval (`/api/auth/me`), and logout session destruction. | FR-01, FR-02, NFR-01, NFR-02 | None | **Sprint 1** |
| **F-02** | Menu Item Catalog & Live Stock | Display available food and beverage items with item names, prices, descriptions, category, and real-time stock levels. | FR-03, NFR-03 | Database setup | **Sprint 1** |
| **F-03** | Order Creation & Inventory Validation | Customer selects items & quantities; backend validates non-empty payload, verifies and atomically deducts stock, calculates server-authoritative totals, and stores order in `PENDING` state. | FR-04, BR-01, BR-02, BR-03, NFR-01, NFR-04 | F-01, F-02 | **Sprint 1** |
| **F-04** | Order History & Customer Isolation | Customers can list and inspect their past orders. Non-owners cannot view or access another customer's order records. | FR-05, BR-04, NFR-01 | F-01, F-03 | **Sprint 1** |
| **F-05** | Customer Order Cancellation | Allows customers to cancel a placed order if and only if it remains in `PENDING` status. Restores inventory stock upon cancellation. | FR-07, BR-05 | F-03, F-04 | **Sprint 1** |
| **F-06** | Staff Kitchen Order Queue & Status Lifecycle | Staff dashboard listing all incoming orders; provides controls to transition order status (`PENDING` -> `PREPARING` -> `READY` -> `COMPLETED`). | FR-06, BR-06, NFR-02 | F-01, F-03 | **Sprint 1** |
| **F-07** | Menu & Stock Inventory Management | Staff interface to create new items, update descriptions, adjust prices, and restock quantities. | FR-08 | F-01, F-02 | **Sprint 2** |
| **F-08** | Digital Order Receipt & Order Code | Printable receipt generation with order summary, timestamp, customer information, and unique pickup confirmation code. | FR-09 | F-03 | **Sprint 2** |
| **F-09** | Concurrency Protection & High-Load Inventory Locking | Explicit optimistic/pessimistic lock mechanisms to prevent inventory overselling during high concurrent order bursts. | NFR-04 | F-03 | **Sprint 2** |
| **F-10** | Sales Reporting & Product Analytics | Aggregated daily and weekly sales reports, revenue trends, and top-selling menu items for store management. | FR-10 | F-03, F-06 | **Sprint 3** |
| **F-11** | System Hardening & Observability | Structured logging, readiness/liveness health probes, rate limiting, and GCP deployment pipeline monitoring. | NFR-05, NFR-06 | F-01..F-10 | **Sprint 3** |

---

## 2. Sprint 1 Scope Justification
Sprint 1 establishes the end-to-end engineering vertical slice:
1. **Full stack integration:** UI (React), API (Express), Database (PostgreSQL + Prisma).
2. **Two distinct user roles:** `CUSTOMER` (orders items, views personal history, cancels pending) and `STAFF` (monitors queue, advances kitchen preparation status).
3. **Core domain transaction & business rules:** Atomic stock validation, server-side price calculation, customer data isolation, and status progression guards.
