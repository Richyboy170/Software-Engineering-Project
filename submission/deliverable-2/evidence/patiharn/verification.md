# Patiharn Deliverable 2 Verification

## Builds

```text
server: npm run build — PASS
client: npm run build — PASS
prisma: prisma generate v5.22.0 — PASS
```

## Tests
GitHub CI run: https://github.com/Richyboy170/Software-Engineering-Project/actions/runs/44958787735
Migration-hardening rerun: https://github.com/Richyboy170/Software-Engineering-Project/actions/runs/44962579317

```text
Test Files  5 passed (5)
Tests       35 passed (35)
Frontend build: passed
Docker production build: passed
```

The earlier local sandbox run was blocked by loopback `EACCES`; the external GitHub runner completed the suite successfully.
