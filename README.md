# TopPSArena: free directory submissions

This is the **preview-first** GitHub Actions workflow for https://toppsarena.com.

**Android:** Open [Actions](https://github.com/fazegrimmy/toppsarena-backlinks/actions), select **TopPSArena - Free directory submission**, then **Run workflow** with `mode = preview`. This shows the four candidate directories without posting anything.

After reviewing each site's current submission rules, you can run again with `mode = submit`, `confirmation = SUBMIT`, and a public contact email. Live mode attempts a maximum of three forms per run. No paid AI API, backlinks subscription or usage credits are configured.

### Limits
- Directory listings are subject to approval; form submission is not proof of a published backlink.
- Some directory sites require a login, have CAPTCHAs, block automation or charge a fee. This workflow does not circumvent those checks.
- The shortlist comes from a third-party open-source database; these listings have **not** been separately validated as accepting TopPSArena.
- GitHub standard runners are currently free for public repos, but third-party and GitHub policies can change.
- A GitHub Actions runner is ephemeral: download the logs/artifacts and avoid duplicate repeat submissions.
- The repository is public. Never put passwords, API keys or private contact information in inputs or files.

The tool uses [BacklinkFlow](https://github.com/imsankz/backlinkflow) at a pinned source revision with template-based listing descriptions.
