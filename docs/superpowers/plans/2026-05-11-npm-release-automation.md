# npm Release Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare `@teelicht/pi-grepai` for `v0.0.1` release to public npmjs.com with a GitHub Release created from the matching tag.

**Architecture:** Keep npmjs.com as the only package registry, driven by a tag-triggered GitHub Actions workflow. Package metadata, docs, changelog, and tests should all agree that GitHub Packages is not used.

**Tech Stack:** TypeScript package metadata, npm publishing, GitHub Actions, Node test runner.

---

### Task 1: Align package metadata for npmjs.com

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Delete: `.npmrc`
- Test: `test/unit/package-manifest.test.ts`

- [ ] Set root package version to `0.0.1` in `package.json`.
- [ ] Set `publishConfig` to `{ "access": "public" }` with no `registry` key.
- [ ] Update `package-lock.json` root package version to `0.0.1`.
- [ ] Remove `.npmrc` so the `@teelicht` scope is not routed to GitHub Packages.
- [ ] Update `test/unit/package-manifest.test.ts` to assert public npm access and no registry override.
- [ ] Run `npm run test:unit -- test/unit/package-manifest.test.ts` and verify it passes.

### Task 2: Add release workflow

**Files:**
- Create: `.github/workflows/release.yml`

- [ ] Create a workflow triggered by tags matching `v*`.
- [ ] Give workflow `contents: write` for GitHub Release creation.
- [ ] Use Node 24, `npm ci`, and `npm run qa` before publishing.
- [ ] Configure npm auth for `registry-url: https://registry.npmjs.org`.
- [ ] Publish with `npm publish --access public` using `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`.
- [ ] Create GitHub Release with `gh release create "$GITHUB_REF_NAME" --notes-file` using release notes extracted from `CHANGELOG.md`.

### Task 3: Update release docs and changelog

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `docs/releases.md`
- Modify: `README.md`
- Test: `test/unit/docs.test.ts`

- [ ] Add a `## v0.0.1 - 2026-05-11` changelog entry summarizing initial release.
- [ ] Update `docs/releases.md` to document npmjs.com-only publishing with `NPM_TOKEN`.
- [ ] Update `README.md` install instructions to use `pi install npm:@teelicht/pi-grepai` without GitHub Packages setup.
- [ ] Update `test/unit/docs.test.ts` to assert npmjs.com release docs and no GitHub Packages configuration.
- [ ] Run `npm run test:unit -- test/unit/docs.test.ts` and verify it passes.

### Task 4: Verify, commit, and tag

**Files:**
- All modified release files

- [ ] Run `npm run qa` and verify all checks pass.
- [ ] Run `git status --short --branch` to verify the intended files are staged/modified.
- [ ] Commit with message `chore: prepare v0.0.1 release`.
- [ ] Create annotated tag `v0.0.1` with message `v0.0.1`.
- [ ] Verify final state with `git status --short --branch`, `git tag --list v0.0.1`, and `git log --oneline --decorate -3`.
