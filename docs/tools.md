# LLM Tools

The extension registers GrepAI LLM tools that call the installed `grepai` CLI from the detected project root. The tools mirror the CLI-backed GrepAI tool surface, but this package does not run GrepAI through MCP and does not normalize GrepAI output.

## Tool List

| Tool Name | Required Params | Optional Params | Description |
|-----------|-----------------|-----------------|-------------|
| `grepai_search` | `query` | `limit`, `compact`, `format` | Semantic code search by intent |
| `grepai_trace_callers` | `symbol` | `workspace`, `project`, `format` | Find functions that call a symbol |
| `grepai_trace_callees` | `symbol` | `workspace`, `project`, `format` | Find functions called by a symbol |
| `grepai_trace_graph` | `symbol` | `workspace`, `project`, `depth`, `format` | Build a call graph around a symbol |
| `grepai_index_status` | none | none | Check GrepAI index and watcher health |

## Temporarily Disabled Tools

The following documented GrepAI MCP tools are temporarily disabled in this package because `grepai` v0.35.0 does not expose matching CLI commands:

- `grepai_refs_readers`
- `grepai_refs_writers`
- `grepai_refs_graph`
- `grepai_rpg_search`
- `grepai_rpg_fetch`
- `grepai_rpg_explore`

They remain commented in the source so they can be restored if GrepAI exposes them through the CLI later.

## Parameter Notes

- `format` accepts `json`, `toon`, or `text`. `json` maps to `--json`, `toon` maps to `--toon`, and `text` adds no output-format flag.
- `compact: true` maps to `--compact` on `grepai_search`, which is the CLI command that currently supports compact output.
- `limit` maps to `--limit` on search, and `depth` maps to `--depth` on trace graph.
- `workspace` and `project` pass through to trace commands. If the installed GrepAI version does not support a flag, the CLI error is returned directly.

## Agent Guidance

Tool metadata is intentionally short. Long-form search strategy, trace strategy, output-format examples, and troubleshooting belong in the installed GrepAI skills and the official GrepAI documentation.

- Use `grepai_search` for semantic discovery when exact symbols are unknown.
- Use `grepai_trace_*` for function or method call relationships.
- Use `grepai_index_status` when results look stale or indexing may be unavailable.

## Output Handling

**stdout and stderr pass through directly** from the GrepAI CLI. No schema normalization is performed. Raw output is returned as text content in the tool result, with raw command details attached for Pi.

## Version Compatibility

This package currently exposes only tools backed by `grepai` v0.35.0 CLI commands. MCP-only tools are disabled until GrepAI exposes equivalent CLI commands or this package adds explicit MCP support.

## Activation

Tools are activated automatically on session start if the project is detected as initialized (`.grepai/config.yaml` exists). If not initialized, tools remain registered but inactive until you run `grepai init` manually in the project root and start or reload the Pi session.
