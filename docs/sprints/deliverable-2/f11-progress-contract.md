# F-11 Sprint 3 Progress Contract

**Owner:** Patiharn Liangkobkit  
**Reviewer:** Tanakrit Sunthonwetchapong  
**Linked requirements:** NFR-05, NFR-06

## Implemented progress

- Login repeated-failure protection with HTTP 429.
- Security response headers.
- Request IDs and structured completion logs.
- Existing health/readiness checks remain available.

## Acceptance criteria

- AC-F11-01: Five repeated invalid login attempts from the same IP/email return HTTP 429 on the next attempt.
- AC-F11-02: Successful login clears the failed-login counter.
- AC-F11-03: Every response includes `X-Request-ID`, `X-Content-Type-Options`, `X-Frame-Options` and `Referrer-Policy`.
- AC-F11-04: Existing authentication and protected endpoints remain functional.

## STS

| Test ID | AC | Level | Expected result |
|---|---|---|---|
| TEST-F11-01 | AC-F11-01 | API | 5 failures then 429 with Retry-After |
| TEST-F11-02 | AC-F11-02 | API | After failed attempts, successful login clears the counter; five subsequent failures return 401 before the next attempt returns 429 |
| TEST-F11-03 | AC-F11-03 | API | Response includes `X-Request-ID`, `X-Content-Type-Options`, `X-Frame-Options` and `Referrer-Policy` |

## Sequencing disclosure

The F-08 and F-11 contracts were added in commit
[`1986b1e`](https://github.com/Richyboy170/Software-Engineering-Project/commit/1986b1ed0be85b2ae0a10083d691e93172931fa0),
the same commit as their implementation. There is no separate earlier contract
commit or recorded red/green test evidence. This does not meet D2 Section 3.2's
contract-before-implementation sequence; the history is disclosed rather than
rewritten.
