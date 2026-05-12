# LLM Tools

The extension registers GrepAI LLM tools that call the installed `grepai` CLI from the detected project root. The tools mirror the documented GrepAI MCP/CLI surface, but this package does not run GrepAI through MCP and does not normalize GrepAI output.

## Tool List

| Tool Name | Required Params | Optional Params | Description |
|-----------|-----------------|-----------------|-------------|
| `grepai_search` | `query` | `limit`, `compact`, `format` | Semantic code search by intent |
| `grepai_trace_callers` | `symbol` | `workspace`, `project`, `compact`, `format` | Find functions that call a symbol |
| `grepai_trace_callees` | `symbol` | `workspace`, `project`, `compact`, `format` | Find functions called by a symbol |
| `grepai_trace_graph` | `symbol` | `workspace`, `project`, `depth`, `format` | Build a call graph around a symbol |
| `grepai_refs_readers` | `symbol` | `workspace`, `project`, `format` | Find property or state readers for a symbol |
| `grepai_refs_writers` | `symbol` | `workspace`, `project`, `format` | Find property or state writers for a symbol |
| `grepai_refs_graph` | `symbol` | `workspace`, `project`, `format` | Build a property or state usage graph |
| `grepai_index_status` | none | `verbose`, `workspace`, `format` | Check GrepAI index and watcher health |
| `grepai_rpg_search` | `query` | `limit`, `format` | Search Repository Purpose Graph nodes |
| `grepai_rpg_fetch` | `id` | `format` | Fetch context for a GrepAI RPG node |
| `grepai_rpg_explore` | `id` | `direction`, `depth`, `format` | Traverse GrepAI RPG graph neighborhoods |

## Parameter Notes

- `format` accepts `json`, `toon`, or `text`. `json` maps to `--json`, `toon` maps to `--toon`, and `text` adds no output-format flag.
- `compact: true` maps to `--compact` on tools whose GrepAI command supports compact output.
- `limit` and `depth` map to `--limit` and `--depth`.
- `workspace` and `project` pass through to the matching GrepAI CLI flags. If the installed GrepAI version does not support a flag or command, the CLI error is returned directly.

## Agent Guidance

Tool metadata is intentionally short. Long-form search strategy, trace strategy, output-format examples, and troubleshooting belong in the installed GrepAI skills and the official GrepAI documentation.

- Use `grepai_search` for semantic discovery when exact symbols are unknown.
- Use `grepai_trace_*` for function or method call relationships.
- Use `grepai_refs_*` for property, field, or state read/write usage.
- Use `grepai_index_status` when results look stale or indexing may be unavailable.
- Use `grepai_rpg_*` only when GrepAI RPG is enabled for the project or workspace.

## Output Handling

**stdout and stderr pass through directly** from the GrepAI CLI. No schema normalization is performed. Raw output is returned as text content in the tool result, with raw command details attached for Pi.

## Version Compatibility

This package mirrors the documented GrepAI MCP/CLI tool surface while executing the local installed `grepai` binary. Available commands and flags can depend on the installed GrepAI version. `pi-grepai` intentionally lets unsupported local commands or flags surface as GrepAI CLI output instead of hiding them with compatibility shims.

## Activation

Tools are activated automatically on session start if the project is detected as initialized (`.grepai/config.yaml` exists). If not initialized, tools remain registered but inactive until you run `grepai init` manually in the project root and start or reload the Pi session.
