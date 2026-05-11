# @teelicht/pi-grepai Design

Date: 2026-05-05
Status: Draft for review

## Summary

`@teelicht/pi-grepai` is a standalone MIT-licensed Pi package that integrates an already-installed `grepai` CLI with Pi. It provides Pi-native slash commands, Pi-native LLM tools, and lightweight status visibility while keeping grepai itself as the source of truth for installation, provider configuration, indexing behavior, output schemas, and deeper agent guidance.

The package is intentionally a thin CLI bridge. It does not install grepai, install official grepai skills, use MCP, normalize grepai output, or manage project-specific configuration beyond detecting whether the current project is initialized.

## Goals

- Create a standalone Pi package named `@teelicht/pi-grepai`.
- Keep all implementation code in the current repository.
- Prepare the project for an MIT-licensed GitHub repository and npm distribution.
- Follow the TypeScript, Biome, TypeScript strictness, documentation, and test structure used by `/Users/thomas/Documents/Dev/pi-superagents`.
- Expose grepai-native slash commands:
  - `/grepai-init`
  - `/grepai-watch`
  - `/grepai-status`
  - `/grepai-stop`
- Expose LLM-facing grepai tools that mirror the useful grepai MCP tool names, implemented through direct CLI calls.
- Activate all LLM-facing grepai tools only for projects that contain `.grepai/config.yaml`.
- Auto-start `grepai watch --background` on Pi session start only when the current project is already initialized.
- Show simple ongoing grepai status in Pi and provide a read-only `/grepai-status` detail view.

## Non-goals

- Installing grepai.
- Installing the official `yoanbernabeu/grepai-skills` package.
- Configuring embedding providers or storage backends outside grepai's own `grepai init` flow.
- Replacing or duplicating grepai's official skills and documentation.
- Calling grepai through MCP.
- Normalizing or rewriting grepai output schemas.
- Supporting grepai workspaces in v1.
- Supporting project-specific extension config overrides in v1.
- Embedding grepai's interactive UI inside Pi in v1.

## Package and Repository Structure

The repository will become a TypeScript ESM Pi package modeled after `pi-superagents`.

```text
.
├── AGENTS.md
├── README.md
├── LICENSE
├── package.json
├── default-config.json
├── config.example.json
├── biome.json
├── tsconfig.json
├── src/
│   ├── extension/
│   │   ├── index.ts
│   │   └── config-store.ts
│   ├── grepai/
│   │   ├── cli.ts
│   │   ├── project-root.ts
│   │   ├── tool-activation.ts
│   │   ├── tools.ts
│   │   └── commands.ts
│   └── ui/
│       └── status.ts
├── test/
│   ├── unit/
│   └── integration/
└── docs/
    ├── configuration.md
    ├── commands.md
    ├── tools.md
    ├── releases.md
    └── superpowers/
        └── specs/
```

Package metadata will include:

```json
{
  "name": "@teelicht/pi-grepai",
  "type": "module",
  "license": "MIT",
  "pi": {
    "extensions": ["./src/extension/index.ts"]
  }
}
```

The implementation will use TypeScript, Biome, strict TypeScript checking, and automated tests. Source files and non-trivial functions will include concise documentation headers/doc comments consistent with the reference project.

## Project Scope Detection

For every session, command, and tool call, the extension resolves a project root:

1. Run `git rev-parse --show-toplevel` from Pi's `ctx.cwd`.
2. If that fails, use Pi's `ctx.cwd`.

A project is considered grepai-initialized when this file exists:

```text
<projectRoot>/.grepai/config.yaml
```

No monorepo sub-scope override and no grepai workspace support are included in v1. The documentation will explicitly call this out.

## Session Startup Behavior

On Pi `session_start`:

1. Resolve the project root.
2. Check for `<projectRoot>/.grepai/config.yaml`.
3. If missing:
   - Keep all LLM-facing grepai tools inactive.
   - Do not start grepai.
   - Avoid noisy startup warnings.
4. If present:
   - Activate all LLM-facing grepai tools for the current session.
   - If `grepai.autoStart` is enabled, run `grepai watch --status`.
   - If the watcher is not running, run `grepai watch --background`.
   - Update Pi status/footer with the best available watcher/index state.

The extension does not continuously watch the filesystem for `.grepai/config.yaml`. Tool activation is checked on session start, and `/grepai-init` can activate tools immediately after a successful initialization.

## Slash Commands

### `/grepai-init`

Runs direct `grepai init` in the detected project root. The extension does not install grepai and does not replace grepai's provider/storage setup flow.

On success, the extension activates all LLM-facing grepai tools immediately for the current session.

### `/grepai-watch`

Starts the grepai watcher for the detected project root using:

```bash
grepai watch --background
```

The command first checks that `.grepai/config.yaml` exists. If the project is not initialized, it does not start anything and shows a clear message telling the user to run `/grepai-init` first.

### `/grepai-status`

Shows a Pi-native read-only status detail view. It may use:

```bash
grepai watch --status
grepai status --no-ui
```

The view should include project root, initialization state, watcher state, and grepai status output. It must not embed grepai's interactive UI in v1.

### `/grepai-stop`

Stops the background watcher with:

```bash
grepai watch --stop
```

Then it refreshes the Pi status/footer state.

## LLM Tool Surface

The extension registers grepai-native LLM tools once, but only activates them for initialized projects.

v1 tools:

- `grepai_search`
- `grepai_trace_callers`
- `grepai_trace_callees`
- `grepai_trace_graph`
- `grepai_refs_readers`
- `grepai_refs_writers`
- `grepai_refs_graph`
- `grepai_index_status`
- `grepai_rpg_search`
- `grepai_rpg_fetch`
- `grepai_rpg_explore`

Execution rules:

- Run every command in the detected project root.
- Prefer grepai's structured compact output flags where available, especially `--json --compact` for semantic search.
- Pass grepai stdout/stderr through directly to the LLM tool result.
- Do not normalize or rewrite grepai output schemas.
- Do not inject extra system-prompt guidance beyond tool descriptions.
- If grepai is missing or a command fails, return concise command failure output.

The official grepai skills remain the recommended way to teach agents detailed grepai usage patterns.

## Configuration

The package will provide bundled defaults and a documented user config file.

Files:

```text
default-config.json
config.example.json
~/.pi/agent/extensions/pi-grepai/config.json
```

Initial config shape:

```json
{
  "grepai": {
    "autoStart": true,
    "output": {
      "format": "json",
      "compact": true
    },
    "commands": {
      "timeoutMs": 30000
    }
  }
}
```

Only global config is supported in v1. There are no per-project overrides.

## Status UI

The extension will provide:

- A simple ongoing Pi status/footer indicator for grepai state.
- A read-only `/grepai-status` detail view.

The status UI should follow implementation patterns from `/Users/thomas/Documents/Dev/pi-superagents` where appropriate. The exact display can be refined during implementation, but it must clearly distinguish at least:

- not initialized
- initialized but watcher stopped/unknown
- watcher running
- command error / grepai missing

## Documentation

Documentation will include:

- `README.md`: install, quick start, assumptions, commands, tools, and links.
- `docs/configuration.md`: config path and options.
- `docs/commands.md`: slash command behavior.
- `docs/tools.md`: LLM tool list and CLI mapping.
- `docs/releases.md`: manual GitHub and npm release steps.

Docs will link to:

- grepai installation docs
- grepai quickstart
- grepai search guide
- grepai trace docs
- official grepai skills

GitHub repository creation and npm publishing are documented manual release steps, not automated implementation requirements.

## Testing Strategy

Automated tests will cover:

- config load and merge behavior
- project root detection with Git root fallback to `ctx.cwd`
- initialization detection through `.grepai/config.yaml`
- command construction for slash commands and LLM tools
- tool activation/inactivation based on initialization state
- `/grepai-init` activating tools after success
- `/grepai-watch` refusing to start when uninitialized
- auto-start only running for initialized projects
- status rendering without embedding grepai's interactive UI
- timeout and command error handling

## Open v1 Decisions

No unresolved product decisions remain for v1. Implementation may choose internal helper boundaries and exact status rendering details as long as the behavior above is preserved.
