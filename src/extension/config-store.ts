/** Runtime configuration loading for pi-grepai. */
import * as fs from "node:fs";
import * as path from "node:path";

export interface GrepaiConfig {
	grepai: { autoStart: boolean; output: { format: "json" | "text"; compact: boolean }; commands: { timeoutMs: number } };
}

export interface ConfigDiagnostic { level: "error" | "warning"; code: string; path: string; message: string }
export interface ConfigGateState { blocked: boolean; diagnostics: ConfigDiagnostic[]; message: string; configPath?: string; examplePath?: string }
export interface LoadedConfigState { config: GrepaiConfig; blocked: boolean; diagnostics: ConfigDiagnostic[]; message: string; configPath: string; examplePath: string; asGateState(): ConfigGateState }
export interface RuntimeConfigStore { getConfig(): GrepaiConfig; getGateState(): ConfigGateState; reloadConfig(): void }

const FALLBACK_CONFIG: GrepaiConfig = { grepai: { autoStart: true, output: { format: "json", compact: true }, commands: { timeoutMs: 30000 } } };

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function readJson(filePath: string): unknown { if (!fs.existsSync(filePath)) return undefined; return JSON.parse(fs.readFileSync(filePath, "utf-8")); }
function mergeConfig(base: GrepaiConfig, override: unknown): GrepaiConfig {
	if (!isRecord(override)) return base;
	const grepai = isRecord(override.grepai) ? override.grepai : {};
	const output = isRecord(grepai.output) ? grepai.output : {};
	const commands = isRecord(grepai.commands) ? grepai.commands : {};
	const format = output.format === "text" || output.format === "json" ? output.format : base.grepai.output.format;
	return {
		grepai: {
			autoStart: typeof grepai.autoStart === "boolean" ? grepai.autoStart : base.grepai.autoStart,
			output: { format, compact: typeof output.compact === "boolean" ? output.compact : base.grepai.output.compact },
			commands: { timeoutMs: typeof commands.timeoutMs === "number" && commands.timeoutMs > 0 ? commands.timeoutMs : base.grepai.commands.timeoutMs },
		},
	};
}

export function loadRuntimeConfigState(packageConfigDir: string, userConfigDir = packageConfigDir): LoadedConfigState {
	const defaultPath = path.join(packageConfigDir, "default-config.json");
	const configPath = path.join(userConfigDir, "config.json");
	const examplePath = path.join(userConfigDir, "config.example.json");
	try {
		const defaults = mergeConfig(FALLBACK_CONFIG, readJson(defaultPath));
		const config = mergeConfig(defaults, readJson(configPath));
		return { config, blocked: false, diagnostics: [], message: "", configPath, examplePath, asGateState() { return { blocked: this.blocked, diagnostics: this.diagnostics, message: this.message, configPath: this.configPath, examplePath: this.examplePath }; } };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		const diagnostics = [{ level: "error" as const, code: "config_load_failed", path: "config.json", message }];
		return { config: FALLBACK_CONFIG, blocked: true, diagnostics, message, configPath, examplePath, asGateState() { return { blocked: this.blocked, diagnostics: this.diagnostics, message: this.message, configPath: this.configPath, examplePath: this.examplePath }; } };
	}
}

function assignGate(state: LoadedConfigState, target?: ConfigGateState): ConfigGateState {
	const gate = target ?? { blocked: false, diagnostics: [], message: "" };
	gate.blocked = state.blocked; gate.diagnostics = state.diagnostics; gate.message = state.message; gate.configPath = state.configPath; gate.examplePath = state.examplePath;
	return gate;
}

export function createRuntimeConfigStore(packageConfigDir: string, userConfigDir = packageConfigDir): RuntimeConfigStore {
	let current = loadRuntimeConfigState(packageConfigDir, userConfigDir);
	const gate = assignGate(current);
	return { getConfig: () => current.config, getGateState: () => gate, reloadConfig() { current = loadRuntimeConfigState(packageConfigDir, userConfigDir); assignGate(current, gate); } };
}
