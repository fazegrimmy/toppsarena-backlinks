# TopPSArena — Parallel backlink research

**Research date:** 23 November 2026  
**Website:** https://toppsarena.com  
**Scope:** Real gaming/website directories that can list TopPSArena itself, not directories exclusively for individual game servers. Links are **not counted** until an independent public page displays a genuine direct hyperlink.

## Strongest verified opportunities

| Priority | Destination | Suitable for TopPSArena? | Free? | How to submit | Current status |
|---|---|---|---|---|---|
| 1 | [PostLaunchKit](https://postlaunchkit.com/for-agents) | Games and web products | Yes | [POST /api/v1/submit](https://postlaunchkit.com/openapi.json), no key; category `games`; queue, human review | Documented API, **not yet submitted** |
| 2 | [XtremeTop100 Gaming Websites](https://www.xtremetop100.com/add) | Explicitly accepts gaming websites | Yes | Registration form with email/password, select Gaming Websites | Already in research queue; account needed |
| 3 | [GameNav](https://game-nav.com/submit) | Gaming resources and tools | Yes | Owner signs in, provides screenshot, selects $0 Free tier; review 5–7 business days | Documented free path, login required |
| 4 | [AZN8](https://azn8.com/docs/agents) | General startup / product listing | Yes | Agent register + key, then API POST; choose `other` if appropriate | API documented, account required |
| 5 | [Foundry79](https://sharaco.xyz/add.php) | General website, Gaming desk | Yes | Free web form, editorial review | **Low priority:** site advertises a 500+ directory network |

### Best automation opportunity: PostLaunchKit

- **First-party instructions:** https://postlaunchkit.com/for-agents
- **OpenAPI:** https://postlaunchkit.com/openapi.json
- **Published search preflight:** https://postlaunchkit.com/api/v1/projects?q=toppsarena returned **zero published results** at review time, but cannot rule out an existing pending submission.
- **Free API endpoint:** `POST https://postlaunchkit.com/api/v1/submit`. Required: `name`, `url`, `one_liner`, `why_try`, `category`.
- **Suggested category:** `games`, verified from https://postlaunchkit.com/api/v1/categories .
- **Expected result:** HTTP 202 means **pending review**, *not* a published link. Save submission ID if authorized; track review with `GET /api/v1/submissions/{id}`. After approval, independently fetch its public `page_url` and verify the anchor points to `toppsarena.com`.
- **Link type:** Free listings default to `rel="ugc nofollow"`. A reciprocal badge for followed links is optional and **not required**, and should not be installed automatically.
- **Ready for integration:** yes, but the live campaign has **not** been changed to auto-submit to it.

### Worth reviewing but not auto-submitting

- [GameNav](https://game-nav.com/submit): signed-in free submission and real screenshot; a promising gaming-relevant listing.
- [AZN8](https://azn8.com/docs/agents): API registration and account credentials required; provider says public listing links are followed; verify independently.
- [Foundry79](https://sharaco.xyz/add.php): first-party form says free; network mass-listing promotion raises quality concerns. Avoid the advertised 500+ link network.

### Useful sources of **new opportunities** (read-only data)

| Dataset | What it provides |
|---|---|
| [SubmitMyStartup](https://submitmystartup.com/api) | 1,097 directory/launch/community opportunities, with actual attempts and documented free path obstacles; updated Nov 20 2026 |
| [r88z](https://r88z.com/agents) | 572 startup directory leads and structured eligibility fields, sourced from AZN8 |
| [PostLaunchKit directory dataset](https://postlaunchkit.com/launch-directories/) | 7 checked options plus research-only options with cited restrictions |

These datasets are discovery aids. Their counts do not mean that many are suitable for a gaming toplist, that submissions are authorized, or that backlinks are published.

### Excluded or already handled

- [Zearches](https://www.zearches.com/submit-website-free.php): TopPSArena already has a verified published listing in current campaign state; do not duplicate.
- [Warp Point](https://www.warppoint.games/submit): gaming **writing/blog** directory, requires an RSS feed and an 88×31 badge and explicitly rejects AI-generated sites; TopPSArena is not a fit.
- [Gamhub](https://gamhub.net/website_submit): explicitly says don't submit non-game websites.
- [JagTopList](https://jagtoplist.com/add): submissions closed.
- [DirectoryOfGames](https://www.directoryofgames.com/main.php?view=directories): search snippet outdated; its domain currently resolves to a **for-sale landing page**, so exclude.
- Private-game-server listing sites without a gaming *website* category: TopPSArena is a **directory**, not an individual server; do not miscategorize.

### Honest result

Research opportunities newly documented: **5 additional qualified-research entries**.   
**Actual external submissions in this research pass: 0. New published backlinks: 0.**  
The live automated submission allowlist remains unchanged pending code integration and evidence verification.
