import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, it } from "node:test";
import { createRuntimeConfigStore, loadRuntimeConfigState } from "../../src/extension/config-store.ts";

function tempDir(files: Record<string, string>): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-grepai-config-"));
	for (const [name, content] of Object.entries(files)) {
		fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
		fs.writeFileSync(path.join(dir, name), content, "utf-8");
	}
	return dir;
}

void describe("config store", () => {
	it("loads bundled defaults when user config is absent", () => {
		const dir = tempDir({ "default-config.json": JSON.stringify({ grepai: { autoStart: true, output: { format: "json", compact: true }, commands: { timeoutMs: 30000 } } }) });
		const state = loadRuntimeConfigState(dir, dir);
		assert.equal(state.blocked, false);
		assert.equal(state.config.grepai.autoStart, true);
	});

	it("deep merges user config over defaults", () => {
		const defaults = { grepai: { autoStart: true, output: { format: "json", compact: true }, commands: { timeoutMs: 30000 } } };
		const dir = tempDir({ "default-config.json": JSON.stringify(defaults), "config.json": JSON.stringify({ grepai: { autoStart: false, commands: { timeoutMs: 1000 } } }) });
		const state = loadRuntimeConfigState(dir, dir);
		assert.equal(state.config.grepai.autoStart, false);
		assert.equal(state.config.grepai.output.compact, true);
		assert.equal(state.config.grepai.commands.timeoutMs, 1000);
	});

	it("preserves output format from default-config.json when user config omits it", () => {
		const defaults = { grepai: { autoStart: true, output: { format: "text", compact: true }, commands: { timeoutMs: 30000 } } };
		const dir = tempDir({ "default-config.json": JSON.stringify(defaults), "config.json": JSON.stringify({ grepai: { autoStart: false } }) });
		const state = loadRuntimeConfigState(dir, dir);
		assert.equal(state.config.grepai.output.format, "text");
	});

	it("reports malformed JSON as blocked", () => {
		const dir = tempDir({ "default-config.json": "{}", "config.json": "{" });
		const state = loadRuntimeConfigState(dir, dir);
		assert.equal(state.blocked, true);
		assert.equal(state.diagnostics[0]?.code, "config_load_failed");
	});

	it("keeps the same gate object after reload", () => {
		const dir = tempDir({ "default-config.json": JSON.stringify({ grepai: { autoStart: true } }), "config.json": "{}" });
		const store = createRuntimeConfigStore(dir, dir);
		const first = store.getGateState();
		fs.writeFileSync(path.join(dir, "config.json"), "{", "utf-8");
		store.reloadConfig();
		assert.equal(store.getGateState(), first);
		assert.equal(first.blocked, true);
	});
});
