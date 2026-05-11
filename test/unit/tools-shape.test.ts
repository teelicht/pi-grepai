import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GrepaiConfig } from "../../src/extension/config-store.ts";
import { createGrepaiTools, GREPAI_TOOL_NAMES } from "../../src/grepai/tools.ts";

void describe("createGrepaiTools", () => {
	it("returns one definition per GREPAI_TOOL_NAMES", () => {
		// Mock resolveProjectRoot to avoid fs calls
		const tools = createGrepaiTools(() => ({ grepai: { commands: { timeoutMs: 5000 }, search: { maxResults: 10 } } }) as unknown as GrepaiConfig);
		assert.equal(tools.length, GREPAI_TOOL_NAMES.length);
	});
	it("each definition name matches a GREPAI_TOOL_NAMES entry", () => {
		const tools = createGrepaiTools(() => ({ grepai: { commands: { timeoutMs: 5000 }, search: { maxResults: 10 } } }) as unknown as GrepaiConfig);
		const toolNames = tools.map((t) => t.name);
		for (const expected of GREPAI_TOOL_NAMES) {
			assert.ok(toolNames.includes(expected), `Missing tool: ${expected}`);
		}
	});
	it("each definition has label, description, promptSnippet, parameters, and execute", () => {
		const tools = createGrepaiTools(() => ({ grepai: { commands: { timeoutMs: 5000 }, search: { maxResults: 10 } } }) as unknown as GrepaiConfig);
		for (const tool of tools) {
			assert.ok(typeof tool.label === "string" && tool.label.length > 0, `Missing label on ${tool.name}`);
			assert.ok(typeof tool.description === "string" && tool.description.length > 0, `Missing description on ${tool.name}`);
			assert.ok(typeof tool.promptSnippet === "string" && tool.promptSnippet.length > 0, `Missing promptSnippet on ${tool.name}`);
			assert.ok(typeof tool.parameters === "object" && tool.parameters !== null, `Missing parameters on ${tool.name}`);
			assert.ok(typeof tool.execute === "function", `Missing execute on ${tool.name}`);
		}
	});
	it("uses concise per-tool descriptions and shared grepai guidance", () => {
		const tools = createGrepaiTools(() => ({ grepai: { commands: { timeoutMs: 5000 }, search: { maxResults: 10 } } }) as unknown as GrepaiConfig);
		const expectedDescriptions = new Map([
			["grepai_search", "Semantic code search by intent; returns ranked file/line matches."],
			["grepai_trace_callers", "Find functions that call a symbol."],
			["grepai_trace_callees", "Find functions called by a symbol."],
			["grepai_trace_graph", "Build a call graph around a symbol."],
			["grepai_refs_readers", "Find code that reads a property, field, or state key."],
			["grepai_refs_writers", "Find code that writes or mutates a property, field, or state key."],
			["grepai_refs_graph", "Show readers and writers for a property/state symbol."],
			["grepai_index_status", "Check GrepAI index and watcher health."],
			["grepai_rpg_search", "Search Repository Purpose Graph feature nodes."],
			["grepai_rpg_fetch", "Fetch context for a specific RPG node."],
			["grepai_rpg_explore", "Traverse nearby RPG nodes by direction/depth."],
		]);
		const sharedGuidance =
			"Runs the matching grepai CLI command in the current project and returns raw stdout/stderr. Prefer grepai_search for semantic discovery, trace_* for call flow, refs_* for data-flow/property usage, and index_status when results look stale or unavailable.";
		for (const tool of tools) {
			assert.equal(tool.description, expectedDescriptions.get(tool.name));
			assert.equal(tool.promptSnippet, `${expectedDescriptions.get(tool.name)}\n\n${sharedGuidance}`);
		}
	});
});
