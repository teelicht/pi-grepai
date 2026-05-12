/** LLM-facing grepai tool definitions and command mappings. */
import type { AgentToolResult } from "@mariozechner/pi-agent-core";
import type { ExtensionContext, ToolDefinition } from "@mariozechner/pi-coding-agent";
import { Type, type TSchema } from "typebox";
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

type GrepaiFormat = "json" | "toon" | "text";

type SearchParams = { query: string; limit?: number; compact?: boolean; format?: GrepaiFormat };
type TraceParams = { symbol: string; workspace?: string; project?: string; compact?: boolean; format?: GrepaiFormat };
type TraceGraphParams = { symbol: string; workspace?: string; project?: string; depth?: number; format?: GrepaiFormat };
type RefsParams = { symbol: string; workspace?: string; project?: string; format?: GrepaiFormat };
type StatusParams = { verbose?: boolean; workspace?: string; format?: GrepaiFormat };
type RpgSearchParams = { query: string; limit?: number; format?: GrepaiFormat };
type RpgFetchParams = { id: string; format?: GrepaiFormat };
type RpgExploreParams = { id: string; direction?: "in" | "out" | "both"; depth?: number; format?: GrepaiFormat };

export type GrepaiToolParams =
	| SearchParams
	| TraceParams
	| TraceGraphParams
	| RefsParams
	| StatusParams
	| RpgSearchParams
	| RpgFetchParams
	| RpgExploreParams;

const Format = Type.Optional(
	Type.Union([Type.Literal("json"), Type.Literal("toon"), Type.Literal("text")], {
		description: "Output format flag to pass to grepai: json, toon, or text/no flag.",
	}),
);

const Direction = Type.Optional(
	Type.Union([Type.Literal("in"), Type.Literal("out"), Type.Literal("both")], {
		description: "RPG graph traversal direction.",
	}),
);

const SearchParamsSchema = Type.Object({
	query: Type.String({ description: "Natural-language semantic search query" }),
	limit: Type.Optional(Type.Number({ description: "Maximum number of results" })),
	compact: Type.Optional(Type.Boolean({ description: "Pass --compact for token-efficient output when supported" })),
	format: Format,
});

const TraceParamsSchema = Type.Object({
	symbol: Type.String({ description: "Function, method, or symbol name to trace" }),
	workspace: Type.Optional(Type.String({ description: "Workspace name for cross-project trace" })),
	project: Type.Optional(Type.String({ description: "Project name within the workspace" })),
	compact: Type.Optional(Type.Boolean({ description: "Pass --compact for token-efficient output when supported" })),
	format: Format,
});

const TraceGraphParamsSchema = Type.Object({
	symbol: Type.String({ description: "Function, method, or symbol name for the call graph" }),
	workspace: Type.Optional(Type.String({ description: "Workspace name for cross-project trace" })),
	project: Type.Optional(Type.String({ description: "Project name within the workspace" })),
	depth: Type.Optional(Type.Number({ description: "Maximum graph traversal depth" })),
	format: Format,
});

const RefsParamsSchema = Type.Object({
	symbol: Type.String({ description: "Property, field, or state key to inspect" }),
	workspace: Type.Optional(Type.String({ description: "Workspace name for cross-project refs" })),
	project: Type.Optional(Type.String({ description: "Project name within the workspace" })),
	format: Format,
});

const StatusParamsSchema = Type.Object({
	verbose: Type.Optional(Type.Boolean({ description: "Pass --verbose for more index details when supported" })),
	workspace: Type.Optional(Type.String({ description: "Workspace name for status when supported by the installed CLI" })),
	format: Format,
});

const RpgSearchParamsSchema = Type.Object({
	query: Type.String({ description: "Semantic query for Repository Purpose Graph nodes" }),
	limit: Type.Optional(Type.Number({ description: "Maximum number of RPG nodes" })),
	format: Format,
});

const RpgFetchParamsSchema = Type.Object({
	id: Type.String({ description: "Repository Purpose Graph node identifier" }),
	format: Format,
});

const RpgExploreParamsSchema = Type.Object({
	id: Type.String({ description: "Repository Purpose Graph node identifier" }),
	direction: Direction,
	depth: Type.Optional(Type.Number({ description: "Maximum graph traversal depth" })),
	format: Format,
});

type GrepaiToolSpec<TParams extends Record<string, unknown> = Record<string, unknown>> = {
	name: GrepaiToolName;
	description: string;
	promptSnippet: string;
	parameters: TSchema;
	buildArgs(params: TParams): string[];
};

function toolLabel(name: string): string {
	return name.replaceAll("_", " ");
}

function appendFormat(args: string[], format?: GrepaiFormat): void {
	if (format === "json") args.push("--json");
	if (format === "toon") args.push("--toon");
}

function appendBooleanFlag(args: string[], flag: string, enabled?: boolean): void {
	if (enabled) args.push(flag);
}

function appendStringFlag(args: string[], flag: string, value?: string): void {
	if (value !== undefined) args.push(flag, value);
}

function appendNumberFlag(args: string[], flag: string, value?: number): void {
	if (value !== undefined) args.push(flag, String(value));
}

function appendWorkspaceFlags(args: string[], params: { workspace?: string; project?: string }): void {
	appendStringFlag(args, "--workspace", params.workspace);
	appendStringFlag(args, "--project", params.project);
}

function appendCompactFormatFlags(args: string[], params: { compact?: boolean; format?: GrepaiFormat }): void {
	appendFormat(args, params.format);
	appendBooleanFlag(args, "--compact", params.compact);
}

const TOOL_SPECS = [
	{
		name: "grepai_search",
		description: "Semantic code search by intent.",
		promptSnippet: "Use when relevant code is needed but exact symbols are unknown.",
		parameters: SearchParamsSchema,
		buildArgs: (params: SearchParams) => {
			const args = ["search", params.query];
			appendNumberFlag(args, "--limit", params.limit);
			appendCompactFormatFlags(args, params);
			return args;
		},
	},
	{
		name: "grepai_trace_callers",
		description: "Find functions that call a symbol.",
		promptSnippet: "Use for function or method callers once you know a symbol.",
		parameters: TraceParamsSchema,
		buildArgs: (params: TraceParams) => {
			const args = ["trace", "callers", params.symbol];
			appendWorkspaceFlags(args, params);
			appendCompactFormatFlags(args, params);
			return args;
		},
	},
	{
		name: "grepai_trace_callees",
		description: "Find functions called by a symbol.",
		promptSnippet: "Use for function or method callees once you know a symbol.",
		parameters: TraceParamsSchema,
		buildArgs: (params: TraceParams) => {
			const args = ["trace", "callees", params.symbol];
			appendWorkspaceFlags(args, params);
			appendCompactFormatFlags(args, params);
			return args;
		},
	},
	{
		name: "grepai_trace_graph",
		description: "Build a call graph around a symbol.",
		promptSnippet: "Use for recursive function or method call relationships.",
		parameters: TraceGraphParamsSchema,
		buildArgs: (params: TraceGraphParams) => {
			const args = ["trace", "graph", params.symbol];
			appendWorkspaceFlags(args, params);
			appendNumberFlag(args, "--depth", params.depth);
			appendFormat(args, params.format);
			return args;
		},
	},
	{
		name: "grepai_refs_readers",
		description: "Find property or state readers for a symbol.",
		promptSnippet: "Use for property, field, or state reads rather than function calls.",
		parameters: RefsParamsSchema,
		buildArgs: (params: RefsParams) => {
			const args = ["refs", "readers", params.symbol];
			appendWorkspaceFlags(args, params);
			appendFormat(args, params.format);
			return args;
		},
	},
	{
		name: "grepai_refs_writers",
		description: "Find property or state writers for a symbol.",
		promptSnippet: "Use for property, field, or state writes rather than function calls.",
		parameters: RefsParamsSchema,
		buildArgs: (params: RefsParams) => {
			const args = ["refs", "writers", params.symbol];
			appendWorkspaceFlags(args, params);
			appendFormat(args, params.format);
			return args;
		},
	},
	{
		name: "grepai_refs_graph",
		description: "Build a property or state usage graph.",
		promptSnippet: "Use for combined read and write usage of a property or state key.",
		parameters: RefsParamsSchema,
		buildArgs: (params: RefsParams) => {
			const args = ["refs", "graph", params.symbol];
			appendWorkspaceFlags(args, params);
			appendFormat(args, params.format);
			return args;
		},
	},
	{
		name: "grepai_index_status",
		description: "Check GrepAI index and watcher health.",
		promptSnippet: "Use when search results look stale or indexing may be unavailable.",
		parameters: StatusParamsSchema,
		buildArgs: (params: StatusParams) => {
			const args = ["status", "--no-ui"];
			appendStringFlag(args, "--workspace", params.workspace);
			appendBooleanFlag(args, "--verbose", params.verbose);
			appendFormat(args, params.format);
			return args;
		},
	},
	{
		name: "grepai_rpg_search",
		description: "Search Repository Purpose Graph nodes.",
		promptSnippet: "Use for GrepAI RPG semantic graph exploration when RPG is enabled.",
		parameters: RpgSearchParamsSchema,
		buildArgs: (params: RpgSearchParams) => {
			const args = ["rpg", "search", params.query];
			appendNumberFlag(args, "--limit", params.limit);
			appendFormat(args, params.format);
			return args;
		},
	},
	{
		name: "grepai_rpg_fetch",
		description: "Fetch context for a GrepAI RPG node.",
		promptSnippet: "Use to retrieve hierarchy and edge context for a known RPG node.",
		parameters: RpgFetchParamsSchema,
		buildArgs: (params: RpgFetchParams) => {
			const args = ["rpg", "fetch", params.id];
			appendFormat(args, params.format);
			return args;
		},
	},
	{
		name: "grepai_rpg_explore",
		description: "Traverse GrepAI RPG graph neighborhoods.",
		promptSnippet: "Use to explore nearby RPG graph nodes by direction and depth.",
		parameters: RpgExploreParamsSchema,
		buildArgs: (params: RpgExploreParams) => {
			const args = ["rpg", "explore", params.id];
			appendStringFlag(args, "--direction", params.direction);
			appendNumberFlag(args, "--depth", params.depth);
			appendFormat(args, params.format);
			return args;
		},
	},
] as const satisfies readonly GrepaiToolSpec<any>[];

const TOOL_SPEC_BY_NAME: ReadonlyMap<GrepaiToolName, GrepaiToolSpec<any>> = new Map(TOOL_SPECS.map((spec) => [spec.name, spec]));

export function buildGrepaiArgs(name: GrepaiToolName, params: Record<string, unknown>): string[] {
	const spec = TOOL_SPEC_BY_NAME.get(name);
	if (!spec) throw new Error(`Unknown grepai tool: ${name}`);
	return spec.buildArgs(params);
}

export function createGrepaiTools(getConfig: () => GrepaiConfig): ToolDefinition<TSchema, Record<string, unknown>>[] {
	return TOOL_SPECS.map((spec) => ({
		name: spec.name,
		label: toolLabel(spec.name),
		description: spec.description,
		promptSnippet: spec.promptSnippet,
		parameters: spec.parameters,
		async execute(_toolCallId, params, signal, _onUpdate, ctx: ExtensionContext): Promise<AgentToolResult<Record<string, unknown>>> {
			const projectRoot = await resolveProjectRoot(ctx.cwd);
			const result = await runGrepai(buildGrepaiArgs(spec.name, params as Record<string, unknown>), {
				cwd: projectRoot,
				timeoutMs: getConfig().grepai.commands.timeoutMs,
				signal,
			});
			return { content: [{ type: "text", text: formatCommandResult(result) }], details: { projectRoot, result } };
		},
	}));
}
