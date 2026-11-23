# TopPSArena — Reddit MicroSaaS directory audit and new Parallel leads

**Reviewed:** 23 November 2026  
**Source:** https://www.reddit.com/r/microsaas/comments/1c5fmqk/64_free_tool_submission_sites_for_backlinks_sales  
**Target:** https://toppsarena.com

## Summary

The Reddit post supplies **64 numbered entries**, mostly SaaS and AI-tools sites, dating back to April 2024. It is **not** a verified 2026 free backlink or dofollow list. Multiple entries repeat the same domain, and a number exclude products outside AI and software. We verified first-party pages instead of trusting the Reddit author's claimed DA.

### From the Reddit list — strongest TopPSArena opportunities

| Site | Evidence and suitability | Cost/account | Status |
|---|---|---|---|
| **[Startup Buffer](https://startupbuffer.com/site/submit)** | Current first-party form offers **Gaming** category, site URL, short/full pitch, email and screenshot. Relevant to a live gaming discovery website. | No upfront payment shown in form; final free-tier approval not independently confirmed; real screenshot and owner details required. | **Qualified, human form** |
| **[Launched!](https://launched.io/SubmitStartup)** | Official submission says a publicly accessible product/startup may be editorially approved and needs a screenshot and business details. | Form shows no price; free publication unverified. | **Qualified, human form** |
| **[StartupStage](https://startupstage.app/)** | Official FAQ describes free founder signup and editorial approval for weekly cohort. May fit TopPSArena as a new gaming platform. | Founder account required; site also sells memberships; free route must be used. | **Qualified, account required** |

**Already in TopPSArena research:** Product Hunt, Fazier, Launching Next, SaaSHub and MicroLaunch. Re-adding duplicates does not make links.

### Important false-positive warnings

- **[Fazier](https://fazier.com/submit):** Free Basic tier **requires a reciprocal backlink on your homepage/footer**. No-badge listings are paid. Not suitable for our no-reciprocal-link automation.
- **[Startups.fyi](https://tally.so/r/3lOGLk):** Its actual submission form now explicitly states **featured listings start at $29 and paid completion is required**. The Reddit claim about a free site listing is outdated.
- **[Find Cool Tools](https://findcool.tools/):** The domain is for sale/expired.
- **[First 100 Users](https://www.first100users.com/submit):** Its free form is only for marketing tools; TopPSArena is not such a tool.
- **[Devpost](https://info.devpost.com/legal/devpost/community-guidelines):** A developer project/hackathon showcase, not a general URL drop for backlink purposes.
- **Tiny Startups:** Could not verify current site or free listing because official site was inaccessible.
- Most AI-only directories reject projects that are not AI tools; do not mislabel TopPSArena as an AI tool.

### Four additional first-party opportunities from our concurrent Parallel hunt

| Site | Free/manual/API details | Suitable? |
|---|---|---|
| **[Orbitlist](https://orbitlist.io/api-docs)** | Free product listing, anonymous **draft API** `POST /api/drafts/from-url` and subsequent review/submission. Draft text should be checked before publishing. | **High potential**, agent workflow not yet integrated |
| **[Ignlab Launch](https://launch.ignlab.net/submit.html)** | Free, no registration, human moderation; asks an arithmetic anti-bot question. | **Potential**, manual only |
| **[Add My URL](https://www.admyurl.com/addurl.php)** | Free tier shown and **Games** category; manual form asks site description, contact email and terms. | **Potential**, free manual |
| **[The Gaming Diary](https://www.thegamingdiary.com/submit-a-press-release)** | Editorial consideration for real game/esports website launches or meaningful news. | **Relevant coverage**, no guaranteed link |

### Automated API success — LaunchSignal

During research we independently verified **[LaunchSignal official API](https://launchsignal.ai/docs/api)**, its read-only no-write `?dry_run=1` check, its manual approval policy, and public `/l/{slug}` listings.

- Added documented `scripts/launchsignal.mjs` module and `tests/launchsignal.test.mjs` unit tests.
- Updated the strict API publisher allowlist and GitHub Actions workflow.
- **Actual external submission completed:** HTTP **201**, slug `toppsarena`, status **pending**. GitHub stored receipt in `state/reliable-campaign.json`.
- Subsequent status check: not yet public. Approval required and an independent HTML hyperlink check is required.
- Outbound free listing links are **nofollow**; optional reciprocal badge for seven-day priority is **not** needed or used.
- **New verified backlink from this API to date: 0.** The campaign's pre-existing independently verified total remains separate.

### What we deliberately did NOT do

No bulk spam posts, fake business profiles, paid checkout, reciprocal badges, CAPTCHA bypasses, invented votes, or automated submissions to AI-only directories. Newly qualified human-form opportunities stay `automationAllowed: false` in the campaign.

**Result for this research batch:** **7 qualified research records added** (3 from Reddit, 4 from concurrent Parallel discovery); **one accepted free LaunchSignal API submission (not published yet)**; **zero newly verified published backlinks**.
