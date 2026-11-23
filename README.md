# TopPSArena — Evidence-first Free Backlinks

Live site: https://toppsarena.com

This repo operates a **small, qualified, no-cost backlink campaign**. The previous 250/519 bulk-form robot is retired. Those candidates and old run checkpoints are kept only as historical research and are **not** automatically submitted.

## What currently works

The active scheduled GitHub Actions workflow is [TopPSArena - Verified free backlinks](https://github.com/fazegrimmy/toppsarena-backlinks/actions/workflows/toppsarena-backlinks.yml). It runs twice a day, plus on tracked code changes and optionally by manual dispatch.

Four independently researched public directories that explicitly permit keyless API listing submissions are enabled:

| Destination | Evidence of permitted free API | Method | Notes |
|---|---|---|---|
| DevElif | https://develif.com/docs | POST /api/submit | Gaming category. Site was already listed; confirmed public direct followed link https://develif.com/s/toppsarena |
| CurlShip | https://curlship.com/openapi.json | POST /api/submit | Verified public free listing https://curlship.com/l/11593 with **nofollow** link |
| TechTools Launchpad | https://techtools.cz/launchpad-api/docs | GET /tools?url= preflight, POST /tools | Existing listing found; public API record https://techtools.cz/tools/launchpad/?tool=12141. **HTML backlink is unverified** because listing may render via JavaScript |
| PromoteIndex | https://promoteindex.com/openapi.json | POST /api/v1/projects | Relevant Community category. Can return a private signed submission queue; temporary tickets remain in memory only, never committed. No automated votes or link-badge requirements |

Current results are in [reports/verified-backlinks.md](reports/verified-backlinks.md). **Verified HTML backlinks require an independently fetched public listing page with a direct `<a href>` to the exact TopPSArena domain.** A successful GitHub job, POST accepted, 409 already listed, redirect, search result or public API-only entry is NOT enough. This is not a promise of search rankings.

## Preventing failed or duplicate submissions

- An existing accepted/rejected submission response is persisted in `state/reliable-campaign.json`, so it is not re-sent on schedules. TechTools also supports exact-domain lookup before a POST.
- Only reviewed provider IDs and their documented free APIs are ever allowed to receive submissions. No generic 519-site form submission loop.
- No payments, user accounts, CAPTCHA bypass, forced reciprocal badges, artificial votes or repeated mass submissions.
- Directory private edit keys, queue tickets and owner-contact fields are redacted before saving the **public** repository. Never store private tokens in the repo.
- Temporary submission queues are retried using in-memory signed tickets during the same workflow run when timing permits; unresolved queues remain **pending**, not successful.
- Existing published links are rechecked. Failed fetches (403, network errors, JavaScript rendering) are labelled **not verifiable**, not automatically deleted.

## Quality checks and reporting

`scripts/backlink-helpers.mjs` contains site validation, proof parsing, secret redaction and status classification.
`tests/backlink-helpers.test.mjs` contains native Node.js regression tests.
`scripts/verified-campaign.mjs` runs the eligible API submissions and independent publication checks.

The GitHub Actions job must pass its syntax and unit tests before submitting.

- [Live verification state](state/reliable-campaign.json)
- [Published backlink evidence](reports/verified-backlinks.md)
- [Reviewed provider allowlist](campaign/verified-opportunities.json)

**Limits:** Four eligible APIs are not a high-volume link-building strategy. Gaming-specific publicity, owner outreach and editorial links generally need relevant site owners' approval. A listing that has no public HTML backlink is reported separately, even when its directory API says it is live.
