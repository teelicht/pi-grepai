# Release Process

This document describes the steps to release `@teelicht/pi-grepai` to the public npm registry and create a matching GitHub Release.

## Prerequisites

1. Ensure the GitHub repository exists at `github.com/teelicht/pi-grepai`.
2. Ensure you have publish access to the public npm package `@teelicht/pi-grepai` on npmjs.com.
3. Add an npm automation token as the repository secret `NPM_TOKEN`.
4. Ensure `package.json` keeps `publishConfig.access` set to `public` and does not set a custom registry.

## Release Steps

### 1. Verify QA

Run the full quality assurance checks before any release:

```bash
npm run qa
```

This runs:

- Biome formatting and linting
- TypeScript type checking
- Unit tests
- Integration tests

Fix any failures before proceeding.

### 2. Update Version and Changelog

Update `package.json`, `package-lock.json`, and `CHANGELOG.md` for the release version.

For the first release, the package version and changelog entry are `0.0.1` / `v0.0.1`.

For later releases, use semantic versioning:

```bash
npm version patch --no-git-tag-version  # for patch releases
npm version minor --no-git-tag-version  # for minor releases
npm version major --no-git-tag-version  # for major releases
```

Then add a matching `CHANGELOG.md` section whose heading starts with the tag name, for example:

```markdown
## v0.0.2 - 2026-06-01
```

### 3. Commit and Tag

Commit the release changes and create an annotated tag:

```bash
git add package.json package-lock.json CHANGELOG.md docs/releases.md
git commit -m "chore: prepare v0.0.1 release"
git tag -a v0.0.1 -m "v0.0.1"
```

### 4. Push the Release

Push the commit and tag:

```bash
git push origin main
git push origin v0.0.1
```

Pushing the tag triggers `.github/workflows/release.yml`.

### 5. Publish and GitHub Release Automation

The release workflow:

1. Checks out the repository.
2. Installs dependencies with `npm ci`.
3. Runs `npm run qa`.
4. Publishes to npmjs.com with:

```bash
npm publish --access public --provenance
```

5. Extracts the matching `CHANGELOG.md` section.
6. Creates a GitHub Release for the pushed tag.

### 6. Verify Installation

After the workflow succeeds, verify the npm package is visible and installable:

```bash
npm view @teelicht/pi-grepai --registry=https://registry.npmjs.org
pi install npm:@teelicht/pi-grepai
```
