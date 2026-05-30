# Agent guide

Token optimization runs **before every LLM interaction** via `.cursor/hooks.json`.

## Hook coverage

| When | Hook | Guard |
|------|------|-------|
| User Send | `beforeSubmitPrompt` | Prompt size, attachment count, binary/large files |
| Every tool | `preToolUse` | Read/Grep/Glob/Task/Shell/SemanticSearch/Web* |
| File read | `beforeReadFile` | Max 200 lines/chunk (`failClosed`) |
| Shell | `beforeShellExecution` | cat/find/grep/git/pager blocks (`failClosed`) |
| MCP | `beforeMCPExecution` | Ask before media-heavy MCP tools |
| Tab completion | `beforeTabFileRead` | Binary + oversized file blocks |
| After Read/Grep | `postToolUse` | Duplicate tool-use warnings |
| Subagents | `subagentStart` | 2 explore + 3 generalPurpose max |
| Compaction | `preCompact` | Reuse-context reminder |
| Session start | `sessionStart` | Compact repo map + cached config env |
| Session end | `sessionEnd` | Purge stale state (24h TTL) |

## Config

All thresholds: `.cursor/token-budget.json`

Shared hook library: `.cursor/hooks/lib/common.sh`

Always-on rule: `.cursor/rules/token-efficiency.mdc`

## Workflow

1. `Grep` / `Glob` / `SemanticSearch` → locate targets
2. `Read` with `offset` + `limit` → smallest slice
3. Edit only required files
4. `Task` only for multi-area audits
