# LLM Tools

The extension registers the following tools for use by the LLM:

## Tool List

| Tool Name | Description |
|-----------|-------------|
| `grepai_search` | Semantic code search by intent; returns ranked file/line matches |
| `grepai_trace_callers` | Find functions that call a symbol |
| `grepai_trace_callees` | Find functions called by a symbol |
| `grepai_trace_graph` | Build a call graph around a symbol |
| `grepai_refs_readers` | Find code that reads a property, field, or state key |
| `grepai_refs_writers` | Find code that writes or mutates a property, field, or state key |
| `grepai_refs_graph` | Show readers and writers for a property/state symbol |
| `grepai_index_status` | Check GrepAI index and watcher health |
| `grepai_rpg_search` | Search Repository Purpose Graph feature nodes |
| `grepai_rpg_fetch` | Fetch context for a specific RPG node |
| `grepai_rpg_explore` | Traverse nearby RPG nodes by direction/depth |

## Agent Guidance

Each grepai LLM tool advertises concise shared guidance to models:

- Prefer `grepai_search` for semantic discovery.
- Use `trace_*` for call flow.
- Use `refs_*` for data-flow/property usage.
- Use `index_status` when results look stale or unavailable.

## Output Handling

**stdout and stderr pass through directly** from the grepai CLI. No schema normalization is performed. The raw output is returned as text content in the tool result.

## Activation

Tools are activated automatically on session start if the project is detected as initialized (`.grepai/config.yaml` exists). If not initialized, tools remain registered but inactive until you run `grepai init` manually in the project root and start or reload the Pi session.