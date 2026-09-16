# CAPTURE-TEST — 8x assignment agent capture

## Tool and model

- **Tool:** Claude Code v2.1.273 (VS Code extension, `anthropic.claude-code-2.1.273-win32-x64`), Windows 11.
- **Model:** `claude-opus-5` (Opus 5). One model does both planning and execution; there is no separate planner model. The exact ID is recorded on every RESPONSE entry from the transcript, so a mid-build switch would show up in the log.

## Mechanism

Claude Code lifecycle hooks, configured in **`.claude/settings.json`** (project-level, committed):

| Event | When it fires | What the hook does |
|---|---|---|
| `UserPromptSubmit` | every prompt | appends the verbatim `prompt` from the hook's stdin JSON |
| `Stop` | end of every assistant turn | reads `transcript_path` from stdin, parses the JSONL session transcript, and appends the final assistant text of that turn (text blocks after the last `tool_result`; thinking, tool calls and interim narration are skipped) |

Both events run the same script: **`.claude/hooks/capture.js`** (Node, no dependencies). It writes one file per session to `.agent-logs/YYYY-MM-DD_HH-MM-SS_<session-id>.md` in the requested format. It only ever appends entries; the frontmatter counters (`total_exchanges`, `last_prompt_time`, current `model`) are the one thing it rewrites. It always exits 0 so a capture failure can never block the agent; failures go to `.claude/hooks/capture-errors.log` (gitignored, along with a debug dump — `.agent-logs/` itself is **not** gitignored).

Files changed/added:

- `.claude/settings.json` — hook wiring
- `.claude/hooks/capture.js` — the capture script
- `.gitignore` — excludes only the hook's debug files
- `CAPTURE-TEST.md` — this file

## Where the canaries landed

Two separate sessions, each started fresh with `claude -p` from the repo root (headless mode runs the same hooks as interactive mode):

- `.agent-logs/2026-09-16_18-19-23_7593bb9f-663b-4f81-b9f3-153c8961ad2b.md` — session 1
- `.agent-logs/2026-09-16_18-20-31_c9c0f0f1-2e68-4df7-bb0c-db497d32cb6a.md` — session 2

Canary 1 was run with `CAPTURE_DEBUG=1` so the script dumped the raw Stop payload; the response extracted from the transcript was byte-identical to the `last_assistant_message` field that payload turned out to contain.

## Canary entries, pasted raw

### Session 1 (`7593bb9f`)

```
[LOG_ENTRY type=PROMPT num=1 session=7593bb9f]
timestamp: 2026-09-16T18:19:23.939Z
model: unknown

CAPTURE TEST — 8x assignment, Hamid Amir


[LOG_ENTRY type=RESPONSE num=1 session=7593bb9f]
timestamp: 2026-09-16T18:19:39.848Z
model: claude-opus-5

Capture test acknowledged. Here's what the hook has recorded so far for this session:

**`UserPromptSubmit` fired correctly** — `.agent-logs/2026-09-16_18-19-23_7593bb9f-663b-4f81-b9f3-153c8961ad2b.md` was created with frontmatter (`session_id`, `author: Hamidaamir`, `project: higgsfield_clone`, `total_exchanges: 1`) and `[LOG_ENTRY type=PROMPT num=1]` containing your prompt verbatim.

**One thing to note:** `model: unknown` in both the frontmatter and the PROMPT entry. That's expected on the first prompt — the `UserPromptSubmit` payload doesn't include `model`, and the transcript has no assistant messages yet for `lastModelInTranscript()` to fall back on. The `Stop` hook should fix that: `finalResponse()` picks up `message.model` from this reply (`claude-opus-5`) and line 177 rewrites the frontmatter to the latest model.

When this response finishes, verify the `Stop` event by checking the log for a `[LOG_ENTRY type=RESPONSE num=1]` block containing this text, with `total_exchanges` still `1` (RESPONSE doesn't increment the counter). If it's missing, `.claude/hooks/capture-errors.log` will show why, and `.claude/hooks/last-stdin.json` (since `CAPTURE_DEBUG` appears to be set) will have the raw Stop payload.
```

### Session 2 (`c9c0f0f1`)

```
[LOG_ENTRY type=PROMPT num=1 session=c9c0f0f1]
timestamp: 2026-09-16T18:20:31.011Z
model: opus (configured alias)

CAPTURE TEST — 8x assignment, Hamid Amir (second session)


[LOG_ENTRY type=RESPONSE num=1 session=c9c0f0f1]
timestamp: 2026-09-16T18:20:46.447Z
model: claude-opus-5

The capture is working. Your logging hook wrote this session's entry to `.agent-logs/2026-09-16_18-20-31_c9c0f0f1-2e68-4df7-bb0c-db497d32cb6a.md` with the correct session ID (`c9c0f0f1`), author (`Hamidaamir`), project (`higgsfield_clone`), and your prompt text verbatim. The earlier session's log (`7593bb9f`) is also present alongside it.

One thing to note: the repo is otherwise empty (just `.git`, `.claude`, and `.agent-logs`), so there's no assignment code here yet. Whenever you're ready to start the actual 8x assignment work, just tell me what to build.
```

## What I tried first that did not work / known gaps

1. **`model: unknown` on the very first prompt of session 1.** The `UserPromptSubmit` payload carries no model field and the transcript has no assistant message yet at that point. Between the two canaries I added a fallback to the configured model in settings (`opus`, an alias, labelled as such) — visible in session 2's PROMPT entry. The exact model ID is always on the RESPONSE entry. Session 1's entry was left as-is rather than edited.
2. **Dry-run test harness.** Before spending real sessions I fed synthetic stdin to the script against a live transcript. The first two attempts reported no transcript because the bash layer either converted the path to `/c/Users/...` (Node on Windows can't open that) or stripped the backslashes from an inline `node -e` string. Moving the harness into a `.js` file fixed it. This was a test-harness problem, not a hook problem — real hooks receive a native Windows path, which both canaries confirm.
3. **Writing the script via a bash heredoc failed** (quoting through the tool's shell wrapper); wrote it with the editor's file tool instead.
4. **The session that installed the hooks is not itself in the log.** Claude Code snapshots hook config at session start, so the setup conversation (prompt = the assignment file, response = the setup report) fired no hooks. Every session started after this commit is captured. The setup turn could be back-filled from its transcript with the same extractor if wanted, but that would be a manual, after-the-fact write, so it has not been done.
5. **`author` field.** It reads `git config agentlog.author`, falling back to `git config user.name` (`Hamidaamir`). The GitHub handle can be set with `git config agentlog.author <handle>`; existing entries are not rewritten.
