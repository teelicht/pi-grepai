import assert from "node:assert/strict";
import * as fs from "node:fs";
import { describe, it } from "node:test";

void describe("package manifest", () => {
	it("declares the Pi package entrypoint and MIT metadata", () => {
		const manifest = JSON.parse(fs.readFileSync("package.json", "utf-8"));
		assert.equal(manifest.name, "@teelicht/pi-grepai");
		assert.equal(manifest.version, "0.1.0");
		assert.equal(manifest.type, "module");
		assert.equal(manifest.license, "MIT");
		assert.deepEqual(manifest.pi.extensions, ["./src/extension/index.ts"]);
		assert.ok(manifest.keywords.includes("pi-package"));
		assert.equal(manifest.publishConfig.access, "public");
		assert.equal(manifest.publishConfig.registry, undefined);
		assert.ok(manifest.files.includes("docs/tools.md"));
		assert.ok(manifest.files.includes("CHANGELOG.md"));
		assert.ok(!manifest.files.includes("docs/"), "package should not publish docs/superpowers planning artifacts");
		assert.equal(manifest.scripts["test:integration"], "node --experimental-strip-types --test test/integration/*.test.ts");
	});
});
