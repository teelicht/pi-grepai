import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nextActiveTools } from "../../src/grepai/tool-activation.ts";
import { GREPAI_TOOL_NAMES } from "../../src/grepai/tools.ts";

void describe("tool activation", () => {
	it("adds grepai tools while preserving active builtins", () => {
		assert.deepEqual(nextActiveTools(["read", "bash"], true).sort(), ["bash", "read", ...GREPAI_TOOL_NAMES].sort());
	});
	it("removes only grepai tools when inactive", () => {
		assert.deepEqual(nextActiveTools(["read", "grepai_search", "grepai_refs_graph"], false), ["read"]);
	});
});

// Edge cases for nextActiveTools
void describe("nextActiveTools edge cases", () => {
	it("empty input when enabled returns all grepai tools", () => {
		const result = nextActiveTools([], true);
		assert.deepEqual(result.sort(), [...GREPAI_TOOL_NAMES].sort());
	});
	it("empty input when disabled returns empty array", () => {
		assert.deepEqual(nextActiveTools([], false), []);
	});
	it("only builtin tools when disabled returns only builtins", () => {
		assert.deepEqual(nextActiveTools(["read", "bash"], false), ["read", "bash"]);
	});
	it("enabling when grepai tool already present does not duplicate", () => {
		const result = nextActiveTools(["grepai_search"], true);
		assert.ok(result.includes("grepai_search"));
		assert.equal(result.filter((n) => n === "grepai_search").length, 1);
	});
	it("disabling with multiple grepai tools removes all of them", () => {
		const result = nextActiveTools(["grepai_search", "grepai_trace_callers", "read"], false);
		assert.ok(!result.includes("grepai_search"));
		assert.ok(!result.includes("grepai_trace_callers"));
		assert.ok(result.includes("read"));
	});
});
