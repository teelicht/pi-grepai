import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, it } from "node:test";
import { formatCommandResult, type GrepaiRunResult, runGrepai } from "../../src/grepai/cli.ts";

function installMockGrepai(body: string): { cwd: string; restore: () => void } {
	const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "pi-grepai-cli-"));
	const bin = path.join(cwd, "bin");
	fs.mkdirSync(bin);
	fs.writeFileSync(path.join(bin, "grepai"), `#!/bin/sh\n${body}\n`, "utf-8");
	fs.chmodSync(path.join(bin, "grepai"), 0o755);
	const oldPath = process.env.PATH;
	process.env.PATH = `${bin}${path.delimiter}${oldPath ?? ""}`;
	return {
		cwd,
		restore: () => {
			if (oldPath === undefined) delete process.env.PATH;
			else process.env.PATH = oldPath;
			fs.rmSync(cwd, { recursive: true, force: true });
		},
	};
}

void describe("runGrepai", () => {
	it("returns stdout, stderr, code, and command", async () => {
		const mock = installMockGrepai("echo out; echo err >&2; exit 0");
		try {
			const result = await runGrepai(["status", "--no-ui"], { cwd: mock.cwd, timeoutMs: 1000 });
			assert.equal(result.stdout.trim(), "out");
			assert.equal(result.stderr.trim(), "err");
			assert.equal(result.code, 0);
			assert.deepEqual(result.args, ["status", "--no-ui"]);
		} finally {
			mock.restore();
		}
	});
	it("captures nonzero exit codes", async () => {
		const mock = installMockGrepai("echo bad >&2; exit 7");
		try {
			const result = await runGrepai(["watch", "--status"], { cwd: mock.cwd, timeoutMs: 1000 });
			assert.equal(result.code, 7);
			assert.match(result.stderr, /bad/);
		} finally {
			mock.restore();
		}
	});
	it("reports timeout as killed", async () => {
		const mock = installMockGrepai("sleep 2");
		try {
			const result = await runGrepai(["status"], { cwd: mock.cwd, timeoutMs: 10 });
			assert.equal(result.killed, true);
			assert.notEqual(result.code, 0);
		} finally {
			mock.restore();
		}
	});
	it("returns nonzero code, killed false, and error message when grepai binary is missing", async () => {
		const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "pi-grepai-cli-"));
		const oldPath = process.env.PATH;
		try {
			process.env.PATH = path.join(cwd, "bin"); // empty bin dir
			const result = await runGrepai(["status"], { cwd, timeoutMs: 1000 });
			assert.notEqual(result.code, 0, "code should be nonzero");
			assert.equal(result.killed, false, "killed should be false for missing binary");
			assert.ok(result.error, "error should be present");
			assert.ok(result.error!.includes("ENOENT") || result.error!.includes("spawn") || result.error!.includes("grepai"), "error should mention missing binary");
		} finally {
			if (oldPath === undefined) delete process.env.PATH;
			else process.env.PATH = oldPath;
			fs.rmSync(cwd, { recursive: true, force: true });
		}
	});
});

void describe("formatCommandResult", () => {
	it("formats basic output", () => {
		const result: GrepaiRunResult = { command: "grepai", args: ["status"], cwd: "/cwd", stdout: "output", stderr: "", code: 0, killed: false };
		const formatted = formatCommandResult(result);
		assert.ok(formatted.includes("$ grepai status"));
		assert.ok(formatted.includes("output"));
	});
	it("includes stderr when present", () => {
		const result: GrepaiRunResult = { command: "grepai", args: ["status"], cwd: "/cwd", stdout: "", stderr: "error message", code: 1, killed: false };
		const formatted = formatCommandResult(result);
		assert.ok(formatted.includes("stderr:"));
		assert.ok(formatted.includes("error message"));
	});
	it("formats nonzero exit code", () => {
		const result: GrepaiRunResult = { command: "grepai", args: ["status"], cwd: "/cwd", stdout: "", stderr: "", code: 7, killed: false };
		const formatted = formatCommandResult(result);
		assert.ok(formatted.includes("exit: 7"));
	});
	it("formats timeout as killed", () => {
		const result: GrepaiRunResult = { command: "grepai", args: ["status"], cwd: "/cwd", stdout: "", stderr: "", code: null, killed: true };
		const formatted = formatCommandResult(result);
		assert.ok(formatted.includes("exit:"));
		assert.ok(formatted.includes("timeout"));
	});
	it("includes error explanation when stderr is empty but error exists", () => {
		const result: GrepaiRunResult = {
			command: "grepai",
			args: ["status"],
			cwd: "/cwd",
			stdout: "",
			stderr: "",
			code: 1,
			killed: false,
			error: "ENOENT: no such file or directory",
		};
		const formatted = formatCommandResult(result);
		assert.ok(formatted.includes("ENOENT"), "should include error message");
	});
	it("formats missing binary error result", () => {
		const result: GrepaiRunResult = {
			command: "grepai",
			args: ["status"],
			cwd: "/cwd",
			stdout: "",
			stderr: "",
			code: 1,
			killed: false,
			error: "ENOENT: no such file or directory 'grepai'",
		};
		const formatted = formatCommandResult(result);
		assert.ok(formatted.includes("$ grepai status"));
		assert.ok(formatted.includes("error:"));
		assert.ok(formatted.includes("ENOENT") || formatted.includes("no such file"), "should include error explanation");
	});
});
