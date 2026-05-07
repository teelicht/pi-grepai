# LLM Tools

The extension registers the following tools for use by the LLM:

## Tool List

| Tool Name | Description |
|-----------|-------------|
| `grepai_search` | Run `grepai search` with structured JSON compact output |
| `grepai_trace_callers` | Trace callers of a symbol |
| `grepai_trace_callees` | Trace callees of a symbol |
| `grepai_trace_graph` | Generate a call graph for a symbol |
| `grepai_refs_readers` | Find readers of a symbol |
| `grepai_refs_writers` | Find writers of a symbol |
| `grepai_refs_graph` | Generate a reference graph for a symbol |
| `grepai_index_status` | Show index status without the interactive UI |
| `grepai_rpg_search` | Search repository graphs |
| `grepai_rpg_fetch` | Fetch repository graph data by ID or path |
| `grepai_rpg_explore` | Explore repository graphs |

## Output Handling

**stdout and stderr pass through directly** from the grepai CLI. No schema normalization is performed. The raw output is returned as text content in the tool result.

## Activation

Tools are activated automatically on session start if the project is detected as initialized (`.grepai/config.yaml` exists). If not initialized, tools remain registered but inactive until `/grepai-init` is run.