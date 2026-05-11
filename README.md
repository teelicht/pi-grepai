# @teelicht/pi-grepai

Pi package that bridges an already-installed `grepai` CLI into Pi slash commands and LLM tools.

This package does not install grepai, does not install official grepai skills and does not use MCP. It adds the following tools to Pi:

- `/grepai-watch` slash command
- `/grepai-status` slash command
- `grepai_search` LLM tool
- `grepai_trace_callers` LLM tool
- `grepai_trace_callees` LLM tool
- `grepai_trace_graph` LLM tool
- `grepai_refs_readers` LLM tool
- `grepai_refs_writers` LLM tool
- `grepai_refs_graph` LLM tool
- `grepai_index_status` LLM tool
- `grepai_rpg_search` LLM tool
- `grepai_rpg_fetch` LLM tool
- `grepai_rpg_explore` LLM tool

## Install

1. Install and configure grepai from the official [grepai docs](https://yoanbernabeu.github.io/grepai/getting-started/).
2. Install this Pi package from npm with `pi install npm:@teelicht/pi-grepai`, or use `pi install /path/to/pi-grepai` during local development.
3. Optionally, install all or selected grepai skills
4. Run `grepai init` in the project root.


## Quick start

Run `grepai init` in your terminal to initialize a project. After that, use `/grepai-watch`, `/grepai-status`, and grepai LLM tools such as `grepai_search`.

See `docs/configuration.md`, `docs/commands.md`, `docs/tools.md`, and `docs/releases.md`.