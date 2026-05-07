/** Active-tool list helpers for grepai tools. */
import { GREPAI_TOOL_NAMES } from "./tools.ts";

const GREPAI_TOOL_SET: ReadonlySet<string> = new Set(GREPAI_TOOL_NAMES);

export function nextActiveTools(current: readonly string[], enabled: boolean): string[] {
	const withoutGrepai = current.filter((name) => !GREPAI_TOOL_SET.has(name));
	return enabled ? Array.from(new Set([...withoutGrepai, ...GREPAI_TOOL_NAMES])) : withoutGrepai;
}