# TopPSArena — Verified Free Backlinks

Website: **https://toppsarena.com**

**The old 250/519-site bulk submission workflow is retired.** The old candidate archives and their state records remain in this repository for audit, but they are **not** inputs to the active workflow.

## Active automation

[Open the verified-backlink GitHub Actions workflow](https://github.com/fazegrimmy/toppsarena-backlinks/actions/workflows/toppsarena-backlinks.yml)

The workflow checks and, where needed, submits the site only to **explicitly documented, no-cost directory APIs that welcome automated submissions**. It runs automatically after changes to its workflow or script and **twice daily by schedule** (GitHub schedule timing can vary). Manual **submit** and **verify** modes are also available. An existing hourly ChatGPT automation independently checks reported results for new *published* backlinks.

Currently approved publishers:

- **DevElif** — [public API docs](https://develif.com/docs), free, no account, includes **Gaming** category and advertises followed links. Initial API response was **HTTP 409 already listed**, so a new submission was not made and the pre-existing listing's public URL has not yet been verified.
- **CurlShip** — [public OpenAPI](https://curlship.com/openapi.json), free with a **nofollow** link. The API explicitly accepts bots. Initial HTTP 201 submission resulted in [a verified public TopPSArena listing](https://curlship.com/l/11593) with a direct link to the site.

**A green GitHub workflow, HTTP 201, redirect, or 'submitted' message is not a verified backlink.** A public listing must be retrievable and contain an HTML anchor directly linking to `toppsarena.com`. `nofollow`, `ugc`, and followed status are recorded distinctly. No one claims a ranking benefit based solely on presence of a link.

## Reports and evidence

- `state/reliable-campaign.json`: API response status, publication evidence, timestamp, link relationship, and known-link rechecks.
- `reports/verified-backlinks.md`: human-readable table of actual publicly verified backlink pages, not submission URLs.
- `campaign/verified-opportunities.json`: reviewed sites with API documentation and free/automation permission.
- `scripts/verified-campaign.mjs`: checked-in Node.js implementation using native HTTP and strict backlink verification.

The runner posts to each preapproved publisher **at most once after a definite HTTP response**, so scheduled checks do not create duplicate submissions. It never uses paid listings, bypasses CAPTCHAs, or opens accounts. It stores reports in GitHub and uploads workflow artifacts.

## Previous campaign

Earlier runs attempted generic directories from `campaign/candidates.json` and checked a 519-site research database. A site being listed in the research database is **not** evidence it is relevant, free, or able to accept a form submission. These are retained as historical research only; the active workflow does not read them.

For new publishers, require public evidence that the destination supports legitimate free submissions for a private gaming-server directory and explicitly permits the proposed submission method. Add a narrowly reviewed adapter—never blindly resume bulk submissions.
