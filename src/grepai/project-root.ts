/** Project-root and grepai initialization detection. */
import * as fs from "node:fs";
import * as path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function resolveProjectRoot(cwd: string): Promise<string> {
	try {
		const result = await execFileAsync("git", ["rev-parse", "--show-toplevel"], { cwd });
		return result.stdout.trim() || cwd;
	} catch {
		return cwd;
	}
}

export function grepaiConfigPath(projectRoot: string): string { return path.join(projectRoot, ".grepai", "config.yaml"); }
export function isGrepaiInitialized(projectRoot: string): boolean { return fs.existsSync(grepaiConfigPath(projectRoot)); }
