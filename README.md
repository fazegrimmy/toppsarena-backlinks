# TopPSArena — free directory campaign

Website: **https://toppsarena.com**

This public repository contains a **250-site directory research and screening queue** for TopPSArena, a private gaming server toplist. The list is derived from the open-source BacklinkFlow dataset (pinned 15 October 2026). **These are unverified candidates, not 250 confirmed suitable or free listings.**

## Start on Android

1. Open **[GitHub Actions](https://github.com/fazegrimmy/toppsarena-backlinks/actions/workflows/toppsarena-backlinks.yml)**.
2. Choose **Run workflow**.
3. Choose **preview** to view the entire 250-site queue, divided into five downloadable reports. Preview never submits anything.
4. To perform a single run covering the full queue, choose **submit**, type **SUBMIT** and supply a **public TopPSArena contact email**. Confirm the run once. Five jobs share the 250 candidates, with at most three running at once.
5. Inspect each job's status and download the artifacts after completion. A **reported submission** is *not* a **published backlink**.

The runner searches each candidate for an appropriate website listing form, follows a same-site 'Submit' link where available, and skips obvious login, human challenge, payment, missing-form and required-agreement obstacles. It does not bypass CAPTCHA, automate account creation, or pay fees. Some sites will remain manual-only. It does not guarantee 250 live backlinks.

## Repeated runs and progress

For live mode the workflow saves checkpoints after every four processed candidates in `state/shard-0.json` through `state/shard-4.json`. The next run skips URLs already checked; the entire queue need not be restarted manually. Each job also uploads a report in its **Artifacts** section. The queue is fixed per version, so sites are not reassigned when the workflow is resumed.

**Zero credits:** No paid AI endpoint or metered plugin is used. The software is open source and GitHub currently provides free standard hosted runners for public repositories, although provider policies and listing fees can change.

## Important SEO limitations

Large-scale directory submissions on low-quality websites can be counterproductive for search performance. The candidate queue includes websites that may be irrelevant, stale, require paid upgrades, or disallow submissions. The tool screens these and records why it skipped them.

For actual SEO reporting, check that a published page exists, that it contains a visible link to https://toppsarena.com and that the referring site is relevant. Avoid claims of verified dofollow links until that has been checked.

## Files

- `campaign/candidates.json` — 250 deduplicated potential targets, marked as unverified
- `scripts/campaign.mjs` — browser-based screening, form-filling and status tracker
- `.github/workflows/toppsarena-backlinks.yml` — one-click 5-shard GitHub Actions workflow
- `state/shard-*.json` — persistent results written only after live screening
