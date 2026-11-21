# Deliverable 2 Patiharn Traceability

| Requirement / feature | Patiharn implementation | Acceptance criteria | Verification | Status |
|---|---|---|---|---|
| FR-09 / F-08 Receipt & pickup code | Persisted `pickupCode`, receipt API, customer print view | AC-F08-01–05 | TEST-RECEIPT-01, TEST-RECEIPT-02 | Implemented; local run blocked by sandbox loopback |
| NFR-02 / F-11 / receipt access | Receipt endpoint owner/staff-only guard | AC-F08-03 | TEST-RECEIPT-02 | Implemented; local run blocked by sandbox loopback |
| NFR-05 / F-11 hardening | Login attempt limiting, security headers, request IDs | AC-F11-01–04 | TEST-F11-01–03 | Implemented; local run blocked by sandbox loopback |
| Lab 6 / independent UAT | Execution and acceptance templates | A/B/C/D | Partner execution, defect/retest | BLOCKED: partner details not provided |
