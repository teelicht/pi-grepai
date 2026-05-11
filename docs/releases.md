# Release Process

This document describes the steps to release a new version of `@teelicht/pi-grepai`.

## Prerequisites

1. Ensure the GitHub repository exists at `github.com/teelicht/pi-grepai`.
2. Ensure you have publish access to the npm package `@teelicht/pi-grepai`.

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

### 2. Update Version

Update the version in `package.json` following semantic versioning:

```bash
npm version patch  # for patch releases (bug fixes)
npm version minor  # for minor releases (new features)
npm version major  # for major releases (breaking changes)
```

### 3. Create GitHub Release

1. Push the version commit and tag to GitHub.
2. Create a GitHub release with the new version tag.
3. Add release notes describing changes.

### 4. Publish to npm

```bash
npm publish
```

For scoped packages, use:

```bash
npm publish --access public
```

### 5. Verify Installation

After publishing, verify the package installs correctly:

```bash
pi install npm:@teelicht/pi-grepai
```