# Configuration

The runtime configuration file is stored at:

```
~/.pi/agent/extensions/pi-grepai/config.json
```

If this file does not exist, bundled defaults are used. Create the directory if needed:

```bash
mkdir -p ~/.pi/agent/extensions/pi-grepai
```

## Configuration Fields

### `grepai.autoStart`

**Type:** `boolean` | **Default:** `true`

When `true` and a project is detected as initialized, the extension automatically starts `grepai watch --background` on session start.

### `grepai.output.format`

**Type:** `"json" | "text"` | **Default:** `"json"`

Controls the output format for grepai CLI commands that support structured output. This field is parsed and stored in the v1 configuration but is not dynamically applied by the current slash commands and LLM tools. For example, `grepai_search` currently requests JSON compact output directly via CLI flags.

### `grepai.output.compact`

**Type:** `boolean` | **Default:** `true`

When `true`, enables compact output mode. This field is parsed and stored in the v1 configuration but is not dynamically applied by the current slash commands and LLM tools. Standard output (stdout) and error output (stderr) from grepai commands pass through directly.

### `grepai.commands.timeoutMs`

**Type:** `number` | **Default:** `30000`

Timeout in milliseconds for all grepai CLI command executions.

## Example Configuration

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