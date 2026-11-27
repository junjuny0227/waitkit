# Releasing

All publishable packages (`@waitkit/core`, `react`, `msw`, `cli`) share one version through the
changesets `fixed` group in `.changeset/config.json`. A release is one `v<version>` tag, one
GitHub release, and one npm publish of every package.

```text
version PR merged → push tag v1.2.3 → release.yml: version check, quality gate, draft release
→ maintainer edits Highlights and clicks Publish → publish.yml: npm publish over OIDC
```

npm publishing happens only after a person publishes the draft. A published npm version cannot
be reused, so the draft is the review point.

## One-time setup

Done by the maintainer, not by agents or workflows.

1. GitHub: **Settings → Environments → New environment** named `npm`. Optionally restrict it to
   tags matching `v*`.
2. npmjs.com, for each of the four packages: **Settings → Trusted publishing → GitHub
   Actions** with organization or user `junjuny0227`, repository `waitkit`, workflow filename
   `publish.yml`, environment `npm`. The packages already exist on npm, which trusted
   publishing requires. A new package must be published once by hand before it can be added.
3. After the first successful OIDC publish, set each package's **Publishing access** to require
   2FA and disallow tokens, so only the workflow can publish.

## Every release

1. **Version PR.** On a `release/v<version>` branch, run `pnpm changeset:version`. It applies the
   pending changesets, bumps every package to the same version, and writes the changelogs.
   Open the PR and merge it once CI passes.
2. **Tag.** On an up-to-date `main`:

   ```sh
   pnpm release:check v1.2.3   # every package must already be at 1.2.3
   git tag v1.2.3
   git push origin v1.2.3
   ```

   A tag with a prerelease suffix (`v1.3.0-beta.1`) creates a prerelease and publishes under
   the `next` dist-tag.

3. **Draft.** The **Draft release** workflow checks the versions, runs the same gate as CI, and
   creates a draft named `Waitkit <version>`. The body is `.github/release-notes.md` followed
   by GitHub's generated list of PRs since the previous tag, grouped by label
   (`.github/release.yml`; labels come from the branch prefix via `.github/labeler.yml`).
4. **Highlights.** Add a `## Highlights` section at the top of the draft in English: a bold
   first sentence per item, then a short explanation (same format as Doorplate and Repot).
5. **Publish.** Click **Publish release**. The **Publish to npm** workflow builds the tag and
   runs `pnpm publish` for every package with provenance. Check the run, then
   `npm view @waitkit/core@<version> dist.attestations`.

If publishing fails partway, re-run the failed job: versions already on npm are skipped.
