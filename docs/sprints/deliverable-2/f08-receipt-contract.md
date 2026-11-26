# F-08 Contract: Digital Receipt and Pickup Code

**Owner:** Patiharn Liangkobkit  
**Reviewer:** Tanakrit Sunthonwetchapong  
**Linked requirements:** FR-09, BR-04

## Behavior

- Every successfully created order receives a unique four-character pickup code.
- The customer can retrieve a digital receipt for an order they own.
- Staff may retrieve receipts for queue operations.
- Another customer receives HTTP 403 and no receipt data.
- Receipt data is server-derived and includes order number, pickup code, status, items, unit prices, subtotals, total and creation time.
- The UI provides a printable receipt view.

## API

`GET /api/orders/:id/receipt`

Success:

```json
{
  "success": true,
  "data": {
    "pickupCode": "A2B3",
    "orderNumber": "QO-...",
    "status": "PENDING",
    "totalPrice": 298,
    "items": [],
    "createdAt": "..."
  }
}
```

## Acceptance criteria

- AC-F08-01: Every created order exposes a four-character uppercase pickup code.
- AC-F08-02: Owner/customer can retrieve the correct receipt.
- AC-F08-03: Another customer receives HTTP 403.
- AC-F08-04: UI displays the pickup code and supports print.
- AC-F08-05: Receipt values persist and remain unchanged across retrieval.

## STS

| Test ID | AC | Level | Expected result |
|---|---|---|---|
| TEST-RECEIPT-01 | AC-F08-01/02/05 | API/integration | Order and receipt contain the same pickup code and server-derived total |
| TEST-RECEIPT-02 | AC-F08-03 | Access control | Cross-customer receipt returns 403 |
