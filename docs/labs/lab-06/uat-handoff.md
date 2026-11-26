# Lab 6 — QuickOrder Sprint 1 UAT Handoff

**Product Team:** QuickOrder — Patiharn Liangkobkit (66070503489), Tanakrit Sunthonwetchapong (67070503464)
**UAT Team:** `<partner team name, members, IDs>`
**Handoff version:** v1.0 — `<date/time sent>`

---

## 1. Release under test

| Item | Value |
|---|---|
| Repository | https://github.com/Richyboy170/Software-Engineering-Project |
| Sprint 1 baseline tag | `sprint1-uat-baseline` |
| Commit | `12c18be5fa0571abf374f0b447baa49117826513` (`main`, merge of PR #18) |
| Cloud Run revision | `quickorder-00003-55s` |
| Image digest | `sha256:426990572d5275d7c67c8503d3cabcc9038615c0e34d69778833268c8d86e128` (tag `12c18be5fa0571abf374f0b447baa49117826513`) |
| Public URL | https://quickorder-fzeemousqa-as.a.run.app |
| API base | `<Public URL>/api` |

The Product Team will notify the UAT Team **before** any redeployment. Before starting, the Product Team re-confirms in the handoff channel that the live revision is still `quickorder-00003-55s`. If the Product Team reports a different revision, stop and record the session as BLOCKED.

## 2. Accepted-for-test scope (Sprint 1 only)

| Feature | Requirements | Acceptance criteria |
|---|---|---|
| F-01 Authentication | FR-01, FR-02 | AC-AUTH-01..04 |
| F-02 Menu & live stock | FR-03 | AC-MENU-01..02 |
| F-03 Order creation & stock validation | FR-04, BR-01, BR-02, BR-03 | AC-ORD-01..04 |
| F-04 Order history & customer isolation | FR-05, BR-04 | AC-SEC-01..02 |
| F-05 Customer cancellation | FR-07, BR-05 | AC-ORD-05..06 |
| F-06 Staff queue & status lifecycle | FR-06, BR-06 | AC-STAFF-01..04 |

**Out of scope:** F-07 menu/stock management, F-08 receipts/pickup codes, F-09 concurrency locking, F-10 analytics, F-11 hardening. Findings about these are enhancements, not Sprint 1 defects.

## 3. Accounts (credentials sent privately — never in this document)

| Label | Role | Login email |
|---|---|---|
| CUST-A | CUSTOMER | `customer@quickorder.local` |
| CUST-B | CUSTOMER | `customer2@quickorder.local` |
| STAFF | STAFF | `staff@quickorder.local` |

All data is synthetic.

## 4. Setup, sequence and cleanup

**Before starting:** the production database is not reset. The Product Team recorded the live stock below from `GET /api/menu` on 27 Nov 2026 00:27 (UTC+7), revision `quickorder-00003-55s`, and re-confirms it in the handoff channel just before the session.

| Item | Price (THB) | Stock at handoff |
|---|---|---|
| Classic Cheeseburger | 149.00 | 18 |
| Crispy Chicken Burger | 139.00 | 15 |
| Truffle Parmesan Fries | 89.00 | 2 |
| Iced Caramel Macchiato | 75.00 | 30 |
| Ceremonial Matcha Latte | 70.00 | 0 (unavailable) |

**Sequence:** run UAT-01 → UAT-05 in order. Cases share one database, so each case states the stock it expects at the start (**S₀**). Always record the actual starting stock you observe; if it differs, use the observed value in your calculation and note it.

**Cleanup:** testers do not need to undo their orders. After the session, tell the Product Team; it will record the remaining stock as the starting point for any retest.

**Calling the API (needed for UAT-02 step 5 and UAT-03):** first get a token. In PowerShell use `curl.exe` instead of `curl`.

```
curl -X POST <API base>/auth/login -H "Content-Type: application/json" -d "{\"email\":\"customer2@quickorder.local\",\"password\":\"<private>\"}"
```
Copy `data.token` from the response and pass it as `-H "Authorization: Bearer <token>"`.

---

## 5. UAT cases

### UAT-01 — Normal customer order journey
- **Category:** normal domain journey
- **References:** FR-01, FR-03, FR-04, FR-05 · AC-AUTH-01, AC-MENU-01, AC-ORD-01, AC-SEC-01
- **Purpose:** a customer can log in, order from the live menu, and see a correctly priced PENDING order in their history.
- **Role:** CUST-A
- **Preconditions:** stock as recorded at handoff. S₀: Cheeseburger 18, Iced Caramel Macchiato 30.
- **Inputs:** 2 × Classic Cheeseburger, 1 × Iced Caramel Macchiato

**Steps**
1. Open the public URL and log in as CUST-A.
2. On the Menu page, note the stock shown for Classic Cheeseburger and Iced Caramel Macchiato.
3. Add 2 × Classic Cheeseburger and 1 × Iced Caramel Macchiato and place the order.
4. Open My Orders.
5. Return to the Menu page and refresh.

**Expected results**
- Step 1: login succeeds; the UI shows the user as a customer.
- Step 3: the order is accepted.
- Step 4: the new order is listed with status **PENDING** and total **THB 373.00** (2 × 149.00 + 1 × 75.00), with both line items and quantities.
- Step 5: Classic Cheeseburger stock = S₀ − 2 (**16**), Iced Caramel Macchiato stock = S₀ − 1 (**29**).
- **Record the order ID** shown — it is used in UAT-03 and UAT-04 (call it `ORDER-A1`).

### UAT-02 — Stock and quantity boundary
- **Category:** business rule / boundary
- **References:** FR-04, BR-01, BR-02 · AC-ORD-02, AC-ORD-03, AC-MENU-02
- **Purpose:** an order exceeding stock is rejected with no side effect; ordering exactly the remaining stock is allowed; invalid quantities are rejected.
- **Role:** CUST-A
- **Preconditions:** S₀: Truffle Parmesan Fries = 2.
- **Inputs:** quantity 3, then quantity 2, then quantity 0 (API)

**Steps**
1. Log in as CUST-A and note Truffle Parmesan Fries stock (expect 2) and the number of orders in My Orders.
2. Try to order 3 × Truffle Parmesan Fries.
3. Refresh Menu and My Orders.
4. Order 2 × Truffle Parmesan Fries.
5. Using the API with CUST-A's token, send an order with quantity 0:
   ```
   curl -X POST <API base>/orders -H "Authorization: Bearer <CUST-A token>" -H "Content-Type: application/json" -d "{\"items\":[{\"menuItemId\":\"<Cheeseburger id from GET /api/menu>\",\"quantity\":0}]}"
   ```
6. Send an order with an empty list: `-d "{\"items\":[]}"`.

**Expected results**
- Step 2: order is **rejected** with a message that the requested quantity (3) exceeds available stock (2). (API: HTTP 400, `INSUFFICIENT_STOCK`.)
- Step 3: Fries stock is still **2**; order count in My Orders is unchanged.
- Step 4: order accepted, status PENDING, total **THB 178.00** (2 × 89.00). Fries stock becomes **0** and the item shows as **unavailable**.
- Step 5: HTTP **400**, code `INVALID_QUANTITY`; no order created; Cheeseburger stock unchanged.
- Step 6: HTTP **400**, code `INVALID_ITEMS`; no order created.

### UAT-03 — Ownership and role access
- **Category:** forbidden role / ownership
- **References:** FR-05, FR-06, BR-04, BR-06, NFR-02 · AC-SEC-02, AC-STAFF-02, AC-STAFF-04
- **Purpose:** a customer cannot view, cancel or change another customer's order, and cannot use staff functions; protected data is not disclosed or modified.
- **Role:** CUST-B (attacker), CUST-A (owner)
- **Preconditions:** `ORDER-A1` from UAT-01 exists and is PENDING.
- **Inputs:** `ORDER-A1` ID; CUST-B token

**Steps**
1. Log in to the UI as CUST-B and open My Orders.
2. With CUST-B's token: `curl <API base>/orders/<ORDER-A1> -H "Authorization: Bearer <CUST-B token>"`
3. `curl -X POST <API base>/orders/<ORDER-A1>/cancel -H "Authorization: Bearer <CUST-B token>"`
4. `curl <API base>/orders -H "Authorization: Bearer <CUST-B token>"`
5. `curl -X PATCH <API base>/orders/<ORDER-A1>/status -H "Authorization: Bearer <CUST-B token>" -H "Content-Type: application/json" -d "{\"status\":\"PREPARING\"}"`
6. Log in as CUST-A and open My Orders.

**Expected results**
- Step 1: CUST-B's list does **not** contain `ORDER-A1` or any CUST-A order.
- Step 2: HTTP **403** `FORBIDDEN`; the body contains **no** order items, total or customer data.
- Step 3: HTTP **403** `FORBIDDEN`.
- Step 4: HTTP **403** `FORBIDDEN` (staff-only list).
- Step 5: HTTP **403** `FORBIDDEN`.
- Step 6: `ORDER-A1` is still **PENDING** with total **THB 373.00** — nothing changed.

### UAT-04 — Status lifecycle and persistence
- **Category:** state / history / persistence
- **References:** FR-01, FR-05, FR-06, BR-06 · AC-AUTH-04, AC-STAFF-01, AC-STAFF-03
- **Purpose:** staff advances an order through the allowed lifecycle, invalid jumps are rejected, and the customer sees the persisted status after a new login.
- **Role:** STAFF, CUST-A
- **Preconditions:** `ORDER-A1` is PENDING (after UAT-03).

**Steps**
1. Log in as STAFF and open the Kitchen Queue.
2. Confirm `ORDER-A1` and the UAT-02 order are both listed.
3. Advance `ORDER-A1` to PREPARING.
4. With STAFF's token, try to jump it straight to COMPLETED:
   `curl -X PATCH <API base>/orders/<ORDER-A1>/status -H "Authorization: Bearer <STAFF token>" -H "Content-Type: application/json" -d "{\"status\":\"COMPLETED\"}"`
5. In the UI, advance `ORDER-A1` to READY, then to COMPLETED.
6. Log out. Retry the step-4 command with the **old** STAFF token.
7. Log in as CUST-A (new session) and open My Orders.

**Expected results**
- Step 2: the queue shows orders from all customers.
- Step 3: status becomes **PREPARING**.
- Step 4: HTTP **400** `INVALID_TRANSITION`; status stays PREPARING.
- Step 5: status becomes **READY**, then **COMPLETED**.
- Step 6: HTTP **401** (token revoked by logout).
- Step 7: `ORDER-A1` shows **COMPLETED** and total **THB 373.00**.

### UAT-05 — Customer cancellation rule
- **Category:** business rule / state
- **References:** FR-07, BR-05 · AC-ORD-05, AC-ORD-06
- **Purpose:** a customer can cancel only their own PENDING order, and cancelling restores stock.
- **Role:** CUST-A, STAFF
- **Preconditions:** Crispy Chicken Burger S₀ = 15.

**Steps**
1. Log in as CUST-A and order 3 × Crispy Chicken Burger. Record it as `ORDER-A2`. Note the stock (expect 12).
2. In My Orders, cancel `ORDER-A2` and confirm.
3. Refresh Menu.
4. Order 1 × Crispy Chicken Burger (`ORDER-A3`). As STAFF, advance `ORDER-A3` to PREPARING.
5. As CUST-A, try to cancel `ORDER-A3` (UI, or `curl -X POST <API base>/orders/<ORDER-A3>/cancel` with CUST-A's token).

**Expected results**
- Step 1: total **THB 417.00** (3 × 139.00); stock = **12**.
- Step 2: `ORDER-A2` status becomes **CANCELLED**.
- Step 3: Crispy Chicken Burger stock is back to **15**.
- Step 4: stock = **14**; `ORDER-A3` is PREPARING.
- Step 5: cancellation is **rejected** — HTTP **400** `INVALID_TRANSITION`, message says only PENDING orders can be cancelled; `ORDER-A3` stays PREPARING and stock stays **14**.

---

## 6. How to record results

For every case and step, record: case ID, tester name/team, date/time, tested revision, inputs used, **actual result in your own words** (do not copy the expected result), and PASS / FAIL / BLOCKED (with reason). Attach a screenshot or response excerpt for each case, labelled with an evidence ID.

## 7. How to report findings

Open a GitHub Issue in the repository above with title `[UAT] <case ID> <short summary>` and include: tested revision, case/AC, preconditions, reproduction steps, expected result, actual result, suggested severity (critical / major / minor) and evidence. Then notify the Product Team in the handoff channel.
