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
	{
		name: "grepai_search",
		params: { query: "auth", compact: true, format: "json" },
		expected: ["search", "auth", "--json", "--compact"],
	},
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
