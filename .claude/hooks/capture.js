#!/usr/bin/env node
/*
 * Agent capture hook for Claude Code (8x assignment).
 *
 * Wired in .claude/settings.json to two lifecycle events:
 *   - UserPromptSubmit : appends the verbatim prompt to the session log
 *   - Stop             : reads the session transcript (path arrives on stdin)
 *                        and appends the FINAL assistant text of that turn
 *
 * Writes one file per session to .agent-logs/YYYY-MM-DD_HH-MM-SS_<session-id>.md
 * in the format the assignment specifies. Never edits existing entries; only
 * the frontmatter counters (total_exchanges / last_prompt_time) are rewritten.
 *
 * Always exits 0 so a capture failure never blocks the agent. Errors go to
 * .claude/hooks/capture-errors.log.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const LOG_DIR = path.join(PROJECT_DIR, ".agent-logs");
const ERR_LOG = path.join(PROJECT_DIR, ".claude", "hooks", "capture-errors.log");
const TOOL = "claude-code";

function logError(msg) {
  try {
    fs.mkdirSync(path.dirname(ERR_LOG), { recursive: true });
    fs.appendFileSync(ERR_LOG, new Date().toISOString() + " " + msg + "\n");
  } catch (_) { /* nothing left to do */ }
}

function readStdin() {
  try { return fs.readFileSync(0, "utf8"); } catch (_) { return ""; }
}

function gitConfig(key) {
  try {
    return execSync("git config --get " + key, { cwd: PROJECT_DIR, stdio: ["ignore", "pipe", "ignore"] })
      .toString().trim();
  } catch (_) { return ""; }
}

// GitHub handle for the log header. Set with: git config agentlog.author <handle>
function author() {
  return process.env.AGENT_LOG_AUTHOR || gitConfig("agentlog.author") || gitConfig("user.name") || "unknown";
}

function projectName() {
  return process.env.AGENT_LOG_PROJECT || path.basename(PROJECT_DIR);
}

// ---- transcript parsing ----------------------------------------------------

function readTranscript(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return [];
  const out = [];
  for (const line of fs.readFileSync(transcriptPath, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch (_) { /* partial line at EOF */ }
  }
  // Main thread only: subagent transcripts are marked isSidechain.
  return out.filter((e) => !e.isSidechain);
}

function blocks(entry) {
  const c = entry && entry.message && entry.message.content;
  if (typeof c === "string") return [{ type: "text", text: c }];
  return Array.isArray(c) ? c : [];
}

function isHumanPrompt(entry) {
  if (entry.type !== "user" || entry.isMeta) return false;
  const b = blocks(entry);
  return b.length > 0 && !b.some((x) => x.type === "tool_result");
}

// The final response for the current turn: every assistant text block that
// comes after the last tool_result following the last human prompt. That
// skips thinking, tool calls, and interim narration between tool calls.
function finalResponse(entries) {
  let lastPrompt = -1;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (isHumanPrompt(entries[i])) { lastPrompt = i; break; }
  }
  const turn = entries.slice(lastPrompt + 1);
  let lastToolResult = -1;
  turn.forEach((e, i) => {
    if (e.type === "user" && blocks(e).some((x) => x.type === "tool_result")) lastToolResult = i;
  });
  const tail = turn.slice(lastToolResult + 1).filter((e) => e.type === "assistant");
  const texts = [];
  let model = "";
  for (const e of tail) {
    if (e.message && e.message.model) model = e.message.model;
    for (const b of blocks(e)) if (b.type === "text" && b.text) texts.push(b.text);
  }
  return { text: texts.join("\n\n").trim(), model };
}

function lastModelInTranscript(entries) {
  for (let i = entries.length - 1; i >= 0; i--) {
    const m = entries[i].message && entries[i].message.model;
    if (entries[i].type === "assistant" && m) return m;
  }
  return "";
}

// Before the first assistant message exists, the only signal is the configured
// model (project settings, then user settings). Usually an alias like "opus";
// the exact id then appears on the RESPONSE entry.
function configuredModel() {
  const candidates = [
    path.join(PROJECT_DIR, ".claude", "settings.local.json"),
    path.join(PROJECT_DIR, ".claude", "settings.json"),
    path.join(require("os").homedir(), ".claude", "settings.json"),
  ];
  for (const f of candidates) {
    try {
      const m = JSON.parse(fs.readFileSync(f, "utf8")).model;
      if (m) return m + " (configured alias)";
    } catch (_) { /* missing or unparsable */ }
  }
  return "";
}

// ---- log file handling -----------------------------------------------------

function findLogFile(sessionId) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const hit = fs.readdirSync(LOG_DIR).find((f) => f.endsWith("_" + sessionId + ".md"));
  return hit ? path.join(LOG_DIR, hit) : null;
}

function newLogFile(sessionId, nowIso) {
  const d = new Date(nowIso);
  const p = (n) => String(n).padStart(2, "0");
  const stamp = d.getUTCFullYear() + "-" + p(d.getUTCMonth() + 1) + "-" + p(d.getUTCDate()) + "_" +
    p(d.getUTCHours()) + "-" + p(d.getUTCMinutes()) + "-" + p(d.getUTCSeconds());
  return path.join(LOG_DIR, stamp + "_" + sessionId + ".md");
}

function splitFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { fm: {}, body: content };
  const fm = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { fm, body: m[2] };
}

function renderFrontmatter(fm) {
  const keys = ["session_id", "date", "author", "model", "tool", "project",
    "total_exchanges", "first_prompt_time", "last_prompt_time"];
  return "---\n" + keys.map((k) => k + ": " + (fm[k] == null ? "" : fm[k])).join("\n") + "\n---\n";
}

function countPrompts(body) {
  return (body.match(/^\[LOG_ENTRY type=PROMPT /gm) || []).length;
}

function appendEntry({ sessionId, type, text, model, nowIso }) {
  let file = findLogFile(sessionId);
  let fm, body;
  const short = sessionId.slice(0, 8);
  if (file) {
    // Tolerate CRLF in case git autocrlf has touched the file.
    ({ fm, body } = splitFrontmatter(fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n")));
  } else {
    file = newLogFile(sessionId, nowIso);
    fm = {
      session_id: sessionId,
      date: nowIso.slice(0, 10),
      author: author(),
      model: model || "unknown",
      tool: TOOL,
      project: projectName(),
      total_exchanges: 0,
      first_prompt_time: nowIso,
      last_prompt_time: nowIso,
    };
    body = "\n# Session Log - " + fm.date + "\n\n" +
      "Session: `" + short + "` | Project: `" + fm.project + "` | Author: `" + fm.author + "`\n\n---\n";
  }

  let num;
  if (type === "PROMPT") {
    num = countPrompts(body) + 1;
    fm.last_prompt_time = nowIso;
  } else {
    num = Math.max(countPrompts(body), 1);
  }
  fm.total_exchanges = countPrompts(body) + (type === "PROMPT" ? 1 : 0);
  if (model && fm.model !== model) fm.model = model; // header shows the latest model in use

  const entry =
    "\n[LOG_ENTRY type=" + type + " num=" + num + " session=" + short + "]\n" +
    "timestamp: " + nowIso + "\n" +
    "model: " + (model || "unknown") + "\n\n" +
    text + "\n\n";

  fs.writeFileSync(file, renderFrontmatter(fm) + body + entry, "utf8");
  return file;
}

// ---- main ------------------------------------------------------------------

function main() {
  const raw = readStdin();
  let input;
  try { input = JSON.parse(raw); } catch (e) {
    logError("bad stdin JSON: " + raw.slice(0, 200));
    return;
  }
  if (process.env.CAPTURE_DEBUG) {
    fs.writeFileSync(path.join(PROJECT_DIR, ".claude", "hooks", "last-stdin.json"), raw);
  }

  const event = input.hook_event_name;
  const sessionId = input.session_id || "unknown-session";
  const nowIso = new Date().toISOString();
  const entries = readTranscript(input.transcript_path);

  if (event === "UserPromptSubmit") {
    const model = input.model || lastModelInTranscript(entries) || process.env.ANTHROPIC_MODEL ||
      configuredModel() || "unknown";
    appendEntry({ sessionId, type: "PROMPT", text: String(input.prompt == null ? "" : input.prompt), model, nowIso });
  } else if (event === "Stop") {
    const { text, model } = finalResponse(entries);
    // Stop payloads also carry last_assistant_message; use it if the transcript gave nothing.
    const fallback = typeof input.last_assistant_message === "string" ? input.last_assistant_message.trim() : "";
    appendEntry({
      sessionId, type: "RESPONSE",
      text: text || fallback || "(no final text response captured for this turn)",
      model: model || input.model || lastModelInTranscript(entries) || "unknown",
      nowIso,
    });
  } else {
    logError("unhandled event: " + event);
  }
}

try { main(); } catch (e) { logError((e && e.stack) || String(e)); }
process.exit(0);
