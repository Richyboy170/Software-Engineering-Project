# Software Requirements Specification (SRS) - QuickOrder System

**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Project:** Deliverable 1 — Engineering Baseline and Working Sprint 1  
**Team Members:**  
- **Patiharn Liangkobkit** (Student ID: `66070503489`, GitHub: [`@Richyboy170`](https://github.com/Richyboy170))  
- **Tanakrit Sunthonwetchapong** (Student ID: `67070503464`, GitHub: [`@Tanakrit-triton`](https://github.com/Tanakrit-triton))  
**Repository:** [Richyboy170/Software-Engineering-Project](https://github.com/Richyboy170/Software-Engineering-Project)  
**Theme/Domain:** QuickOrder (On-Demand Food & Beverage Ordering Platform)

---

## 1. Context and Stakeholder Problem

### 1.1 Problem Statement
Campus eateries and quick-service dining establishments suffer from severe peak-hour order processing bottlenecks:
- Walk-in customers endure prolonged queuing times just to browse the menu, verify stock availability, place orders, and pay.
- Counter and kitchen staff manage orders through handwritten notes or uncoordinated verbal calls, resulting in lost orders, double-sold items, and lack of preparation tracking.
- Out-of-stock items are frequently sold before the kitchen realizes inventory is depleted, leading to customer frustration and awkward manual cancellation/refund handling.

### 1.2 Proposed Solution
**QuickOrder** is an integrated full-stack web ordering system and kitchen dispatch monitor that digitizes both the customer ordering journey and kitchen operations:
- Customers authenticate securely, browse real-time item availability, place orders with atomic inventory deduction, and monitor preparation status live.
- Kitchen and counter staff monitor orders in a real-time queue, transition preparation states (`PENDING` -> `PREPARING` -> `READY` -> `COMPLETED`), and maintain accurate inventory counts.

---

## 2. Actors and Responsibilities

| Actor | Description & Core Responsibilities |
|---|---|
| **Customer (`CUSTOMER`)** | Authenticated consumer who browses active menu items, places orders against live inventory, views personal order history, and cancels pending orders within the allowable window. |
| **Staff (`STAFF`)** | Store/kitchen staff member who inspects the global order dispatch queue, updates order preparation statuses, views live stock levels, and fulfills customer orders. |
| **System (Automated / Background)** | Enforces transactional consistency, validates stock deductions, calculates authoritative order totals, validates session integrity, and provides health probes. |

---

## 3. Product Scope and Explicit Exclusions

### 3.1 In Scope (Baseline across 3 Sprints)
- Role-based authentication (Customer, Staff) with bcrypt password hashing and secure session tokens.
- Menu catalog with item descriptions, prices, categories, and real-time inventory counts.
- Customer ordering vertical slice: order construction, server-side price computation, atomic inventory deduction, and order placement in `PENDING` state.
- Kitchen dispatch order queue with status transitions (`PENDING`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`).
- Automated tests across unit, integration, and security layers enforcing domain business rules.
- Production Docker containerization, reproducible migrations/seed, and GCP CI/CD deployment pipeline.

### 3.2 Explicit Exclusions (Out of Scope)
- Real external banking/credit card payment gateway processing (payment is simulated via mock confirmation).
- External SMS notifications or physical thermal receipt printers.
- Third-party multi-restaurant delivery driver dispatch logistics.
- Self-service email verification links and SMS password resets (synthetic seeded test accounts used for local and UAT evaluation).

---

## 4. Functional Requirements (FR)

| ID | Title | Observable Behavior & Description | Target Sprint |
|---|---|---|---|
| **FR-01** | User Authentication | Users authenticate with email and password. System validates credentials and returns session identifying user role (`CUSTOMER` or `STAFF`). | Sprint 1 |
| **FR-02** | User Profile & Identity | Authenticated users retrieve their identity, profile, and role via `/api/auth/me`. Session terminates cleanly upon logout. | Sprint 1 |
| **FR-03** | Menu Catalog Browsing | Users browse active menu items including name, description, price, category, and real-time stock count. | Sprint 1 |
| **FR-04** | Order Placement | Customers submit an order with one or more menu items and quantities. Server validates inventory and creates an order in `PENDING` status. | Sprint 1 |
| **FR-05** | Customer Order History | Customers view and inspect the history and line-item details of their own submitted orders. | Sprint 1 |
| **FR-06** | Staff Order Queue & Status Updates | Staff view all orders across all customers and advance preparation status (`PENDING` -> `PREPARING` -> `READY` -> `COMPLETED`). | Sprint 1 |
| **FR-07** | Customer Order Cancellation | Customers cancel their own order only while its status is `PENDING`. Stock is restored upon cancellation. | Sprint 1 |
| **FR-08** | Menu & Stock Inventory Management | Staff create new menu items, update prices, and restock inventory. | Sprint 2 |
| **FR-09** | Digital Order Receipt & Pickup Code | System generates printable order summary with customer details and a unique 4-character pickup reference code. | Sprint 2 |
| **FR-10** | Sales Analytics & Reporting | Staff review aggregated daily sales revenue, order volumes, and top-performing items. | Sprint 3 |

---

## 5. Business Rules (BR)

| ID | Title | Rule Definition & Boundary Behavior |
|---|---|---|
| **BR-01** | Minimum Order Content | An order must contain at least 1 line item, and each line item quantity must be an integer greater than zero ($q \ge 1$). Submissions with empty items or non-positive quantities are rejected with HTTP 400 Bad Request. |
| **BR-02** | Atomic Stock Deduction | An order cannot be placed if requested quantity exceeds current available stock for any item. If stock is sufficient, the system atomically reserves and deducts stock upon order creation. Zero or negative remaining stock prevents further orders. |
| **BR-03** | Server-Authoritative Pricing | Total order price and line item unit prices must be computed exclusively from server-side database records. Any prices submitted in the client payload are ignored to prevent price tampering. |
| **BR-04** | Data Isolation & Ownership | Customers may only read and modify their own orders. Attempting to query or cancel another user's order must return HTTP 403 Forbidden without disclosing order contents. |
| **BR-05** | Order Cancellation Window | A customer can only cancel an order whose current status is `PENDING`. Once an order is transitioned to `PREPARING`, `READY`, or `COMPLETED`, customer cancellation is rejected with HTTP 400. |
| **BR-06** | Restricted State Progression | Only users with the `STAFF` role can advance order states (`PENDING` -> `PREPARING` -> `READY` -> `COMPLETED`). Customers attempting status promotion receive HTTP 403 Forbidden. |

---

## 6. Non-Functional Requirements (NFR)

| ID | Category | Measurable Target | Practical Verification Method | Target Sprint |
|---|---|---|---|---|
| **NFR-01** | Security / Access Control | Unauthenticated requests to protected endpoints (`/api/orders/*`, `/api/auth/me`) are rejected with HTTP 401 Unauthorized without leaking private record data. | Automated Supertest API security suite. | Sprint 1 |
| **NFR-02** | Security / Role Restriction | Customer role users attempting Staff-only endpoints (`/api/orders/:id/status`, menu item mutations) are rejected with HTTP 403 Forbidden. | Automated Supertest API role boundary tests. | Sprint 1 |
| **NFR-03** | Performance / Response Time | API endpoints for menu listing and order submission must respond within $\le 200\text{ ms}$ under local automated test suites. | Supertest API benchmark test. | Sprint 1 |
| **NFR-04** | Data Integrity & Concurrency | Simultaneous order requests competing for the last unit of stock must not oversell inventory (zero negative stock tolerance). | Concurrency race condition test with transactional lock. | Sprint 2 |
| **NFR-05** | Cloud Readiness & Portability | Application runs from a clean container build; configuration injected exclusively via environment variables without hardcoded secrets. | Docker fresh build verification in GitHub Actions CI (`test-and-docker`). | Sprint 1 / Lab 5 |
| **NFR-06** | Disaster Recovery & Persistence | All committed order and inventory records survive container restarts and Cloud Run redeployments. | Post-restart database retrieval test (Lab 5 verification C-05). | Lab 5 |

---

## 7. Assumptions, Decisions, and Resolutions

1. **Architecture & Stack Decision:**  
   *Resolution:* Node.js (TypeScript) + Express for the REST API, Prisma ORM with PostgreSQL for robust transactional support, and React + Vite for responsive UI. This aligns 100% with the provided `toktickit-lab5-starter` containerization and GCP CI/CD templates.
2. **Authentication Strategy:**  
   *Resolution:* Session-based token/cookie with bcrypt-hashed passwords in the database. Allows real server-side authentication, role inspection, and session termination without requiring third-party OAuth in Sprint 1.
3. **Inventory Race Prevention:**  
   *Resolution:* Prisma interactive transactions (`prisma.$transaction`) are used during order creation to inspect stock, check constraints, deduct inventory, and create order records atomically.
