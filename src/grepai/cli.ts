/** Thin grepai CLI execution wrapper. */
import { type ExecFileException, execFile } from "node:child_process";

export interface GrepaiRunOptions {
	cwd: string;
	timeoutMs: number;
	signal?: AbortSignal;
}
export interface GrepaiRunResult {
	command: "grepai";
	args: string[];
	cwd: string;
	stdout: string;
	stderr: string;
	code: number | null;
	killed: boolean;
	error?: string;
}

export function runGrepai(args: string[], options: GrepaiRunOptions): Promise<GrepaiRunResult> {
	return new Promise((resolve) => {
		execFile("grepai", args, { cwd: options.cwd, timeout: options.timeoutMs, signal: options.signal }, (error: ExecFileException | null, stdout: string, stderr: string) => {
			resolve({
				command: "grepai",
				args,
				cwd: options.cwd,
				stdout,
				stderr,
				code: error ? (typeof error.code === "number" ? error.code : 1) : 0,
				killed: Boolean(error?.killed),
				error: error?.message,
			});
		});
	});
}

export function formatCommandResult(result: GrepaiRunResult): string {
	const commandLine = [result.command, ...result.args].join(" ");
	const parts = [`$ ${commandLine}`];
	if (result.stdout.trim()) parts.push(result.stdout.trimEnd());
	if (result.stderr.trim()) parts.push(`stderr:\n${result.stderr.trimEnd()}`);
	if (result.error && !result.stderr.trim()) parts.push(`error:\n${result.error}`);
	if (result.code !== 0 || result.killed) parts.push(`exit: ${result.code ?? "null"}${result.killed ? " (timeout)" : ""}`);
	return parts.join("\n");
}
