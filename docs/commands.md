# Commands

## `/grepai-watch`

Starts `grepai watch --background` for the detected project. Automatically refuses if the project is not initialized (no `.grepai/config.yaml` found).

**Requires:** Run `grepai init` manually in the project root first.

## `/grepai-status`

Shows a read-only status report including project root, initialization state, watcher state, and grepai status output.

## `/grepai-stop`

Stops the background watcher by running `grepai watch --stop`.

## Project Root Detection

The extension resolves the project root in this order:

1. Git top-level directory (via `git rev-parse --show-toplevel`)
2. Falls back to the current working directory if not inside a git repo

A project is considered initialized when `.grepai/config.yaml` exists in the detected project root.

## v1 Limitations

- **No workspace support:** Commands operate on a single project root; multi-workspace scenarios are not yet supported.
- **No interactive init support:** `grepai init` is interactive in many configurations, so initialize projects from a terminal instead of through Pi.
- **No config sync:** User configuration is not automatically synchronized with grepai's own config files.
