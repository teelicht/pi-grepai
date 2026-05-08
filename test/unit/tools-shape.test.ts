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
});
