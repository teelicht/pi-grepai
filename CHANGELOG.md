# Changelog

## v0.1.0 - 2026-05-11

- Update Pi dependencies to @earendil-works/* v0.74.0
- Adds per-tool schemas for GrepAI LLM tools so required parameters are clearer to models.
- Aligns tool metadata and CLI argument mapping with the documented GrepAI MCP/CLI surface, including optional `format`, `compact`, `workspace`, `project`, `limit`, and `depth` flags where applicable.
- Updates integration test execution to use Node's `--experimental-strip-types` flag consistently.

## v0.0.1 - 2026-05-11

Initial release of `@teelicht/pi-grepai`.

- Adds a Pi extension that bridges an existing `grepai` CLI installation into Pi.
- Provides `/grepai-watch` and `/grepai-status` slash commands.
- Provides GrepAI-backed LLM tools for semantic search, call tracing, refs, index status, and RPG queries.
- Documents installation, configuration, commands, tools, and release process.
