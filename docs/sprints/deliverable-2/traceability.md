# Deliverable 2 Patiharn Traceability

| Requirement / feature | Patiharn implementation | Acceptance criteria | Verification | Status |
|---|---|---|---|---|
| FR-09 / F-08 Receipt & pickup code | Persisted `pickupCode`, receipt API, customer print view | AC-F08-01–05 | TEST-RECEIPT-01, TEST-RECEIPT-02 | Implemented; both receipt tests pass in latest local run |
| NFR-02 / F-11 / receipt access | Receipt endpoint owner/staff-only guard | AC-F08-03 | TEST-RECEIPT-02 | Implemented; cross-customer receipt test passes in latest local run |
| NFR-05 / F-11 hardening | Login attempt limiting, security headers, request IDs | AC-F11-01–04 | TEST-F11-01–03 | All F-11 tests pass in latest local run |
| Lab 6 / independent UAT | Execution and acceptance templates | A/B/C/D | Partner execution, defect/retest | BLOCKED: partner details not provided |

## Release gate and known limitations

- Do not merge this auto-deploying change to `main` until the Lab 6 partner
  retest and acceptance are recorded (target: 27 November 2026). Any Lab 6 fix
  release must remain on Sprint 1. This change affects Sprint 1 through the
  five-failure login 429, pickup-code migration, and new response headers.
- The login limiter is an in-memory map keyed by request IP and normalized
  email. Repeated failures from the same IP can lock out that account; counts
  are process-local, are not shared across Cloud Run instances, and reset on
  process restart.
- The F-08/F-11 contracts and implementation were introduced in the same
  commit (`1986b1e`); no earlier contract commit or red/green evidence is
  recorded. See the sequencing disclosure in the F-11 progress contract.
