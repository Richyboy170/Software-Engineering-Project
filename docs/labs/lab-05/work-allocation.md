# Lab 5 Work Allocation and Contribution Record

**Project:** QuickOrder  
**Team:** Patiharn Liangkobkit (`@Richyboy170`) and Tanakrit Sunthonwetchapong (`@Tanakrit-triton`)  
**Lab 5 deadline:** TBA; see the course announcement from 14 November 2026.

## Purpose

This plan gives each person clear primary ownership of implementation, tests, evidence, and documentation. Ownership is for accountability, not a permanent role: both members must participate in deployment and be ready to explain any sampled release step.

The split follows the Lab 5 score areas: Tanakrit owns Docker/configuration and GCP/persistence (55 points total); Patiharn owns CI/quality gates and repeatable releases (45 points total). Patiharn's completed Sprint 1 and Deliverable 1 work is recorded below as prior contribution, so it is not assigned again.

## Work already completed and credited

| Owner | Completed work | Credit in this plan |
|---|---|---|
| Patiharn | Completed the Sprint 1 work for the team and prepared the QuickOrder Deliverable 1 report. Patiharn reports that preparing the report took about 2–3 hours. | Count as completed contribution. Do not ask Patiharn to redo Sprint 1 or the Deliverable 1 report as Lab 5 work. |

The existing Deliverable 1 PDF is [CPE334_Deliverable_1_QuickOrder.pdf](../../../submission/CPE334_Deliverable_1_QuickOrder.pdf). The sprint scope is in [docs/sprints/plan.md](../../sprints/plan.md). Lab 5 work and its final PDF are separate from that submission.

## Ownership: Tanakrit

**Owns:** Docker and configuration (R-01/R-02), GCP deployment and persistent data (R-03/R-04), plus documentation and evidence for those areas.

- [ ] Create and label Tanakrit's own Lab 5 issue(s); keep the issue(s), branch, pull request, and evidence under Tanakrit's authorship.
- [ ] Make a fresh-clone Docker Compose setup build and start successfully. Check the environment examples and document every required setting without putting real credentials in Git.
- [ ] Keep GCP provisioning on hold until the course announces that the GCP access issue is resolved. While waiting, complete only non-billable preparation such as Docker checks and documentation.
- [ ] After the course announces the access fix, own the GCP setup and its operating cost safeguards: set a budget alert before creating billable resources; use the course-prescribed free-trial account and do not prepay or upgrade.
- [ ] Set up the Cloud Run and Cloud SQL PostgreSQL resources, secrets, and runtime access needed by QuickOrder. Use the resource naming contract in the current [deployment runbook](./deployment.md); record the actual project ID and any changed names there.
- [ ] Align the provisioning and teardown resource names in [deploy.sh](../../../deploy/deploy.sh) and [teardown.sh](../../../deploy/teardown.sh) with that contract.
- [ ] Verify that the public application serves its UI and API and that the database is durable. Capture evidence that data remains after a service restart and a redeployment.
- [ ] Write and maintain the sections of [deployment.md](./deployment.md) covering the selected stack, environment/configuration, local Docker commands, and actual GCP resources and settings.
- [ ] Write Tanakrit's own answers/evidence for the Lab 5 submission sections about Docker/configuration, GCP, and persistence. Keep source notes and screenshots in `submission/lab5/evidence/tanakrit/`.
- [ ] Open Tanakrit's pull request into `sprint-1-staging`, link the Lab 5 issue, and resolve any review findings on Tanakrit's own changes.

**Done when:** a clean clone can run the documented container setup, the public UI/API and Cloud SQL connection work, persistence evidence is captured, and Tanakrit's code, runbook sections, and submission material are in the repository.

## Ownership: Patiharn

**Owns:** CI and quality gates (R-05/R-06), repeatable release and commit identification (R-07/R-08), plus documentation, evidence, and final submission assembly for those areas.

- [ ] Create and label Patiharn's own Lab 5 issue(s); keep the issue(s), branch, pull request, and evidence under Patiharn's authorship.
- [ ] Own the [CI workflow](../../../.github/workflows/ci-docker.yml) and required PR check. Make passing tests/builds succeed and demonstrate that an intentionally failing change is blocked by the required check. Remove any check that hides failures.
- [ ] Own the [deployment workflow](../../../.github/workflows/deploy.yml) and [release script](../../../deploy/release.sh). Configure the documented repository/environment variables and secrets, use keyless GCP authentication as the course requires, deploy from `main`, and show which commit is running.
- [ ] Align the workflow and release-side scripts with the QuickOrder resource names in the [deployment runbook](./deployment.md). Tanakrit owns the provisioning/teardown-side names; this file and the runbook are the shared written contract, so no verbal handoff is needed.
- [ ] Write and maintain the CI and release-procedure documentation in [deployment.md](./deployment.md), including the required check, intentional-failure evidence, release steps, rollback/revision identification, and smoke-check results.
- [ ] Write Patiharn's own answers/evidence for the Lab 5 submission sections about CI, quality gates, and release. Keep source notes and screenshots in `submission/lab5/evidence/patiharn/`.
- [ ] Assemble the final Lab 5 PDF from both members' authored sections and evidence, use the exact filename pattern and section/group details required by the handout, and submit it.
- [ ] Open Patiharn's pull request into `sprint-1-staging`, link the Lab 5 issue, and resolve any review findings on Patiharn's own changes.

**Done when:** the normal PR check passes, an intentionally failing PR is blocked, a reviewed release from `sprint-1-staging` to `main` deploys automatically, the running commit is identifiable, and Patiharn's documentation/evidence is included in the final PDF.

## Documentation and evidence ownership

Each person documents their own primary work and writes their own contribution statement. Do not write claims about work performed by the other person. Keep the final report source material in these separate folders:

- Tanakrit: `submission/lab5/evidence/tanakrit/`
- Patiharn: `submission/lab5/evidence/patiharn/`

The Lab 5 submission is one PDF answering the handout's Parts 0–4. Each member supplies their own contribution entry and the answer/evidence for their assigned technical areas. Patiharn assembles the final PDF after both sets of material have been committed. The final PDF does not replace the existing Deliverable 1 PDF.

**Current integration risk to resolve within those ownership boundaries:** [deployment.md](./deployment.md) describes QuickOrder resources, while the existing [deployment workflow](../../../.github/workflows/deploy.yml) and [provisioning scripts](../../../deploy/deploy.sh) still contain TokTickIT names. Tanakrit aligns the provisioning/teardown side; Patiharn aligns the workflow/release side. Keep the runbook's QuickOrder names as the shared contract and record any necessary change there before provisioning.

## Required repository workflow

Use the lab and sprint workflow for both owners' changes:

1. Create an issue for the work and apply the required `lab5` label. Add the issue to the project board if the course board is in use.
2. Create a feature branch from `sprint-1-staging`. Keep each branch limited to its owner's assigned changes.
3. Open a pull request into `sprint-1-staging`, link the issue, and retain the CI run and review history.
4. The other teammate gives a substantive review on GitHub. A pull request author cannot approve their own pull request. The author makes any fixes on their own branch.
5. After the feature pull requests are merged and checks pass, Patiharn opens the release pull request from `sprint-1-staging` to `main`. Preserve its review, CI, and deployment evidence.
6. Keep the issues, `lab5` labels, pull requests, comments/reviews, and workflow history available for grading.

## Shared participation required by Lab 5

The two work areas stay separately owned, with no paired coding or shared implementation tasks. The Lab 5 handout also says the work cannot be divided into permanent roles, so both members must take part in release/deployment and understand the overall workflow.

- [ ] After GCP access is restored, Tanakrit triggers at least one release from `main` and records the workflow run and running commit.
- [ ] After a deployment, Patiharn independently runs and records a persistence check across restart/redeployment.
- [ ] Each member reviews the other's pull request and can explain the other member's assigned area, including the relevant tests and documentation.
- [ ] Both members can explain any release step sampled by a TA, not only the step each personally performed.

Each member keeps their own requirement/issue, implementation, test result, AI-supervision notes required by the course, review activity, and deployment evidence. A reviewer can request clarification in the PR; each author makes changes to their own work.

## Reference files

- [Lab 5 handout](../../../01_SE_Lab_5_updated.pdf)
- [GCP deployment and CI/CD student guide](../../../03_Student-Guide-GCP-Deployment-and+CI+CD-V1_1.pdf)
- [Project Deliverable 1 instructions](../../../project_deliverable_1_v1.pdf)
- [Completed QuickOrder Deliverable 1 submission](../../../submission/CPE334_Deliverable_1_QuickOrder.pdf)
- [Sprint plan](../../sprints/plan.md)
- [Deployment runbook](./deployment.md)
