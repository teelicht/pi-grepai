# GrepAI Tool Metadata Schemas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `pi-grepai`'s shared all-optional LLM tool schema with concise, MCP-aligned per-tool schemas and CLI argument mappings while keeping raw GrepAI CLI pass-through behavior.

**Architecture:** `src/grepai/tools.ts` becomes the single source of truth for each GrepAI tool's description, prompt snippet, TypeBox parameter schema, and CLI argument builder. Tests lock down the eleven-tool surface, required schema fields, non-duplicative prompt metadata, and optional flag translation. Docs explain the thin CLI bridge and version-dependent local GrepAI support without copying long-form GrepAI skill guidance.

**Tech Stack:** TypeScript ESM, TypeBox, Node built-in test runner, Pi `ToolDefinition`, local installed `grepai` CLI bridge.

---

## File Structure

| File | Responsibility | Planned Change |
|---|---|---|
| `src/grepai/tools.ts` | Defines GrepAI LLM tool names, schemas, metadata, argument mapping, and execution | Refactor around per-tool schemas and metadata table; add output/workspace/depth/limit flag builders |
| `test/unit/tools.test.ts` | Unit tests for tool list and CLI arg mapping | Replace old expectations with table-driven required and optional arg cases |
| `test/unit/tools-shape.test.ts` | Unit tests for registered tool shape, metadata, and schemas | Assert per-tool required fields, non-shared schemas, concise prompt snippets |
| `test/unit/docs.test.ts` | Documentation assertions | Update docs assertions for MCP/CLI-aligned surface and raw pass-through notes |
| `docs/tools.md` | User-facing LLM tool documentation | Document all eleven tools, required/optional params, pass-through, GrepAI skills/doc relationship |
| `README.md` | Package overview and tool list | Keep tool list consistent if descriptions change materially |

## Scope Notes

- Keep all eleven current `grepai_*` tools.
- Do not add MCP integration.
- Do not parse or normalize GrepAI output.
- Do not perform runtime version probing for `refs`, `rpg`, `toon`, `workspace`, or other flags.
- Let unsupported local CLI commands/flags surface through existing raw command-result formatting.

---

### Task 1: Lock Down CLI Argument Mapping with Failing Tests

**Files:**
- Modify: `test/unit/tools.test.ts`
- Test: `test/unit/tools.test.ts`

- [ ] **Step 1: Replace `test/unit/tools.test.ts` with the failing tests**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildGrepaiArgs, GREPAI_TOOL_NAMES, type GrepaiToolName } from "../../src/grepai/tools.ts";

void describe("grepai tools", () => {
	it("declares the documented eleven-tool surface", () => {
		assert.deepEqual(GREPAI_TOOL_NAMES, [
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
		]);
	});
});

type ArgsCase = {
	name: GrepaiToolName;
	params: Record<string, unknown>;
	expected: string[];
};

const BASIC_ARG_CASES: ArgsCase[] = [
	{ name: "grepai_search", params: { query: "findme" }, expected: ["search", "findme"] },
	{ name: "grepai_trace_callers", params: { symbol: "main" }, expected: ["trace", "callers", "main"] },
	{ name: "grepai_trace_callees", params: { symbol: "run" }, expected: ["trace", "callees", "run"] },
	{ name: "grepai_trace_graph", params: { symbol: "dispatch" }, expected: ["trace", "graph", "dispatch"] },
	{ name: "grepai_refs_readers", params: { symbol: "config" }, expected: ["refs", "readers", "config"] },
	{ name: "grepai_refs_writers", params: { symbol: "state" }, expected: ["refs", "writers", "state"] },
	{ name: "grepai_refs_graph", params: { symbol: "store" }, expected: ["refs", "graph", "store"] },
	{ name: "grepai_index_status", params: {}, expected: ["status", "--no-ui"] },
	{ name: "grepai_rpg_search", params: { query: "auth" }, expected: ["rpg", "search", "auth"] },
	{ name: "grepai_rpg_fetch", params: { id: "node-123" }, expected: ["rpg", "fetch", "node-123"] },
	{ name: "grepai_rpg_explore", params: { id: "node-456" }, expected: ["rpg", "explore", "node-456"] },
];

const OPTIONAL_ARG_CASES: ArgsCase[] = [
	{ name: "grepai_search", params: { query: "auth", limit: 5 }, expected: ["search", "auth", "--limit", "5"] },
	{ name: "grepai_search", params: { query: "auth", compact: true, format: "json" }, expected: ["search", "auth", "--json", "--compact"] },
	{ name: "grepai_search", params: { query: "auth", format: "toon" }, expected: ["search", "auth", "--toon"] },
	{ name: "grepai_search", params: { query: "auth", format: "text" }, expected: ["search", "auth"] },
	{
		name: "grepai_trace_callers",
		params: { symbol: "Login", workspace: "fullstack", project: "api", compact: true, format: "json" },
		expected: ["trace", "callers", "Login", "--workspace", "fullstack", "--project", "api", "--json", "--compact"],
	},
	{
		name: "grepai_trace_callees",
		params: { symbol: "Login", workspace: "fullstack", format: "toon" },
		expected: ["trace", "callees", "Login", "--workspace", "fullstack", "--toon"],
	},
	{
		name: "grepai_trace_graph",
		params: { symbol: "main", depth: 3, workspace: "fullstack", project: "web", format: "json" },
		expected: ["trace", "graph", "main", "--workspace", "fullstack", "--project", "web", "--depth", "3", "--json"],
	},
	{
		name: "grepai_refs_readers",
		params: { symbol: "uid", workspace: "fullstack", project: "web", format: "toon" },
		expected: ["refs", "readers", "uid", "--workspace", "fullstack", "--project", "web", "--toon"],
	},
	{
		name: "grepai_refs_writers",
		params: { symbol: "uid", format: "json" },
		expected: ["refs", "writers", "uid", "--json"],
	},
	{
		name: "grepai_refs_graph",
		params: { symbol: "uid", workspace: "fullstack" },
		expected: ["refs", "graph", "uid", "--workspace", "fullstack"],
	},
	{
		name: "grepai_index_status",
		params: { verbose: true, workspace: "fullstack", format: "json" },
		expected: ["status", "--no-ui", "--workspace", "fullstack", "--verbose", "--json"],
	},
	{
		name: "grepai_rpg_search",
		params: { query: "auth flow", limit: 4, format: "json" },
		expected: ["rpg", "search", "auth flow", "--limit", "4", "--json"],
	},
	{
		name: "grepai_rpg_fetch",
		params: { id: "node-123", format: "toon" },
		expected: ["rpg", "fetch", "node-123", "--toon"],
	},
	{
		name: "grepai_rpg_explore",
		params: { id: "node-123", direction: "out", depth: 2, format: "json" },
		expected: ["rpg", "explore", "node-123", "--direction", "out", "--depth", "2", "--json"],
	},
];

void describe("buildGrepaiArgs", () => {
	for (const tc of [...BASIC_ARG_CASES, ...OPTIONAL_ARG_CASES]) {
		it(`maps ${tc.name} with ${JSON.stringify(tc.params)}`, () => {
			assert.deepEqual(buildGrepaiArgs(tc.name, tc.params), tc.expected);
		});
	}
});
```

- [ ] **Step 2: Run the targeted test and verify it fails**

Run:

```bash
npm run test:unit -- test/unit/tools.test.ts
```

Expected: FAIL. At least one assertion should show current `grepai_search` still returns `--json --compact` by default or optional flags are missing.

- [ ] **Step 3: Commit the failing tests**

```bash
git add test/unit/tools.test.ts
git commit -m "test: specify grepai cli tool args"
```

---

### Task 2: Lock Down Tool Schemas and Prompt Metadata with Failing Tests

**Files:**
- Modify: `test/unit/tools-shape.test.ts`
- Test: `test/unit/tools-shape.test.ts`

- [ ] **Step 1: Replace `test/unit/tools-shape.test.ts` with schema and metadata tests**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GrepaiConfig } from "../../src/extension/config-store.ts";
import { createGrepaiTools, GREPAI_TOOL_NAMES, type GrepaiToolName } from "../../src/grepai/tools.ts";

const config = (): GrepaiConfig =>
	({ grepai: { commands: { timeoutMs: 5000 }, search: { maxResults: 10 } } }) as unknown as GrepaiConfig;

function toolsByName() {
	return new Map(createGrepaiTools(config).map((tool) => [tool.name as GrepaiToolName, tool]));
}

type ObjectSchemaShape = {
	properties?: Record<string, unknown>;
	required?: string[];
};

function schemaFor(name: GrepaiToolName): ObjectSchemaShape {
	const tool = toolsByName().get(name);
	assert.ok(tool, `Missing tool ${name}`);
	return tool.parameters as ObjectSchemaShape;
}

void describe("createGrepaiTools", () => {
	it("returns one definition per GREPAI_TOOL_NAMES entry", () => {
		const tools = createGrepaiTools(config);
		assert.equal(tools.length, GREPAI_TOOL_NAMES.length);
		assert.deepEqual(tools.map((tool) => tool.name), [...GREPAI_TOOL_NAMES]);
	});

	it("each definition has label, concise description, promptSnippet, parameters, and execute", () => {
		for (const tool of createGrepaiTools(config)) {
			assert.ok(typeof tool.label === "string" && tool.label.length > 0, `Missing label on ${tool.name}`);
			assert.ok(typeof tool.description === "string" && tool.description.length > 0, `Missing description on ${tool.name}`);
			assert.ok(tool.description.length <= 90, `Description too long on ${tool.name}: ${tool.description}`);
			assert.ok(typeof tool.promptSnippet === "string" && tool.promptSnippet.length > 0, `Missing promptSnippet on ${tool.name}`);
			assert.ok(tool.promptSnippet.length <= 140, `Prompt snippet too long on ${tool.name}: ${tool.promptSnippet}`);
			assert.ok(typeof tool.parameters === "object" && tool.parameters !== null, `Missing parameters on ${tool.name}`);
			assert.ok(typeof tool.execute === "function", `Missing execute on ${tool.name}`);
		}
	});

	it("uses concise non-duplicative descriptions and prompt snippets", () => {
		const expected = new Map<GrepaiToolName, { description: string; promptSnippet: string }>([
			["grepai_search", { description: "Semantic code search by intent.", promptSnippet: "Use when relevant code is needed but exact symbols are unknown." }],
			["grepai_trace_callers", { description: "Find functions that call a symbol.", promptSnippet: "Use for function or method callers once you know a symbol." }],
			["grepai_trace_callees", { description: "Find functions called by a symbol.", promptSnippet: "Use for function or method callees once you know a symbol." }],
			["grepai_trace_graph", { description: "Build a call graph around a symbol.", promptSnippet: "Use for recursive function or method call relationships." }],
			["grepai_refs_readers", { description: "Find property or state readers for a symbol.", promptSnippet: "Use for property, field, or state reads rather than function calls." }],
			["grepai_refs_writers", { description: "Find property or state writers for a symbol.", promptSnippet: "Use for property, field, or state writes rather than function calls." }],
			["grepai_refs_graph", { description: "Build a property or state usage graph.", promptSnippet: "Use for combined read and write usage of a property or state key." }],
			["grepai_index_status", { description: "Check GrepAI index and watcher health.", promptSnippet: "Use when search results look stale or indexing may be unavailable." }],
			["grepai_rpg_search", { description: "Search Repository Purpose Graph nodes.", promptSnippet: "Use for GrepAI RPG semantic graph exploration when RPG is enabled." }],
			["grepai_rpg_fetch", { description: "Fetch context for a GrepAI RPG node.", promptSnippet: "Use to retrieve hierarchy and edge context for a known RPG node." }],
			["grepai_rpg_explore", { description: "Traverse GrepAI RPG graph neighborhoods.", promptSnippet: "Use to explore nearby RPG graph nodes by direction and depth." }],
		]);

		for (const tool of createGrepaiTools(config)) {
			const item = expected.get(tool.name as GrepaiToolName);
			assert.ok(item, `No expected metadata for ${tool.name}`);
			assert.equal(tool.description, item.description);
			assert.equal(tool.promptSnippet, item.promptSnippet);
			assert.doesNotMatch(tool.promptSnippet ?? "", /Prefer grepai_search for semantic discovery/);
			assert.doesNotMatch(tool.promptSnippet ?? "", /Runs the matching grepai CLI command/);
		}
	});

	it("uses per-tool schemas instead of one shared all-optional object", () => {
		const signatures = createGrepaiTools(config).map((tool) => JSON.stringify(tool.parameters));
		assert.ok(new Set(signatures).size > 4, "expected multiple distinct schemas");
	});

	it("marks primary arguments as required", () => {
		const requiredByTool = new Map<GrepaiToolName, string[]>([
			["grepai_search", ["query"]],
			["grepai_trace_callers", ["symbol"]],
			["grepai_trace_callees", ["symbol"]],
			["grepai_trace_graph", ["symbol"]],
			["grepai_refs_readers", ["symbol"]],
			["grepai_refs_writers", ["symbol"]],
			["grepai_refs_graph", ["symbol"]],
			["grepai_rpg_search", ["query"]],
			["grepai_rpg_fetch", ["id"]],
			["grepai_rpg_explore", ["id"]],
		]);

		for (const [name, required] of requiredByTool) {
			assert.deepEqual(schemaFor(name).required, required, `${name} required fields`);
		}
		assert.equal(schemaFor("grepai_index_status").required, undefined);
	});

	it("exposes documented optional parameter properties", () => {
		assert.deepEqual(Object.keys(schemaFor("grepai_search").properties ?? {}).sort(), ["compact", "format", "limit", "query"]);
		assert.deepEqual(Object.keys(schemaFor("grepai_trace_callers").properties ?? {}).sort(), ["compact", "format", "project", "symbol", "workspace"]);
		assert.deepEqual(Object.keys(schemaFor("grepai_trace_graph").properties ?? {}).sort(), ["depth", "format", "project", "symbol", "workspace"]);
		assert.deepEqual(Object.keys(schemaFor("grepai_refs_graph").properties ?? {}).sort(), ["format", "project", "symbol", "workspace"]);
		assert.deepEqual(Object.keys(schemaFor("grepai_index_status").properties ?? {}).sort(), ["format", "verbose", "workspace"]);
		assert.deepEqual(Object.keys(schemaFor("grepai_rpg_explore").properties ?? {}).sort(), ["depth", "direction", "format", "id"]);
	});
});
```

- [ ] **Step 2: Run the targeted test and verify it fails**

Run:

```bash
npm run test:unit -- test/unit/tools-shape.test.ts
```

Expected: FAIL. The failure should show the current shared schema lacks required fields or prompt snippets still contain the long shared guidance.

- [ ] **Step 3: Commit the failing tests**

```bash
git add test/unit/tools-shape.test.ts
git commit -m "test: specify grepai tool schemas"
```

---

### Task 3: Implement Per-Tool Schemas, Metadata, and CLI Flag Mapping

**Files:**
- Modify: `src/grepai/tools.ts`
- Test: `test/unit/tools.test.ts`, `test/unit/tools-shape.test.ts`

- [ ] **Step 1: Replace `src/grepai/tools.ts` with the implementation**

```ts
/** LLM-facing grepai tool definitions and command mappings. */
import type { AgentToolResult } from "@mariozechner/pi-agent-core";
import type { ExtensionContext, ToolDefinition } from "@mariozechner/pi-coding-agent";
import { Type, type Static, type TSchema } from "typebox";
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

const SearchParams = Type.Object({
	query: Type.String({ description: "Natural-language semantic search query" }),
	limit: Type.Optional(Type.Number({ description: "Maximum number of results" })),
	compact: Type.Optional(Type.Boolean({ description: "Pass --compact for token-efficient output when supported" })),
	format: Format,
});

const TraceParams = Type.Object({
	symbol: Type.String({ description: "Function, method, or symbol name to trace" }),
	workspace: Type.Optional(Type.String({ description: "Workspace name for cross-project trace" })),
	project: Type.Optional(Type.String({ description: "Project name within the workspace" })),
	compact: Type.Optional(Type.Boolean({ description: "Pass --compact for token-efficient output when supported" })),
	format: Format,
});

const TraceGraphParams = Type.Object({
	symbol: Type.String({ description: "Function, method, or symbol name for the call graph" }),
	workspace: Type.Optional(Type.String({ description: "Workspace name for cross-project trace" })),
	project: Type.Optional(Type.String({ description: "Project name within the workspace" })),
	depth: Type.Optional(Type.Number({ description: "Maximum graph traversal depth" })),
	format: Format,
});

const RefsParams = Type.Object({
	symbol: Type.String({ description: "Property, field, or state key to inspect" }),
	workspace: Type.Optional(Type.String({ description: "Workspace name for cross-project refs" })),
	project: Type.Optional(Type.String({ description: "Project name within the workspace" })),
	format: Format,
});

const StatusParams = Type.Object({
	verbose: Type.Optional(Type.Boolean({ description: "Pass --verbose for more index details when supported" })),
	workspace: Type.Optional(Type.String({ description: "Workspace name for status when supported by the installed CLI" })),
	format: Format,
});

const RpgSearchParams = Type.Object({
	query: Type.String({ description: "Semantic query for Repository Purpose Graph nodes" }),
	limit: Type.Optional(Type.Number({ description: "Maximum number of RPG nodes" })),
	format: Format,
});

const RpgFetchParams = Type.Object({
	id: Type.String({ description: "Repository Purpose Graph node identifier" }),
	format: Format,
});

const RpgExploreParams = Type.Object({
	id: Type.String({ description: "Repository Purpose Graph node identifier" }),
	direction: Direction,
	depth: Type.Optional(Type.Number({ description: "Maximum graph traversal depth" })),
	format: Format,
});

type SearchParams = Static<typeof SearchParams>;
type TraceParams = Static<typeof TraceParams>;
type TraceGraphParams = Static<typeof TraceGraphParams>;
type RefsParams = Static<typeof RefsParams>;
type StatusParams = Static<typeof StatusParams>;
type RpgSearchParams = Static<typeof RpgSearchParams>;
type RpgFetchParams = Static<typeof RpgFetchParams>;
type RpgExploreParams = Static<typeof RpgExploreParams>;

export type GrepaiToolParams =
	| SearchParams
	| TraceParams
	| TraceGraphParams
	| RefsParams
	| StatusParams
	| RpgSearchParams
	| RpgFetchParams
	| RpgExploreParams;

type GrepaiFormat = "json" | "toon" | "text";

type GrepaiToolSpec<TParams extends TSchema = TSchema> = {
	name: GrepaiToolName;
	description: string;
	promptSnippet: string;
	parameters: TParams;
	buildArgs(params: Static<TParams>): string[];
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
		parameters: SearchParams,
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
		parameters: TraceParams,
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
		parameters: TraceParams,
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
		parameters: TraceGraphParams,
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
		parameters: RefsParams,
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
		parameters: RefsParams,
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
		parameters: RefsParams,
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
		parameters: StatusParams,
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
		parameters: RpgSearchParams,
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
		parameters: RpgFetchParams,
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
		parameters: RpgExploreParams,
		buildArgs: (params: RpgExploreParams) => {
			const args = ["rpg", "explore", params.id];
			appendStringFlag(args, "--direction", params.direction);
			appendNumberFlag(args, "--depth", params.depth);
			appendFormat(args, params.format);
			return args;
		},
	},
] as const satisfies readonly GrepaiToolSpec[];

const TOOL_SPEC_BY_NAME: ReadonlyMap<GrepaiToolName, GrepaiToolSpec> = new Map(TOOL_SPECS.map((spec) => [spec.name, spec]));

export function buildGrepaiArgs(name: GrepaiToolName, params: Record<string, unknown>): string[] {
	const spec = TOOL_SPEC_BY_NAME.get(name);
	if (!spec) throw new Error(`Unknown grepai tool: ${name}`);
	return spec.buildArgs(params as never);
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
```

- [ ] **Step 2: Run targeted tests and verify they pass or reveal TypeScript issues**

Run:

```bash
npm run test:unit -- test/unit/tools.test.ts test/unit/tools-shape.test.ts
```

Expected: PASS. If Node test argument forwarding runs all unit tests instead of only these files, all executed tests should pass.

- [ ] **Step 3: Run typecheck for the changed implementation**

Run:

```bash
npm run typecheck
```

Expected: PASS. If TypeScript reports a mismatch around `ToolDefinition<TSchema, Record<string, unknown>>`, adjust only the local type annotation in `createGrepaiTools` or `GrepaiToolSpec` so the runtime behavior and test expectations remain unchanged.

- [ ] **Step 4: Commit implementation**

```bash
git add src/grepai/tools.ts test/unit/tools.test.ts test/unit/tools-shape.test.ts
git commit -m "feat: add grepai per-tool schemas"
```

---

### Task 4: Update Tool Documentation and Docs Tests

**Files:**
- Modify: `docs/tools.md`
- Modify: `test/unit/docs.test.ts`
- Modify: `README.md` only if its tool list descriptions no longer match project positioning
- Test: `test/unit/docs.test.ts`

- [ ] **Step 1: Replace `docs/tools.md` with MCP/CLI-aligned documentation**

```md
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
```

- [ ] **Step 2: Replace the first docs test with updated assertions**

In `test/unit/docs.test.ts`, replace only the body of `it("documents commands, tools, config, non-goals, and release steps", () => { ... })` with:

```ts
		for (const file of ["README.md", "docs/configuration.md", "docs/commands.md", "docs/tools.md", "docs/releases.md"])
			assert.equal(fs.existsSync(file), true, `${file} should exist`);
		const readme = fs.readFileSync("README.md", "utf-8");
		assert.match(readme, /does not install grepai/i);
		assert.match(readme, /grepai init/i);
		assert.match(readme, /pi install npm:@teelicht\/pi-grepai/);
		assert.doesNotMatch(readme, /npm\.pkg\.github\.com/);
		const toolsDoc = fs.readFileSync("docs/tools.md", "utf-8");
		assert.match(toolsDoc, /grepai_search/);
		assert.match(toolsDoc, /Required Params/);
		assert.match(toolsDoc, /`grepai_refs_readers` \| `symbol`/);
		assert.match(toolsDoc, /`grepai_rpg_explore` \| `id`/);
		assert.match(toolsDoc, /stdout and stderr pass through directly/i);
		assert.match(toolsDoc, /No schema normalization is performed/i);
		assert.match(toolsDoc, /installed GrepAI skills/i);
		assert.match(toolsDoc, /documented GrepAI MCP\/CLI tool surface/i);
```

- [ ] **Step 3: Run docs tests and verify they fail before all edits are saved, then pass after edits**

Run:

```bash
npm run test:unit -- test/unit/docs.test.ts
```

Expected after Step 1 and Step 2: PASS.

- [ ] **Step 4: Inspect README tool list consistency**

Run:

```bash
grep -n "grepai_refs\|grepai_rpg\|grepai_search" README.md
```

Expected: README still lists the eleven tool names. If it only lists names, no README edit is required.

- [ ] **Step 5: Commit docs changes**

```bash
git add docs/tools.md test/unit/docs.test.ts README.md
git commit -m "docs: document grepai tool parameters"
```

If README was unchanged, `git add README.md` is harmless and the commit will include only changed files.

---

### Task 5: Run Full QA and Final Review Commit if Needed

**Files:**
- Verify: entire project
- Possible Modify: files from earlier tasks only if QA reveals issues

- [ ] **Step 1: Run full QA**

Run:

```bash
npm run qa
```

Expected: PASS. This command may apply Biome formatting changes because `qa` runs `biome check --write`.

- [ ] **Step 2: Inspect formatting changes**

Run:

```bash
git status --short
git diff -- src/grepai/tools.ts test/unit/tools.test.ts test/unit/tools-shape.test.ts test/unit/docs.test.ts docs/tools.md README.md
```

Expected: either no changes, or only formatting/test/doc changes caused by QA or fixes from Step 1.

- [ ] **Step 3: If QA changed files, commit those changes**

If `git status --short` shows changed files, run:

```bash
git add src/grepai/tools.ts test/unit/tools.test.ts test/unit/tools-shape.test.ts test/unit/docs.test.ts docs/tools.md README.md
git commit -m "chore: format grepai tool metadata changes"
```

If `git status --short` shows no changed files, do not create an empty commit.

- [ ] **Step 4: Record completion evidence**

Run:

```bash
git log --oneline -5
npm run qa
```

Expected: recent commits include the task commits from this plan, and the second `npm run qa` exits successfully.

---

## Self-Review Notes

- Spec coverage: Tasks 1-3 cover per-tool schemas, required inputs, optional CLI flags, concise metadata, raw pass-through preservation, and no MCP integration. Task 4 covers docs. Task 5 covers required QA.
- Placeholder scan: The plan gives exact files, code, commands, and expected outcomes for each task.
- Type consistency: The plan uses `GrepaiToolName`, `GrepaiToolParams`, `buildGrepaiArgs`, `createGrepaiTools`, `format`, `compact`, `workspace`, `project`, `depth`, `limit`, `direction`, `query`, `symbol`, and `id` consistently across tests and implementation.
