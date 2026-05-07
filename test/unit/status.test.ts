import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderStatusDetail, renderStatusFooter } from "../../src/ui/status.ts";

void describe("status rendering", () => {
	it("distinguishes not initialized", () => {
		assert.equal(renderStatusFooter({ initialized: false, watcher: "unknown" }), "grepai: not initialized");
	});
	it("renders footer for initialized running", () => {
		assert.equal(renderStatusFooter({ initialized: true, watcher: "running" }), "grepai: watcher running");
	});
	it("renders footer for stopped", () => {
		assert.equal(renderStatusFooter({ initialized: true, watcher: "stopped" }), "grepai: watcher stopped");
	});
	it("renders footer for error", () => {
		assert.equal(renderStatusFooter({ initialized: true, watcher: "error" }), "grepai: error");
	});
	it("renders footer for unknown", () => {
		assert.equal(renderStatusFooter({ initialized: true, watcher: "unknown" }), "grepai: watcher unknown");
	});
	it("renders footer for not_initialized", () => {
		assert.equal(renderStatusFooter({ initialized: true, watcher: "not_initialized" }), "grepai: watcher unknown");
	});
	it("renders read-only detail output", () => {
		const detail = renderStatusDetail({ projectRoot: "/repo", initialized: true, watcher: "running", watchStatus: "watch ok", grepaiStatus: "index ok" });
		assert.match(detail, /Project root: \/repo/);
		assert.match(detail, /Watcher: running/);
		assert.match(detail, /watch ok/);
		assert.doesNotMatch(detail, /interactive UI/i);
	});
	it("excludes watch and status sections when watchStatus omitted", () => {
		const detail = renderStatusDetail({ projectRoot: "/repo", initialized: true, watcher: "running", grepaiStatus: "index ok" });
		assert.match(detail, /Project root: \/repo/);
		assert.doesNotMatch(detail, /## grepai watch --status/);
		assert.match(detail, /## grepai status --no-ui/);
	});
	it("excludes watch and status sections when both omitted", () => {
		const detail = renderStatusDetail({ projectRoot: "/repo", initialized: true, watcher: "running" });
		assert.match(detail, /Project root: \/repo/);
		assert.doesNotMatch(detail, /## grepai watch --status/);
		assert.doesNotMatch(detail, /## grepai status --no-ui/);
	});
	it("includes error when present", () => {
		const detail = renderStatusDetail({ projectRoot: "/repo", initialized: true, watcher: "error", error: "something went wrong" });
		assert.match(detail, /Error: something went wrong/);
	});
	it("excludes error line when absent", () => {
		const detail = renderStatusDetail({ projectRoot: "/repo", initialized: true, watcher: "running" });
		assert.doesNotMatch(detail, /^Error:/m);
	});
});
