/** Active-tool list helpers for grepai tools. */
import { GREPAI_TOOL_NAMES } from "./tools.ts";

const DISABLED_GREPAI_TOOL_NAMES = ["grepai_refs_readers", "grepai_refs_writers", "grepai_refs_graph", "grepai_rpg_search", "grepai_rpg_fetch", "grepai_rpg_explore"] as const;

const GREPAI_TOOL_SET: ReadonlySet<string> = new Set([...GREPAI_TOOL_NAMES, ...DISABLED_GREPAI_TOOL_NAMES]);

export function nextActiveTools(current: readonly string[], enabled: boolean): string[] {
	const withoutGrepai = current.filter((name) => !GREPAI_TOOL_SET.has(name));
	return enabled ? Array.from(new Set([...withoutGrepai, ...GREPAI_TOOL_NAMES])) : withoutGrepai;
}
