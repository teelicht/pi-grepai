# @teelicht/pi-grepai

Pi package that bridges an already-installed `grepai` CLI into Pi slash commands and LLM tools.

## Install

1. Install and configure grepai from the official grepai docs.
2. Install this Pi package with `pi install npm:@teelicht/pi-grepai` or `pi install /path/to/pi-grepai` during local development.

This package does not install grepai, does not install official grepai skills, does not use MCP, and does not normalize grepai output schemas.

## Quick start

Use `/grepai-init` in Pi to initialize a project. It runs `grepai init` in the detected root. After that, use `/grepai-watch`, `/grepai-status`, and grepai LLM tools such as `grepai_search`.

See `docs/configuration.md`, `docs/commands.md`, `docs/tools.md`, and `docs/releases.md`.