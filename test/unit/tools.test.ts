import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildGrepaiArgs, GREPAI_TOOL_NAMES, type GrepaiToolName } from "../../src/grepai/tools.ts";

void describe("grepai tools", () => {
	it("declares only CLI-backed tools available in grepai v0.35.0", () => {
		assert.deepEqual(GREPAI_TOOL_NAMES, ["grepai_search", "grepai_trace_callers", "grepai_trace_callees", "grepai_trace_graph", "grepai_index_status"]);
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
	{ name: "grepai_index_status", params: {}, expected: ["status", "--no-ui"] },
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
		params: { symbol: "Login", workspace: "fullstack", project: "api", format: "json" },
		expected: ["trace", "callers", "Login", "--workspace", "fullstack", "--project", "api", "--json"],
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
	{ name: "grepai_index_status", params: { verbose: true, workspace: "fullstack", format: "json" }, expected: ["status", "--no-ui"] },
];

void describe("buildGrepaiArgs", () => {
	for (const tc of [...BASIC_ARG_CASES, ...OPTIONAL_ARG_CASES]) {
		it(`maps ${tc.name} with ${JSON.stringify(tc.params)}`, () => {
			assert.deepEqual(buildGrepaiArgs(tc.name, tc.params), tc.expected);
		});
	}
});
