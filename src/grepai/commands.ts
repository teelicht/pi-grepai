/** Slash command planning and execution helpers. */
import type { ExtensionAPI, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import type { GrepaiConfig } from "../extension/config-store.ts";
import { type GrepaiStatusState, renderStatusDetail } from "../ui/status.ts";
import { formatCommandResult, runGrepai } from "./cli.ts";
import { isGrepaiInitialized, resolveProjectRoot } from "./project-root.ts";

export type GrepaiCommand = "watch" | "status" | "stop";
export interface CommandPlan {
	run: boolean;
	args: string[];
	message?: string;
}
export function commandPlan(command: GrepaiCommand, initialized: boolean): CommandPlan {
	if (command === "watch") {
		if (!initialized) return { run: false, args: [], message: "grepai is not initialized for this project. Run grepai init in your terminal first." };
		return { run: true, args: ["watch", "--background"] };
	}
	if (command === "status") return { run: true, args: ["watch", "--status"] };
	if (command === "stop") return { run: true, args: ["watch", "--stop"] };
	throw new Error(`Unhandled command: ${command}`);
}

export async function collectStatus(cwd: string, config: GrepaiConfig): Promise<GrepaiStatusState> {
	const projectRoot = await resolveProjectRoot(cwd);
	const initialized = isGrepaiInitialized(projectRoot);
	if (!initialized) return { projectRoot, initialized, watcher: "not_initialized" };
	const watch = await runGrepai(["watch", "--status"], { cwd: projectRoot, timeoutMs: config.grepai.commands.timeoutMs });
	const status = await runGrepai(["status", "--no-ui"], { cwd: projectRoot, timeoutMs: config.grepai.commands.timeoutMs });
	return {
		projectRoot,
		initialized,
		watcher: watch.code === 0 && /running/i.test(watch.stdout + watch.stderr) ? "running" : watch.code === 0 ? "unknown" : "error",
		watchStatus: formatCommandResult(watch),
		grepaiStatus: formatCommandResult(status),
		error: watch.code === 0 ? undefined : watch.error,
	};
}

export function registerGrepaiCommands(pi: ExtensionAPI, getConfig: () => GrepaiConfig, refreshSession: (ctx: ExtensionCommandContext) => Promise<void>): void {
	pi.registerCommand("grepai-watch", {
		description: "Start grepai watch --background",
		async handler(_args, ctx) {
			const projectRoot = await resolveProjectRoot(ctx.cwd);
			const plan = commandPlan("watch", isGrepaiInitialized(projectRoot));
			if (!plan.run) return ctx.ui.notify(plan.message ?? "grepai command refused", "warning");
			const result = await runGrepai(plan.args, { cwd: projectRoot, timeoutMs: getConfig().grepai.commands.timeoutMs });
			ctx.ui.notify(formatCommandResult(result), result.code === 0 ? "info" : "error");
			await refreshSession(ctx);
		},
	});
	pi.registerCommand("grepai-status", {
		description: "Show read-only grepai status",
		async handler(_args, ctx) {
			ctx.ui.notify(renderStatusDetail(await collectStatus(ctx.cwd, getConfig())), "info");
		},
	});
	pi.registerCommand("grepai-stop", {
		description: "Stop grepai watch --background",
		async handler(_args, ctx) {
			const projectRoot = await resolveProjectRoot(ctx.cwd);
			const result = await runGrepai(["watch", "--stop"], { cwd: projectRoot, timeoutMs: getConfig().grepai.commands.timeoutMs });
			ctx.ui.notify(formatCommandResult(result), result.code === 0 ? "info" : "error");
			await refreshSession(ctx);
		},
	});
}
