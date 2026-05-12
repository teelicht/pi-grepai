# GrepAI Tool Metadata and Schema Design

Date: 2026-05-11

## Purpose

Improve `pi-grepai` LLM tool metadata so models call the right GrepAI-backed tool with the right arguments, without duplicating the long-form GrepAI skills or changing this package's role as a thin bridge to the installed `grepai` CLI.

## Context

`pi-grepai` currently registers eleven `grepai_*` tools through a shared all-optional parameter schema:

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

The tool descriptions are concise, but the shared schema makes required fields unclear. For example, trace and refs tools require `symbol`, search tools require `query`, and RPG fetch requires a node identifier. Passing an empty string through to the CLI produces less helpful errors and gives the model weaker tool-call affordances.

Reference checks found:

- Pi built-in tools use concise tool descriptions plus precise parameter-level descriptions.
- `pi-hashline-readmap` keeps tool descriptions and prompt snippets compact, while using richer schemas and separate prompt material where needed.
- Installed GrepAI skills in `/Users/thomas/Documents/Dev/pi-superagents/.agents/skills` already provide long-form examples, search strategy, trace strategy, output-format explanation, and troubleshooting.
- Official GrepAI docs confirm the current eleven-tool surface:
  - `/mcp/` documents search, trace, status, and workspace-oriented tools.
  - `/commands/grepai_mcp-serve/` documents search, trace, refs, status, and RPG MCP tools.
  - `/trace/` documents `grepai refs readers|writers|graph` for property/state usage.

## Design Goals

1. Preserve `pi-grepai` as a thin CLI bridge.
2. Keep all eleven existing `grepai_*` tools because they match the fuller official GrepAI MCP server surface.
3. Replace the shared all-optional schema with per-tool schemas that express required inputs and useful CLI-backed optional inputs.
4. Keep descriptions and prompt snippets short to avoid duplicating installed GrepAI skills.
5. Pass through raw CLI stdout/stderr; do not normalize GrepAI output schemas.
6. Let installed CLI version differences surface as CLI output/errors rather than hiding them behind version-specific logic.

## Non-Goals

- Do not install GrepAI.
- Do not call GrepAI through MCP.
- Do not parse or normalize GrepAI JSON, TOON, or text output.
- Do not embed GrepAI tutorials, examples, or troubleshooting content in tool metadata.
- Do not add generated prompt markdown files in this pass.
- Do not remove `refs_*` or `rpg_*` tools solely because one locally installed GrepAI version may not expose the matching CLI commands.

## Tool Surface

The implementation should retain the current tool names and align schemas with official GrepAI CLI/MCP concepts.

| Tool | Required Params | Optional Params | CLI Intent |
|---|---:|---|---|
| `grepai_search` | `query` | `limit`, `compact`, `format` | `grepai search <query>` |
| `grepai_trace_callers` | `symbol` | `workspace`, `project`, `compact`, `format` | `grepai trace callers <symbol>` |
| `grepai_trace_callees` | `symbol` | `workspace`, `project`, `compact`, `format` | `grepai trace callees <symbol>` |
| `grepai_trace_graph` | `symbol` | `workspace`, `project`, `depth`, `format` | `grepai trace graph <symbol>` |
| `grepai_refs_readers` | `symbol` | `workspace`, `project`, `format` | `grepai refs readers <symbol>` |
| `grepai_refs_writers` | `symbol` | `workspace`, `project`, `format` | `grepai refs writers <symbol>` |
| `grepai_refs_graph` | `symbol` | `workspace`, `project`, `format` | `grepai refs graph <symbol>` |
| `grepai_index_status` | none | `verbose`, `workspace`, `format` | `grepai status`; use `grepai workspace status <workspace>` only if implementation confirms that is the correct local CLI mapping |
| `grepai_rpg_search` | `query` | `limit`, `format` | `grepai rpg search <query>` |
| `grepai_rpg_fetch` | `id` | `format` | `grepai rpg fetch <id>` |
| `grepai_rpg_explore` | `id` | `direction`, `depth`, `format` | `grepai rpg explore <id>` |

`format` should be a narrow enum matching GrepAI output flags where supported: `"json"`, `"toon"`, or `"text"`. The bridge should translate these to CLI flags rather than post-processing output:

- `"json"` -> `--json`
- `"toon"` -> `--toon`
- `"text"` or omitted -> no format flag

`compact: true` should add `--compact` only on tools whose official docs expose compact output. `limit` and `depth` should be numeric options that translate to `--limit` and `--depth`.

If `project` is supplied without `workspace`, the CLI may reject it. The preferred first implementation is to pass arguments through consistently and rely on the CLI for semantic validation rather than creating package-specific validation behavior.

The existing `grepai_search` mapping currently forces `--json --compact`. This spec changes that behavior: output flags should be controlled by `format` and `compact` parameters, with no output-format flag when those parameters are omitted.

## Metadata Strategy

Use short descriptions that identify capability, not workflow. Examples:

- `grepai_search`: `Semantic code search by intent.`
- `grepai_trace_callers`: `Find functions that call a symbol.`
- `grepai_refs_readers`: `Find property or state readers for a symbol.`
- `grepai_rpg_fetch`: `Fetch context for a GrepAI RPG node.`

Prompt snippets should be one sentence and should not repeat every parameter. They may include compact tool-selection cues, for example:

- Search: `Use when you need relevant code but do not know exact symbols.`
- Trace: `Use for function/method call relationships once you know a symbol.`
- Refs: `Use for property, field, or state read/write usage rather than function calls.`
- RPG: `Use for Repository Purpose Graph exploration when GrepAI RPG is enabled.`
- Status: `Use when results look stale or GrepAI indexing may be unavailable.`

Long-form guidance belongs in the installed GrepAI skills. The spec intentionally avoids copying examples or tutorials from those skills into tool metadata.

## Architecture

Refactor `src/grepai/tools.ts` around a typed metadata table:

```ts
type GrepaiToolSpec = {
  name: GrepaiToolName;
  description: string;
  promptSnippet: string;
  parameters: unknown; // the concrete TypeBox schema type accepted by Pi ToolDefinition
  buildArgs(params: unknown): string[];
};
```

The exact TypeScript shape can vary to satisfy `ToolDefinition` generics, but the code should have one source of truth per tool for:

- description
- prompt snippet
- parameter schema
- CLI argument construction

The public `buildGrepaiArgs(name, params)` helper may remain for tests and callers. It should dispatch through the same metadata table rather than a separate switch when practical, so schemas and argument mappings do not drift.

The implementation must continue to:

- use TypeScript ESM with explicit `.ts` imports
- call `runGrepai` with the resolved project root
- return `formatCommandResult(result)` as text content
- include `projectRoot` and raw `result` details
- avoid MCP calls and schema normalization

## Data Flow

1. Pi registers all `grepai_*` tool definitions on extension startup.
2. Tool activation remains controlled by existing project initialization detection.
3. When a model calls a tool, Pi validates the tool-specific schema before execution.
4. The tool builds CLI arguments from validated params.
5. `runGrepai` executes the installed `grepai` binary in the resolved project root.
6. `pi-grepai` returns raw formatted stdout/stderr text and raw details.

## Error Handling

- Missing required fields should be caught by Pi schema validation before CLI execution.
- Invalid CLI combinations, unsupported commands, unsupported flags, or version mismatches should surface as GrepAI CLI output/errors.
- No compatibility shim should hide whether the installed GrepAI version supports `refs`, `rpg`, `toon`, `workspace`, or other flags.
- Existing process errors from `runGrepai` should continue to be formatted by `formatCommandResult`.

## Documentation

Update `docs/tools.md` to list:

- the eleven tools
- required and optional parameters at a high level
- the raw stdout/stderr pass-through rule
- a short note that long-form search/trace guidance lives in GrepAI skills and official GrepAI docs
- a short note that this package mirrors the documented GrepAI MCP/CLI surface but executes the local installed CLI, so available flags may depend on the installed GrepAI version

Update `README.md` only if the tool list or positioning needs to stay consistent with `docs/tools.md`.

## Testing

Update or add unit tests to verify:

1. `createGrepaiTools` still returns one definition per `GREPAI_TOOL_NAMES` entry.
2. Each tool has a concise description and non-empty prompt snippet.
3. The parameter schemas are not all the same shared all-optional object.
4. Required fields are represented in schemas for search, trace, refs, and RPG fetch/explore tools.
5. `buildGrepaiArgs` maps every tool to expected CLI args, including optional params:
   - search `limit`, `compact`, `format`
   - trace `workspace`, `project`, `compact`, `format`
   - graph `depth`
   - refs `workspace`, `project`, `format`
   - RPG `depth` or other selected options
6. Docs mention the official MCP/CLI-aligned surface and raw pass-through behavior.

Run `npm run qa` before claiming implementation complete.

## Open Compatibility Note

The local installed GrepAI binary may lag the official documentation. During discovery, one local `grepai` version did not expose `refs` or `rpg` commands, while official docs list them. The implementation should not remove these tools based on local availability. Instead, it should keep the documented tool surface and allow the installed CLI to report unsupported commands or flags.

## Acceptance Criteria

- The eleven existing `grepai_*` tool names remain registered.
- Tool parameter schemas are specific enough for Pi/model validation to require the right primary argument.
- Tool metadata is concise and avoids duplicating installed GrepAI skills.
- CLI argument mapping supports documented core options without normalizing output.
- Documentation explains the thin CLI bridge and version-dependent CLI support.
- `npm run qa` passes after implementation.
