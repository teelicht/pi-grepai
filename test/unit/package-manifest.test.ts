import assert from "node:assert/strict";
import * as fs from "node:fs";
import { describe, it } from "node:test";

void describe("package manifest", () => {
	it("declares the Pi package entrypoint and MIT metadata", () => {
		const manifest = JSON.parse(fs.readFileSync("package.json", "utf-8"));
		assert.equal(manifest.name, "@teelicht/pi-grepai");
		assert.equal(manifest.type, "module");
		assert.equal(manifest.license, "MIT");
		assert.deepEqual(manifest.pi.extensions, ["./src/extension/index.ts"]);
		assert.ok(manifest.keywords.includes("pi-package"));
	});
});
