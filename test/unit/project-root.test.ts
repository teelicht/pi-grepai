import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, it } from "node:test";
import { isGrepaiInitialized, resolveProjectRoot } from "../../src/grepai/project-root.ts";

function tempProject(): string { return fs.mkdtempSync(path.join(os.tmpdir(), "pi-grepai-project-")); }

function rmrf(dir: string): void {
	try {
		fs.rmSync(dir, { recursive: true, force: true });
	} catch { /* ignore */ }
}

void describe("project root", () => {
	it("falls back to cwd when not inside a git repo", async () => {
		const cwd = tempProject();
		try {
			assert.equal(await resolveProjectRoot(cwd), cwd);
		} finally {
			rmrf(cwd);
		}
	});
	it("uses git top-level when available", async () => {
		const root = tempProject();
		fs.mkdirSync(path.join(root, "nested"));
		await import("node:child_process").then(({ execFileSync }) => execFileSync("git", ["init"], { cwd: root, stdio: "ignore" }));
		try {
			assert.equal(await resolveProjectRoot(path.join(root, "nested")), fs.realpathSync(root));
		} finally {
			rmrf(root);
		}
	});
	it("detects .grepai/config.yaml", () => {
		const root = tempProject();
		fs.mkdirSync(path.join(root, ".grepai"));
		try {
			assert.equal(isGrepaiInitialized(root), false);
			fs.writeFileSync(path.join(root, ".grepai", "config.yaml"), "provider: test\n");
			assert.equal(isGrepaiInitialized(root), true);
		} finally {
			rmrf(root);
		}
	});
});
