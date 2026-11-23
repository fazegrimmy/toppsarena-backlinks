# Backlink Pilot v3 — TopPSArena source audit

**Source:** https://github.com/s87343472/backlink-pilot  
**Official historical target list:** https://github.com/s87343472/backlink-pilot/blob/main/targets.yaml  
**Reviewed:** 23 November 2026  
**Target:** https://toppsarena.com

## The key distinction

The repository's **current v3/main branch is a Markdown AI-agent playbook**. The author explicitly says there is **no working batch-submit CLI, populated list of already submitted sites, or live verification log in main**. Browser automation and a command-line runner exist only in the older [v2.1 `old` branch](https://github.com/s87343472/backlink-pilot/tree/old), and require a browser/third-party packages. Its old `src/batch-submit.js` is for blog-comment batching and is not an approved backlink channel. Do not claim this repository automatically creates backlinks by itself on GitHub Actions.

### Useful, safe ideas from the playbook

- Dedupe by directory/domain and avoid resubmitting the same website without explicit review.
- Record source, free tier, account/email/captcha/reciprocal requirements and relevance before promoting a lead.
- A suggested pace is **2–4 real submissions daily**, with unlimited read-only research. This is upstream guidance, **not yet a newly enforced cap** in our runner.
- Separate **submission accepted**, **editorial approval**, **live directory listing**, and **independently verified backlink** statuses.
- Skip paid, badge-required, reciprocal-required, no-fit and bot-challenged directories unless explicitly authorized by the owner.
- For screenshot / ownership verification / account creation, keep human approval and exact truthful content.

These principles overlap with the existing TopPSArena strict publisher allowlist and public HTML verification.

## Historical list screen

| Measure | Count |
|---|---:|
| Entries in upstream `targets.yaml` | 258 |
| Distinct listed hostnames | 245 |
| Entries in `overseas_general` | 59 |
| Entries in `overseas_directories` | 39 |
| Of 98 overseas general/directory records, already known to our research ledger | 64 |
| Additional not yet tracked in those sections | **34** |

The 34 additional historical entries are retained as **research-only** in [our screened JSON file](../research/backlink-pilot-untracked-research-2026-11-23.json). Their upstream `auto: yes` flag does **not** establish current API permission or a real public backlink. AI-only and China-specific categories were not bulk imported into our high-priority queue because a UK gaming-server toplist is not an AI product.

## First-party checked prospects

| Priority | Website | What its current site actually offers | Status |
|---|---|---|---|
| **High** | [Webwiki](https://www.webwiki.com/info/add-website.html) | **Free** submit form; `Fun and Games` category, website URL, title, description, email. Its historic status 'dead' in Backlink Pilot is **out of date**. | **Manual submission candidate**, no published link yet |
| **High** | [WebsiteHunt](https://www.websitehunt.co/websites/submit/create) | Curated websites with a real `Games` category, including working gaming-related pages. Site submission redirects to account login. | **Manual registration**, free listing terms/link rel unverified |
| **Medium** | [All Business Directory](https://www.allbusinessdirectory.biz/directory.php?page=submission-select) | `Standard Listings` explicitly **free**, homepage URL only, average queue approximately **four months**; paid fast/featured options separate. | **Free manual queue**, no published link yet |
| **Low — indexing only** | [Active Search Results](https://www.activesearchresults.com/addwebsite.php) | Documented GET/POST submission with `url` and `email` fields and no login. This is an **independent search engine indexing request**, not a demonstrated public backlink. | **Not a backlink publisher**, no submission attempted |
| **Low — undecided** | [Dizila](https://www.dizila.com/submit) | Category selection exists; full free terms, live form and link placement not verified. | Research only |

### Excluded or blocked

- [IndieTools.co](https://indietools.co/) is offered for sale, not an active web directory.
- [Thales Directory](https://thalesdirectory.com/submit/) first-party submit URL returned HTTP 404.
- [Unloc](https://www.unloc.tools/submit-tool) and [Wewaat](https://www.wewaat.com/submitnewtool) submission pages returned 404.
- [World Web Directory](https://www.worldweb-directory.com/add.php) is currently behind a request-verification challenge; no bypass.
- AI-specific directories (over 80 overseas AI rows) cannot be assumed relevant to TopPSArena just because the YAML lists them as automatic.
- Do not use legacy blog-comment batching or unsolicited awesome-list mass PRs.

## Campaign changes made

1. Wrote [research/backlink-pilot-untracked-research-2026-11-23.json](../research/backlink-pilot-untracked-research-2026-11-23.json) with 34 previously untracked historical general-directory leads, first-party evidence and exclusion flags.
2. Added **Webwiki, WebsiteHunt, All Business Directory and Active Search Results** to [campaign/qualified-outreach.json](../campaign/qualified-outreach.json), clearly flagging the last as an indexing-only channel.
3. Updated the source repository record with the documented limitation: no runnable v3 bulk submitter.

**Actual new external submissions from this audit: 0. New public HTML-verified backlinks: 0.** No changes were made to the active trusted API auto-submission allowlist. These additions will not launch form spam or pass CAPTCHAs.

### Recommended next action

Prioritise an authentic manual submission to **Webwiki**, then **WebsiteHunt** (after owner account creation), while continuing to research genuine documented free API directories. Do not assume a submission is a backlink until it becomes a public page with a verified HTML link pointing to `https://toppsarena.com`.
