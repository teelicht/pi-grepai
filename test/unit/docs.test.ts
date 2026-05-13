import assert from "node:assert/strict";
import * as fs from "node:fs";
import { describe, it } from "node:test";

void describe("docs", () => {
	it("documents commands, tools, config, non-goals, and release steps", () => {
		for (const file of ["README.md", "docs/configuration.md", "docs/commands.md", "docs/tools.md", "docs/releases.md"])
			assert.equal(fs.existsSync(file), true, `${file} should exist`);
		const readme = fs.readFileSync("README.md", "utf-8");
		assert.match(readme, /does not install grepai/i);
		assert.match(readme, /grepai init/i);
		assert.match(readme, /pi install npm:@teelicht\/pi-grepai/);
		assert.doesNotMatch(readme, /npm\.pkg\.github\.com/);
		const toolsDoc = fs.readFileSync("docs/tools.md", "utf-8");
		assert.match(toolsDoc, /grepai_search/);
		assert.match(toolsDoc, /Required Params/);
		assert.doesNotMatch(toolsDoc, /`grepai_refs_readers` \| `symbol`/);
		assert.doesNotMatch(toolsDoc, /`grepai_rpg_explore` \| `id`/);
		assert.match(toolsDoc, /temporarily disabled/i);
		assert.match(toolsDoc, /stdout and stderr pass through directly/i);
		assert.match(toolsDoc, /No schema normalization is performed/i);
		assert.match(toolsDoc, /installed GrepAI skills/i);
		assert.match(toolsDoc, /CLI-backed GrepAI tool surface/i);
	});

	it("README quick start does not suggest running both grepai init and /grepai-init", () => {
		const readme = fs.readFileSync("README.md", "utf-8");
		const quickStart = readme.match(/## Quick start\n([\s\S]*?)(?=\n## |\n#|$)/)?.[1] ?? "";
		// Should not say "run grepai init then /grepai-init" as separate steps
		assert.ok(
			!/run `grepai init`.*then.*\/grepai-init/s.test(quickStart) && !/first.*`grepai init`.*\/grepai-init/s.test(quickStart),
			"README should not suggest running both commands sequentially",
		);
	});

	it("README documents manual grepai init and does not mention /grepai-init", () => {
		const readme = fs.readFileSync("README.md", "utf-8");
		assert.match(readme, /grepai init/i);
		assert.doesNotMatch(readme, /\/grepai-init/i);
		assert.doesNotMatch(fs.readFileSync("docs/commands.md", "utf-8"), /\/grepai-init/i);
		assert.doesNotMatch(fs.readFileSync("docs/tools.md", "utf-8"), /\/grepai-init/i);
	});

	it("configuration.md notes output config fields are v1 parsed but not dynamically applied by current tools", () => {
		const config = fs.readFileSync("docs/configuration.md", "utf-8");
		// Check that grepai.output.format is documented
		assert.match(config, /grepai\.output\.format/);
		// Check that grepai.output.compact is documented
		assert.match(config, /grepai\.output\.compact/);
		// Check there's a note about current tools not dynamically applying these
		assert.match(config, /does not dynamically apply|not dynamically applied|current.*tools.*do not apply|tools.*do not dynamically/i);
	});

	it("documents npmjs.com trusted publishing automation", () => {
		const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));
		assert.equal(packageJson.publishConfig.access, "public");
		assert.equal(packageJson.publishConfig.registry, undefined);
		assert.equal(fs.existsSync(".npmrc"), false);
		const releases = fs.readFileSync("docs/releases.md", "utf-8");
		assert.match(releases, /npmjs\.com/);
		assert.match(releases, /trusted publishing/i);
		assert.match(releases, /Workflow filename: `release\.yml`/);
		assert.match(releases, /id-token: write/);
		assert.match(releases, /npm publish --access public/);
		assert.doesNotMatch(releases, /NPM_TOKEN secret/);
		assert.doesNotMatch(releases, /GitHub Packages/);
	});
});
