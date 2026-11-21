# Patiharn Lab 5 Evidence

**Author:** Patiharn Liangkobkit (`66070503489`, `@Richyboy170`)  
**Repository:** https://github.com/Richyboy170/Software-Engineering-Project

## C-01: Normal Pull Request CI

PR #18, `release(lab5): Sprint 1 staging to main`, ran `test-and-docker` successfully.

- Workflow run: https://github.com/Richyboy170/Software-Engineering-Project/actions/runs/44832537856
- Check: `test-and-docker`
- Result: pass
- Release PR: https://github.com/Richyboy170/Software-Engineering-Project/pull/18

The same required check also passed on the deploy run triggered after the merge:

- Deploy run: https://github.com/Richyboy170/Software-Engineering-Project/actions/runs/44882991816
- Test job: `test-and-docker`
- Result: pass

## C-02: Intentional Failure Blocks Merge

Temporary PR #17 was opened from `test/c02-blocked-merge` into `sprint-1-staging`.

- PR: https://github.com/Richyboy170/Software-Engineering-Project/pull/17
- Change: `/api/menu` unit-test response was changed to `{"success":true,"data":[]}`, which deliberately violated the smoke-test non-empty-list expectation.
- Failing workflow: https://github.com/Richyboy170/Software-Engineering-Project/actions/runs/44832287247
- Result: `test-and-docker` failed.
- Closed without merging; temporary branch was deleted.
- This is evidence that a failed required check is outside the release path.

The failing diff is `deploy/tests/test_smoke.py` in PR #17.

## Independent Persistence Probe

Date: 21 November 2026, independent verification after pipeline release of revision `quickorder-00003-55s`.

Public URL: https://quickorder-fzeemousqa-as.a.run.app

Observed results:

```text
GET /api/health
{"status":"ok","service":"QuickOrder API"}

GET /api/ready
{"status":"ready","db":"connected"}

GET /api/menu
HTTP 200
5 menu rows returned
Classic Cheeseburger stock 18
Truffle Parmesan Fries stock 2
Ceremonial Matcha Latte stock 0 / unavailable
```

These public responses confirm that the deployed revision can read database-backed menu and stock state. This is independent evidence; the exact order created in Tanakrit's C-04/C-05 workflow is recorded in his Part 3 evidence.

## C-06: Release Identification

- Merge commit: `12c18be5fa0571abf374f0b447baa49117826513`
- Cloud Run revision: `quickorder-00003-55s`
- Image tag: `12c18be5fa0571abf374f0b447baa49117826513`
- Image digest: `sha256:426990572d5275d7c67c8503d3cabcc9038615c0e34d69778833268c8d86e128`
- Full deployed image: `asia-southeast1-docker.pkg.dev/cpe334-quickorder/quickorder/quickorder@sha256:426990572d5275d7c67c8503d3cabcc9038615c0e34d69778833268c8d86e128`
- Release workflow: https://github.com/Richyboy170/Software-Engineering-Project/actions/runs/44882991816

