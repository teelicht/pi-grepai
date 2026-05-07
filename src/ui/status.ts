/** Simple text status rendering for grepai. */
export type WatcherState = "not_initialized" | "running" | "stopped" | "unknown" | "error";
export interface GrepaiStatusState { projectRoot?: string; initialized: boolean; watcher: WatcherState; watchStatus?: string; grepaiStatus?: string; error?: string }
export function renderStatusFooter(state: Pick<GrepaiStatusState, "initialized" | "watcher">): string {
	if (!state.initialized) return "grepai: not initialized";
	if (state.watcher === "running") return "grepai: watcher running";
	if (state.watcher === "stopped") return "grepai: watcher stopped";
	if (state.watcher === "error") return "grepai: error";
	return "grepai: watcher unknown";
}
export function renderStatusDetail(state: GrepaiStatusState): string {
	return ["# grepai status", `Project root: ${state.projectRoot ?? "unknown"}`, `Initialized: ${state.initialized ? "yes" : "no"}`, `Watcher: ${state.watcher}`, state.error ? `Error: ${state.error}` : "", state.watchStatus ? `\n## grepai watch --status\n${state.watchStatus}` : "", state.grepaiStatus ? `\n## grepai status --no-ui\n${state.grepaiStatus}` : ""].filter(Boolean).join("\n");
}
