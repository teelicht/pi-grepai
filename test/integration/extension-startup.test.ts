import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, it } from "node:test";
import registerExtension from "../../src/extension/index.ts";

type AnyHandler = (...args: unknown[]) => unknown;

function mockPi() {
	const handlers = new Map<string, AnyHandler>();
	const tools: string[] = [];
	const registeredCommands: string[] = [];
	let active: string[] = ["read"];
	const pi = {
		on: (name: string, handler: AnyHandler) => handlers.set(name, handler),
		registerTool: (tool: { name: string }) => tools.push(tool.name),
		registerCommand: (name: string) => registeredCommands.push(name),
		getActiveTools: () => active,
		setActiveTools: (names: string[]) => {
			active = names;
		},
	};
	return {
		pi,
		handlers,
		tools,
		registeredCommands,
		get active() {
			return active;
		},
	};
}

function createMockGrepaiScript(tempBin: string, exitCode: number): string {
	const scriptPath = path.join(tempBin, "grepai");
	fs.writeFileSync(scriptPath, `#!/bin/bash\nexit ${exitCode}\n`);
	fs.chmodSync(scriptPath, 0o755);
	return scriptPath;
}

void describe("extension startup", () => {
	it("registers tools inactive until initialized", async () => {
		const tempBin = fs.mkdtempSync(path.join(os.tmpdir(), "pi-grepai-bin-"));
		let cwd: string | undefined;
		const originalPath = process.env.PATH;
		try {
			process.env.PATH = tempBin + path.delimiter + (originalPath ?? "");
			createMockGrepaiScript(tempBin, 0);
			cwd = fs.mkdtempSync(path.join(os.tmpdir(), "pi-grepai-ext-"));
			const runtime = mockPi();
			registerExtension(runtime.pi as any);
			assert.ok(runtime.tools.includes("grepai_search"));
			assert.deepEqual(runtime.registeredCommands.sort(), ["grepai-init", "grepai-status", "grepai-stop", "grepai-watch"]);
			await runtime.handlers.get("session_start")?.({}, { cwd, ui: { setStatus() {}, notify() {} } });
			assert.deepEqual(runtime.active, ["read"]);
		} finally {
			if (originalPath === undefined) {
				delete process.env.PATH;
			} else {
				process.env.PATH = originalPath;
			}
			if (cwd !== undefined) {
				fs.rmSync(cwd, { recursive: true, force: true });
			}
			fs.rmSync(tempBin, { recursive: true, force: true });
		}
	});

	it("activates tools for initialized projects", async () => {
		const tempBin = fs.mkdtempSync(path.join(os.tmpdir(), "pi-grepai-bin-"));
		let cwd: string | undefined;
		const originalPath = process.env.PATH;
		try {
			process.env.PATH = tempBin + path.delimiter + (originalPath ?? "");
			createMockGrepaiScript(tempBin, 0);
			cwd = fs.mkdtempSync(path.join(os.tmpdir(), "pi-grepai-ext-"));
			fs.mkdirSync(path.join(cwd, ".grepai"));
			fs.writeFileSync(path.join(cwd, ".grepai", "config.yaml"), "ok: true\n");
			const runtime = mockPi();
			registerExtension(runtime.pi as any);
			await runtime.handlers.get("session_start")?.({}, { cwd, ui: { setStatus() {}, notify() {} } });
			assert.ok(runtime.active.includes("grepai_search"));
		} finally {
			if (originalPath === undefined) {
				delete process.env.PATH;
			} else {
				process.env.PATH = originalPath;
			}
			if (cwd !== undefined) {
				fs.rmSync(cwd, { recursive: true, force: true });
			}
			fs.rmSync(tempBin, { recursive: true, force: true });
		}
	});
});
