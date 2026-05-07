# pi-grepai Agent Notes

- Use TypeScript ESM with strict checking and explicit `.ts` imports.
- Keep this package a thin bridge to the installed `grepai` CLI.
- Do not install grepai, call grepai through MCP, or normalize grepai output schemas.
- Run `npm run qa` before claiming implementation is complete.
