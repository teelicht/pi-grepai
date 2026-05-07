import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { commandPlan } from "../../src/grepai/commands.ts";

void describe("command plans", () => {
	it("grepai-watch refuses uninitialized projects", () => {
		assert.deepEqual(commandPlan("watch", false), { run: false, args: [], message: "grepai is not initialized for this project. Run /grepai-init first." });
	});
	it("maps commands to exact CLI args", () => {
		assert.deepEqual(commandPlan("init", false).args, ["init"]);
		assert.deepEqual(commandPlan("watch", true).args, ["watch", "--background"]);
		assert.deepEqual(commandPlan("stop", true).args, ["watch", "--stop"]);
		assert.deepEqual(commandPlan("status", false).args, ["watch", "--status"]);
		assert.deepEqual(commandPlan("status", true).args, ["watch", "--status"]);
	});
	it("throws on unknown commands", () => {
		assert.throws(() => (commandPlan as unknown as (cmd: string, init: boolean) => unknown)("unknown" as any, true));
	});
});
