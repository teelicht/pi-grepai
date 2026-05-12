/** Pi extension entrypoint for pi-grepai. */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { runGrepai } from "../grepai/cli.ts";
import { registerGrepaiCommands } from "../grepai/commands.ts";
import { isGrepaiInitialized, resolveProjectRoot } from "../grepai/project-root.ts";
import { nextActiveTools } from "../grepai/tool-activation.ts";
import { createGrepaiTools } from "../grepai/tools.ts";
import { renderStatusFooter } from "../ui/status.ts";
import { createRuntimeConfigStore } from "./config-store.ts";

function resolvePackageRoot(entryDir: string): string {
	let current = entryDir;
	while (true) {
		if (fs.existsSync(path.join(current, "default-config.json"))) return current;
		const parent = path.dirname(current);
		if (parent === current) return entryDir;
		current = parent;
	}
}
function resolveUserConfigDir(): string {
	return path.join(os.homedir(), ".pi", "agent", "extensions", "pi-grepai");
}

export default function registerPiGrepai(pi: ExtensionAPI): void {
	const packageRoot = resolvePackageRoot(path.dirname(fileURLToPath(import.meta.url)));
	const configStore = createRuntimeConfigStore(packageRoot, resolveUserConfigDir());
	for (const tool of createGrepaiTools(() => configStore.getConfig())) pi.registerTool(tool);

	async function refresh(ctx: { cwd: string; ui: Pick<ExtensionContext["ui"], "setStatus"> }): Promise<void> {
		const projectRoot = await resolveProjectRoot(ctx.cwd);
		const initialized = isGrepaiInitialized(projectRoot);
		pi.setActiveTools(nextActiveTools(pi.getActiveTools(), initialized));
		let watcher: "not_initialized" | "running" | "unknown" | "error" = initialized ? "unknown" : "not_initialized";
		if (initialized && configStore.getConfig().grepai.autoStart) {
			const status = await runGrepai(["watch", "--status"], { cwd: projectRoot, timeoutMs: configStore.getConfig().grepai.commands.timeoutMs });
			watcher = status.code === 0 && /running/i.test(status.stdout + status.stderr) ? "running" : status.code === 0 ? "unknown" : "error";
			if (watcher !== "running") {
				const started = await runGrepai(["watch", "--background"], { cwd: projectRoot, timeoutMs: configStore.getConfig().grepai.commands.timeoutMs });
				watcher = started.code === 0 ? "running" : "error";
			}
		}
		ctx.ui.setStatus("grepai", renderStatusFooter({ initialized, watcher }));
	}

	pi.on("session_start", async (_event, ctx) => {
		configStore.reloadConfig();
		if (configStore.getGateState().blocked) ctx.ui.notify(configStore.getGateState().message, "error");
		await refresh(ctx);
	});
	registerGrepaiCommands(pi, () => configStore.getConfig(), refresh);
}
