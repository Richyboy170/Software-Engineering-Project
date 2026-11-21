# Lab 6 and Deliverable 2 Work Allocation

**Project:** QuickOrder  
**Team:** Patiharn Liangkobkit (`@Richyboy170`) and Tanakrit Sunthonwetchapong (`@Tanakrit-triton`)  
**Lab 6 deadline:** 22 November 2026  
**Deliverable 2 deadline:** 29 November 2026  
**Status:** Draft for Tanakrit review. No implementation or defect correction starts until this allocation is confirmed.

## Confirm Before Implementation

Tanakrit, please confirm:

- [ ] Ownership split below
- [ ] Partner team name and section
- [ ] Partner team application repository and public URL
- [ ] Partner UAT handoff owner and scheduled date/time
- [ ] QuickOrder baseline commit/tag and deployed revision accepted for UAT
- [ ] Which partner case evidence is private or needs no real credentials
- [ ] Deliverable 2 target main commit and deployment window

This plan is blocked until the partner team and UAT session are identified. A partner team is required for independent execution; QuickOrder must not substitute self-testing for the partner UAT team.

## Shared Rules

- Both students participate in Lab 6 and Deliverable 2.
- Every implementation change uses an issue, feature branch, PR into `sprint-1-staging`, substantive teammate review, passing CI, and integration.
- Release-blocking findings and Deliverable 2 candidate releases require review and deployment from `main`.
- Authors do not approve their own PRs.
- Lab 6 findings must be evidence-based. Real defects are not invented. A sound product follows the controlled-exercise process only if directed by the instructor/TA.
- Lab 5 release evidence remains distinct from the Deliverable 2 candidate evidence.
- No real passwords, tokens, connection strings or service-account keys enter Issues, PRs or PDFs.

## Lab 6: Independent UAT and Defect Management

### Ownership: Tanakrit

**Primary owner — QuickOrder Product Team, Parts A, C and D setup**

- [ ] Prepare at least four executable QuickOrder UAT cases.
- [ ] Cover:
  - one normal customer domain journey;
  - one stock/business-rule boundary;
  - one customer/owner or staff-role access boundary;
  - one state/history/persistence case.
- [ ] Link stable case IDs to Sprint 1 requirements and acceptance criteria.
- [ ] Record purpose, role, preconditions, synthetic inputs, numbered actions and exact expected results.
- [ ] Prepare and privately hand off safe test accounts, setup/reset/cleanup instructions, URL, commit/tag, revision and accepted-for-test scope.
- [ ] Own the QuickOrder-side GCP handoff and confirm the deployed release before partner testing.
- [ ] Keep a triage table for every finding reported by the UAT partner.
- [ ] Reproduce and classify partner findings as accepted defect, duplicate, not-defect or enhancement.
- [ ] Own GCP redeployment for accepted defect corrections.
- [ ] Preserve the baseline and corrected deployed revisions.

**Done when:** the partner can execute all cases without verbal explanation, the exact tested baseline is recorded, and all received findings have a documented disposition.

### Ownership: Patiharn

**Primary owner — Independent UAT Team, Parts B and C/D evidence**

- [ ] Identify the partner Product Team, partner members and partner repository/application.
- [ ] Execute all partner-provided Sprint 1 UAT cases on the partner's recorded deployed release.
- [ ] Both students participate in independent execution; Patiharn records the execution evidence.
- [ ] Record for every case: case ID, tester, date/time, tested version, inputs, actual result and PASS/FAIL/BLOCKED.
- [ ] Capture normal journey and negative/access evidence, including no protected state change or disclosure.
- [ ] Report reproducible partner findings with Issue ID, version, case/requirement, reproduction, expected/actual result, severity and evidence.
- [ ] Submit the Lab 6 PDF and place source/evidence in `submission/lab6/`.
- [ ] Assemble the partner retest/acceptance record and the final UAT decision.
- [ ] Track any unresolved tester or partner dependency and disclose Not Accepted/BLOCKED rather than inventing sign-off.

**Done when:** actual independent execution and evidence exist, outgoing defect reports are traceable, partner re-tests are recorded, and only the partner UAT Team confirms QuickOrder acceptance.

### Shared Lab 6 tasks

- Both members review the other's UAT/evidence PR.
- Both can explain the complete UAT workflow and one received defect chain.
- Patiharn owns the final PDF assembly.
- Tanakrit owns the Product Team side and GCP redeployment.
- If no natural defect exists, both follow the controlled-exercise process only if the instructor/TA provides it.

## Deliverable 2: Sprint 2 Completion and Sprint 3 Progress

### Ownership: Tanakrit

**Owns backend/data Sprint 2 and remaining analytics design**

- [ ] Complete `F-07` Menu & Stock Inventory Management.
- [ ] Complete `F-09` database concurrency protection and negative/boundary cases.
- [ ] Add/update the Sprint 2 contracts, AC and STS for owned features before implementation.
- [ ] Implement database-backed staff inventory workflows and concurrency behavior.
- [ ] Add unit/API/database tests and meaningful TDD red/green evidence for owned defects/rules.
- [ ] Define and implement at least one meaningful Sprint 3 `F-10` sales-reporting workflow or rule.
- [ ] Add backend/API/database evidence and persistence verification.
- [ ] Update the SRS, feature inventory and System-Level SDS sections related to data, API and analytics.
- [ ] Review and deploy accepted GCP candidate changes under the existing CI/CD process.

### Ownership: Patiharn

**Owns Sprint 2 receipt workflow, cross-feature regression, traceability and candidate integration**

- [ ] Complete `F-08` Digital Order Receipt & Order Code.
- [ ] Add Sprint 2 contract/AC/STS/DoD evidence for owned receipt behavior.
- [ ] Implement a selected Sprint 3 workflow/rule for `F-11` or another approved remaining feature.
- [ ] Add selected UI/API/database integration and access tests.
- [ ] Update complete requirements-to-feature-to-sprint-to-verification traceability.
- [ ] Map every AC as implemented/not implemented and test run/pass/fail/skip.
- [ ] Add two required automated test excerpts:
  - one domain/cross-feature or boundary rule;
  - one access restriction or ownership rule.
- [ ] Prepare two substantive Issue/PR chains with branch, reviewer, staging integration and release history.
- [ ] Own candidate build/regression/CI evidence and final PDF assembly.
- [ ] Produce the dated remaining-work plan to 13 December.

### Shared Deliverable 2 tasks

- Complete all Sprint 2 features: `F-07`, `F-08`, `F-09`.
- Implement and test at least one meaningful Sprint 3 workflow/rule.
- Candidate on `main` includes Sprint 1, Sprint 2 and implemented Sprint 3 progress.
- Preserve the original Sprint 2 release/version and identify later candidate changes.
- Deploy the integrated candidate on GCP and verify the critical journey and persistence.
- Record Lab 5–7 and UAT findings in the change/defect register.
- Keep Docker, environment variables, migrations, setup, tests and deployment runbook current.
- Submit one complete PDF containing all Parts A–E and evidence.

## Proposed Sprint 2 Feature Split

| Feature | Primary owner | Secondary reviewer | Verification |
|---|---|---|---|
| F-07 Menu & stock management | Tanakrit | Patiharn | Staff-only API/UI, stock boundaries, database persistence |
| F-08 Receipt & pickup code | Patiharn | Tanakrit | Order snapshot, UI/API/database, access ownership |
| F-09 Concurrency protection | Tanakrit | Patiharn | Unit/API/integration concurrency and no oversell |
| F-10 Sales analytics | Tanakrit | Patiharn | Server-authoritative totals/report rules and API tests |
| F-11/selected hardening | Patiharn | Tanakrit | Logging/rate limiting/observability and tests |

This split is a proposal only until Tanakrit confirms it.

## Reference Handouts

- [Lab 6 UAT](../../Lab_6_Sprint_1_UAT.pdf)
- [Deliverable 2](../../project_deliverable_2_v1.pdf)
- [Existing Lab 5 work allocation](./labs/lab-05/work-allocation.md)
- [Sprint plan](./sprints/plan.md)
- [Feature inventory](./features.md)
