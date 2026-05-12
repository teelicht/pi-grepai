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
			[
				"grepai_search",
				{ description: "Semantic code search by intent.", promptSnippet: "Use when relevant code is needed but exact symbols are unknown." },
			],
			[
				"grepai_trace_callers",
				{ description: "Find functions that call a symbol.", promptSnippet: "Use for function or method callers once you know a symbol." },
			],
			[
				"grepai_trace_callees",
				{ description: "Find functions called by a symbol.", promptSnippet: "Use for function or method callees once you know a symbol." },
			],
			[
				"grepai_trace_graph",
				{ description: "Build a call graph around a symbol.", promptSnippet: "Use for recursive function or method call relationships." },
			],
			[
				"grepai_refs_readers",
				{
					description: "Find property or state readers for a symbol.",
					promptSnippet: "Use for property, field, or state reads rather than function calls.",
				},
			],
			[
				"grepai_refs_writers",
				{
					description: "Find property or state writers for a symbol.",
					promptSnippet: "Use for property, field, or state writes rather than function calls.",
				},
			],
			[
				"grepai_refs_graph",
				{ description: "Build a property or state usage graph.", promptSnippet: "Use for combined read and write usage of a property or state key." },
			],
			[
				"grepai_index_status",
				{ description: "Check GrepAI index and watcher health.", promptSnippet: "Use when search results look stale or indexing may be unavailable." },
			],
			[
				"grepai_rpg_search",
				{ description: "Search Repository Purpose Graph nodes.", promptSnippet: "Use for GrepAI RPG semantic graph exploration when RPG is enabled." },
			],
			[
				"grepai_rpg_fetch",
				{ description: "Fetch context for a GrepAI RPG node.", promptSnippet: "Use to retrieve hierarchy and edge context for a known RPG node." },
			],
			[
				"grepai_rpg_explore",
				{ description: "Traverse GrepAI RPG graph neighborhoods.", promptSnippet: "Use to explore nearby RPG graph nodes by direction and depth." },
			],
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
