# TopPSArena: additional directory leads (23 November 2026)

These files are **research data only**, not proof of 269 free-forever listings or published backlinks.

## Files
- `new-free-directory-leads.txt`: 269 additional website URLs, one per line. Names contain “free” because the source list **claims a free path**; some require an account, badge, review queue, or other condition. Always recheck.
- `new-free-directory-leads.csv`: those 269 URLs with the source, free classification, source check date, any recorded outcome for the **source's own site**, and rough review priority. The `verified_for_toppsarena` and `submitted` columns default to NO.
- `master-519-candidate-urls.txt`: 250 existing campaign candidates followed by 269 additional leads. It is **not** a preapproved automatic-submission target list.

## Sources and credit
1. [Where to Submit Your Startup / SubmitMyStartup](https://github.com/mmmmingos/where-to-submit-your-startup) — 136 new domains in this export; its read-only JSON API offers richer cost and requirements information: https://submitmystartup.com/api/v1/directories.json . Copyright © 2026 mmmmingos; MIT License: https://github.com/mmmmingos/where-to-submit-your-startup/blob/main/LICENSE
2. [Wavegrain / Awesome Launch Directories](https://github.com/wavegrain/awesome-launch-directories) — 29 new domains in this export, including their submission history statuses. The source's `live` label means *the source publisher's own site*, **not** TopPSArena, appeared. CC0 1.0: https://github.com/wavegrain/awesome-launch-directories/blob/main/license
3. [Startup Launch List](https://github.com/volodstaimi/Startup-Launch-List) — 104 additional candidate domains tagged Free by its dataset but **not independently checked** here. MIT License: https://github.com/volodstaimi/Startup-Launch-List/blob/main/LICENSE

## Filtering performed
- Dropped entries whose host occurs in the current 250-candidate TopPSArena campaign or in the pinned BacklinkFlow directory database, using simple hostname comparison.
- Removed non-HTTPS URLs and obvious topical mismatches such as AI-only directories, restaurant, travel, real estate, medical, and payment-focused listings. Automated topical filters are imperfect.
- Removed generic social profiles and hosted forms where a shared domain cannot reliably identify a directory.
- Deduplicated the remaining URLs by hostname, prioritising reviewed free entries ahead of weaker general catalogue claims.

**Do not automatically submit all 519.** Check each destination's actual terms, accepted categories, and free submission route before using it. Avoid CAPTCHA bypass and creating irrelevant or misleading listings. A backlink is only confirmed when a public listing page actually links to https://toppsarena.com.

## Other large source lists for further research
- [Maxlibin Free Directory Submissions](https://github.com/maxlibin/free-directory-submissions) — small browser-verified no-login set + a much larger bulk list; the bulk set is not similarly verified
- [BacklinkFlow](https://github.com/imsankz/backlinkflow) — source of the original campaign candidates
- [Hyklinks](https://hyklinks.dev/) — publicly reports free-submission outcomes and failures
- [Dirpush](https://dirpush.com/) — open-source directory submission project and candidate registry
- [Corey Haines directory reference](https://github.com/coreyhaines31/marketingskills/blob/main/skills/directory-submissions/references/directory-list.md)

The 269 new candidates are deliberately **not added to the current running GitHub campaign**. They are a separate research batch until suitability is assessed.
