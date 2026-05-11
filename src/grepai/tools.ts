/** LLM-facing grepai tool definitions and command mappings. */
import type { AgentToolResult } from "@mariozechner/pi-agent-core";
import type { ExtensionContext, ToolDefinition } from "@mariozechner/pi-coding-agent";
import { Type } from "typebox";
import type { GrepaiConfig } from "../extension/config-store.ts";
import { formatCommandResult, runGrepai } from "./cli.ts";
import { resolveProjectRoot } from "./project-root.ts";

export const GREPAI_TOOL_NAMES = [
	"grepai_search",
	"grepai_trace_callers",
	"grepai_trace_callees",
	"grepai_trace_graph",
	"grepai_refs_readers",
	"grepai_refs_writers",
	"grepai_refs_graph",
	"grepai_index_status",
	"grepai_rpg_search",
	"grepai_rpg_fetch",
	"grepai_rpg_explore",
] as const;
export type GrepaiToolName = (typeof GREPAI_TOOL_NAMES)[number];
export type GrepaiToolParams = { query?: string; symbol?: string; id?: string; path?: string };

export function buildGrepaiArgs(name: GrepaiToolName, params: GrepaiToolParams): string[] {
	switch (name) {
		case "grepai_search":
			return ["search", params.query ?? "", "--json", "--compact"];
		case "grepai_trace_callers":
			return ["trace", "callers", params.symbol ?? ""];
		case "grepai_trace_callees":
			return ["trace", "callees", params.symbol ?? ""];
		case "grepai_trace_graph":
			return ["trace", "graph", params.symbol ?? ""];
		case "grepai_refs_readers":
			return ["refs", "readers", params.symbol ?? ""];
		case "grepai_refs_writers":
			return ["refs", "writers", params.symbol ?? ""];
		case "grepai_refs_graph":
			return ["refs", "graph", params.symbol ?? ""];
		case "grepai_index_status":
			return ["status", "--no-ui"];
		case "grepai_rpg_search":
			return ["rpg", "search", params.query ?? ""];
		case "grepai_rpg_fetch":
			return ["rpg", "fetch", params.id ?? params.path ?? ""];
		case "grepai_rpg_explore":
			return ["rpg", "explore", params.query ?? ""];
	}
}

const Params = Type.Object({ query: Type.Optional(Type.String()), symbol: Type.Optional(Type.String()), id: Type.Optional(Type.String()), path: Type.Optional(Type.String()) });

function toolLabel(name: string): string {
	return name.replaceAll("_", " ");
}

const TOOL_DESCRIPTIONS: Record<GrepaiToolName, string> = {
	grepai_search: "Semantic code search by intent; returns ranked file/line matches.",
	grepai_trace_callers: "Find functions that call a symbol.",
	grepai_trace_callees: "Find functions called by a symbol.",
	grepai_trace_graph: "Build a call graph around a symbol.",
	grepai_refs_readers: "Find code that reads a property, field, or state key.",
	grepai_refs_writers: "Find code that writes or mutates a property, field, or state key.",
	grepai_refs_graph: "Show readers and writers for a property/state symbol.",
	grepai_index_status: "Check GrepAI index and watcher health.",
	grepai_rpg_search: "Search Repository Purpose Graph feature nodes.",
	grepai_rpg_fetch: "Fetch context for a specific RPG node.",
	grepai_rpg_explore: "Traverse nearby RPG nodes by direction/depth.",
};

const SHARED_PROMPT_GUIDANCE =
	"Runs the matching grepai CLI command in the current project and returns raw stdout/stderr. Prefer grepai_search for semantic discovery, trace_* for call flow, refs_* for data-flow/property usage, and index_status when results look stale or unavailable.";

function promptFor(name: GrepaiToolName): string {
	return `${TOOL_DESCRIPTIONS[name]}\n\n${SHARED_PROMPT_GUIDANCE}`;
}

export function createGrepaiTools(getConfig: () => GrepaiConfig): ToolDefinition<typeof Params, Record<string, unknown>>[] {
	return GREPAI_TOOL_NAMES.map((name) => ({
		name,
		label: toolLabel(name),
		description: TOOL_DESCRIPTIONS[name],
		promptSnippet: promptFor(name),
		parameters: Params,
		async execute(_toolCallId, params, signal, _onUpdate, ctx: ExtensionContext): Promise<AgentToolResult<Record<string, unknown>>> {
			const projectRoot = await resolveProjectRoot(ctx.cwd);
			const result = await runGrepai(buildGrepaiArgs(name, params as GrepaiToolParams), { cwd: projectRoot, timeoutMs: getConfig().grepai.commands.timeoutMs, signal });
			return { content: [{ type: "text", text: formatCommandResult(result) }], details: { projectRoot, result } };
		},
	}));
}
