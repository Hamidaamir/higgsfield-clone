# Codex automatic capture

`capture.py` polls the native `%USERPROFILE%/.codex/sessions` store every second.
It selects only this repository's working directory and sessions at or after
`config.json`'s handoff timestamp. No API credentials or reasoning/tool records
are exported. Source timestamps, prompt text, final response text and per-turn
model IDs are retained. Legacy event prompts and newer `user.text` messages
are supported; final phases `final` and `final_answer` are accepted.

`install.ps1` starts a hidden Python watcher and installs the per-user Windows
Startup shortcut `Higgsfield Codex Capture.lnk`. Run the installer once on each
Windows machine after cloning (Python with pythonw.exe is required). Capture
then runs independently of the agent, including across new Codex sessions and
Windows logins. The repository must stay at the installed location; reinstall
after moving it. Ephemeral sessions cannot be captured. While the watcher is
stopped, native transcripts remain available for automatic catch-up on restart.

Existing entry bytes are checked as a prefix before any update. Only Codex
frontmatter counters/current model are refreshed; old entry bodies cannot be
rewritten. Files belonging to Claude are never selected. A single-process lock
prevents duplicate watchers. Diagnostics and heartbeat are under ignored
`runtime/`; submission logs are tracked in `.agent-logs/`.

`python scripts/codex-capture/verify.py` checks the original-file hashes, raw
canary equality and watcher heartbeat without running the exporter.

The current setup session is captured from its native transcript too. Its final
response will arrive automatically after the turn ends. Commit growing Codex
logs alongside subsequent work. No application work was performed for setup.
