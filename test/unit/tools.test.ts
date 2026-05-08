import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildGrepaiArgs, GREPAI_TOOL_NAMES } from "../../src/grepai/tools.ts";

void describe("grepai tools", () => {
	it("declares the v1 tool surface", () => {
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
	it("maps search to structured compact args", () => {
		assert.deepEqual(buildGrepaiArgs("grepai_search", { query: "router" }), ["search", "router", "--json", "--compact"]);
	});
	it("maps graph and refs tools without schema normalization", () => {
		assert.deepEqual(buildGrepaiArgs("grepai_trace_callers", { symbol: "handler" }), ["trace", "callers", "handler"]);
		assert.deepEqual(buildGrepaiArgs("grepai_refs_writers", { symbol: "state" }), ["refs", "writers", "state"]);
	});
});

// Table-driven tests for every GREPAI_TOOL_NAMES mapping
const BUILD_GREPAI_ARGS_CASES: Array<{ name: (typeof GREPAI_TOOL_NAMES)[number]; params: Record<string, string>; expected: string[] }> = [
	{ name: "grepai_search", params: { query: "findme" }, expected: ["search", "findme", "--json", "--compact"] },
	{ name: "grepai_trace_callers", params: { symbol: "main" }, expected: ["trace", "callers", "main"] },
	{ name: "grepai_trace_callees", params: { symbol: "run" }, expected: ["trace", "callees", "run"] },
	{ name: "grepai_trace_graph", params: { symbol: "dispatch" }, expected: ["trace", "graph", "dispatch"] },
	{ name: "grepai_refs_readers", params: { symbol: "config" }, expected: ["refs", "readers", "config"] },
	{ name: "grepai_refs_writers", params: { symbol: "state" }, expected: ["refs", "writers", "state"] },
	{ name: "grepai_refs_graph", params: { symbol: "store" }, expected: ["refs", "graph", "store"] },
	{ name: "grepai_index_status", params: {}, expected: ["status", "--no-ui"] },
	{ name: "grepai_rpg_search", params: { query: "auth" }, expected: ["rpg", "search", "auth"] },
	{ name: "grepai_rpg_fetch", params: { id: "abc123" }, expected: ["rpg", "fetch", "abc123"] },
	{ name: "grepai_rpg_fetch", params: { path: "lib/utils.ts" }, expected: ["rpg", "fetch", "lib/utils.ts"] },
	{ name: "grepai_rpg_explore", params: { query: "api" }, expected: ["rpg", "explore", "api"] },
	// Note: empty string id takes precedence over path (?? only checks nullish)
	{ name: "grepai_rpg_fetch", params: { id: "", path: "src/main.ts" }, expected: ["rpg", "fetch", ""] },
];

void describe("buildGrepaiArgs", () => {
	for (const tc of BUILD_GREPAI_ARGS_CASES) {
		it(`maps ${tc.name} with params ${JSON.stringify(tc.params)} to ${JSON.stringify(tc.expected)}`, () => {
			assert.deepEqual(buildGrepaiArgs(tc.name, tc.params), tc.expected);
		});
	}
});
