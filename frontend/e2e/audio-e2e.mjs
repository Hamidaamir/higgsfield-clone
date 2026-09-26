// Browser-level check of the text-to-speech workflow against the local stack with the
// backend in USE_FAKE_PROVIDERS mode (no Cloudflare/Gemini quota is used).
import { chromium } from "playwright";

const base = process.env.E2E_BASE ?? "http://127.0.0.1:3000";
const shots = process.argv[2];
const email = `audio-${Date.now()}@example.com`;
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const consoleErrors = [];
const httpFailures = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(String(e)));
page.on("response", (r) => {
  if (r.status() >= 400) httpFailures.push(`${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}`);
});

const audioMeta = (locator) =>
  locator.evaluate((a) => new Promise((res) => {
    const done = () => res({ duration: a.duration, controls: a.controls, autoplay: a.autoplay, paused: a.paused });
    if (a.readyState >= 1) done(); else { a.onloadedmetadata = done; a.onerror = () => res({ error: a.error?.code }); }
  }));

await page.goto(`${base}/generate/audio`);
await page.waitForURL(/\/login\?next=%2Fgenerate%2Faudio/);
check("anonymous /generate/audio redirects to login", true);

await page.goto(`${base}/signup?next=%2Fgenerate%2Faudio`, { waitUntil: "networkidle" });
await page.fill("#signup-name", "Audio Tester");
await page.fill("#signup-email", email);
await page.fill("#signup-password", "passw0rd1");
await page.check("#signup-terms");
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL(/\/generate\/audio$/);
await page.waitForSelector("text=Give the words a voice.");
const form = page.getByRole("form", { name: "Speech generator" });
const generate = form.locator('button[type="submit"]');
const model = form.getByRole("button", { name: "Model", exact: true });
const voicePicker = form.getByRole("button", { name: "Voice", exact: true });
const languagePicker = form.getByRole("button", { name: "Language", exact: true });
const batch = form.getByRole("group", { name: "Number of takes" });
const more = form.getByRole("button", { name: "More takes" });
const fewer = form.getByRole("button", { name: "Fewer takes" });
const selectModel = async (name) => {
  await model.click();
  await page.getByRole("option", { name }).click();
  await page.waitForTimeout(150);
};

check("workspace renders the creation rail", (await page.locator('form[aria-label="Speech generator"]').count()) === 1);
check("workspace header identifies the studio", (await page.getByRole("heading", { name: "Audio Studio" }).count()) === 1);
check("generate disabled with empty script", await generate.isDisabled());
check("no credit messaging in the rail", !/credit/i.test(await form.innerText()));
check("empty state shows no fake audio player", (await page.locator("audio").count()) === 0);
await page.screenshot({ path: `${shots}/50-audio-empty.png` });

// --- Registry drives the model list ------------------------------------------------------------
const registry = await (await page.request.get(`${base}/api/models?type=audio`)).json();
await model.click();
const listed = await page.locator('[role="option"]').allInnerTexts();
check(
  "model picker is registry-driven",
  listed.length === registry.length && registry.every((m) => listed.some((t) => t.includes(m.name))),
  `${listed.length} options vs ${registry.length} models`,
);
await page.keyboard.press("Escape");
const spec = (id) => registry.find((m) => m.id === id);

// --- Capability gating per model ---------------------------------------------------------------
// Which controls appear is derived from registry capabilities, so no model is ever offered a
// setting it cannot honour (the API rejects such requests with a 400).
for (const id of ["aura-1", "melotts", "gemini-tts"]) {
  const m = spec(id);
  await selectModel(new RegExp(m.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  const hasVoice = (await voicePicker.count()) === 1;
  const hasLanguage = (await languagePicker.count()) === 1;
  const hasStyle = (await page.locator("#audio-style").count()) === 1;
  check(
    `${m.name}: controls match registry capabilities`,
    hasVoice === (m.voices.length > 0) && hasLanguage === (m.languages.length > 0) && hasStyle === m.supports_style_prompt,
    `voice=${hasVoice}/${m.voices.length > 0} language=${hasLanguage}/${m.languages.length > 0} style=${hasStyle}/${m.supports_style_prompt}`,
  );
  check(`${m.name}: batch ceiling matches registry`, (await batch.innerText()).includes(`/${m.max_batch}`), await batch.innerText());
}

// --- Model transitions clamp batch in both directions -------------------------------------------
await selectModel(/MeloTTS/); // max 4
for (let i = 1; i < spec("melotts").max_batch; i += 1) await more.click();
check("batch can reach the MeloTTS maximum", (await batch.innerText()).includes(`${spec("melotts").max_batch}/${spec("melotts").max_batch}`));
await selectModel(/Gemini TTS/); // max 1
check("MeloTTS → Gemini clamps the batch to the new ceiling", (await batch.innerText()).includes("1/1"), await batch.innerText());
check("Gemini → batch cannot be raised past its ceiling", await more.isDisabled());
await selectModel(/Aura 1/); // max 2
check("Gemini → Aura clamps the batch to Aura's ceiling", (await batch.innerText()).includes("2/2"), await batch.innerText());
check("Gemini → Aura falls back to Aura's default voice", (await voicePicker.innerText()).includes("Luna"), await voicePicker.innerText());
await fewer.click();
check("batch can be lowered again", (await batch.innerText()).includes("1/2"), await batch.innerText());

// --- Script validation ---------------------------------------------------------------------------
await page.fill("#audio-script", "   ");
check("whitespace-only script cannot be submitted", await generate.isDisabled());
await page.fill("#audio-script", "x".repeat(2050));
check("over-limit script blocks submission", await generate.isDisabled());
check(
  "over-limit script explains the 2000-character limit",
  (await form.locator('[role="alert"]').innerText()).includes("Scripts are limited to 2000 characters."),
);
check("counter appears near the limit", (await form.innerText()).includes("2050/2000"));
await page.screenshot({ path: `${shots}/58-audio-script-limit.png` });
await page.fill("#audio-script", "x".repeat(1999));
check("script at the limit is accepted", await generate.isEnabled());
await page.fill("#audio-script", "");

// The request must carry only settings the selected model supports. Capture each payload.
let lastBody = null;
await page.route("**/api/generations/audio", async (route) => {
  lastBody = route.request().postDataJSON();
  await route.continue();
});

// --- Aura take: voice, no language, no style ------------------------------------------------------
await voicePicker.click();
await page.getByRole("option", { name: /Orion/ }).click();
await page.fill("#audio-script", "[slow] A short line read by Orion.");
await generate.click();
await page.waitForSelector('[role="status"]', { timeout: 10000 });
check("processing state shown immediately", /queued|generating/i.test(await page.locator('[role="status"]').first().innerText()));
check("pending audio uses a compact row, not an image-shaped plate", await page.locator('[role="status"]').first().evaluate((el) => el.clientHeight < 80));
await page.screenshot({ path: `${shots}/51-audio-processing.png` });
check(
  "Aura request carries a voice and no language or style",
  lastBody?.voice === "orion" && !lastBody?.language && !lastBody?.style_prompt,
  JSON.stringify(lastBody),
);
const auraGroup = page.locator('article[aria-label*="read by Orion"]');
await auraGroup.locator("audio").first().waitFor({ timeout: 45000 });
const meta = await audioMeta(auraGroup.locator("audio").first());
check("audio player renders, decodes, no autoplay", meta.duration > 0 && meta.controls && !meta.autoplay && meta.paused, JSON.stringify(meta));
check("take metadata shows the voice", (await auraGroup.innerText()).includes("Orion"));
check("a single take is not numbered", !/^01$/m.test(await auraGroup.innerText()));
await page.screenshot({ path: `${shots}/52-audio-completed.png` });

// Playback happens only on a deliberate action.
await auraGroup.locator("audio").first().evaluate((a) => a.play());
await page.waitForTimeout(400);
check("a take plays when asked", await auraGroup.locator("audio").first().evaluate((a) => !a.paused && a.currentTime > 0));
await auraGroup.locator("audio").first().evaluate((a) => a.pause());

// --- MeloTTS take: language, and no voice leaked from Aura ----------------------------------------
await selectModel(/MeloTTS/);
await languagePicker.click();
await page.getByRole("option", { name: "French" }).click();
await page.fill("#audio-script", "Une ligne lue en francais.");
await generate.click();
const meloGroup = page.locator('article[aria-label*="lue en francais"]');
await meloGroup.locator("audio").first().waitFor({ timeout: 45000 });
check(
  "MeloTTS request carries a language and no stale Aura voice",
  lastBody?.language === "fr" && !lastBody?.voice,
  JSON.stringify(lastBody),
);
check("take metadata shows the language", (await meloGroup.innerText()).includes("French"));

// --- Gemini take: style prompt, and no stale MeloTTS language ------------------------------------
await selectModel(/Gemini TTS/);
await page.fill("#audio-style", "warm documentary narrator");
await page.fill("#audio-script", "Describe the delivery and Gemini follows it.");
await generate.click();
const geminiGroup = page.locator('article[aria-label*="Gemini follows it"]');
await geminiGroup.locator("audio").first().waitFor({ timeout: 45000 });
check(
  "Gemini request carries the style prompt and no stale language",
  lastBody?.style_prompt === "warm documentary narrator" && !lastBody?.language && lastBody?.voice === "Kore",
  JSON.stringify(lastBody),
);
check("Gemini take is marked as styled", (await geminiGroup.innerText()).includes("styled"));

// --- A style prompt must not follow a model that cannot use one -----------------------------------
await selectModel(/Aura 1/);
check("style control hidden for models without support", (await page.locator("#audio-style").count()) === 0);
await page.fill("#audio-script", "Back on Aura with no style applied.");
await generate.click();
const plainGroup = page.locator('article[aria-label*="no style applied"]');
await plainGroup.locator("audio").first().waitFor({ timeout: 45000 });
check("stale style prompt is not submitted", !lastBody?.style_prompt && lastBody?.voice === "orion", JSON.stringify(lastBody));
check("take without a style is not marked styled", !(await plainGroup.innerText()).includes("styled"));

// --- A batch stays grouped under one generation ---------------------------------------------------
await more.click();
await page.fill("#audio-script", "Two takes of the same line, please.");
await generate.click();
const batchGroup = page.locator('article[aria-label*="Two takes of the same line"]');
await batchGroup.locator("audio").nth(1).waitFor({ timeout: 45000 });
check("batch_size reached the API", lastBody?.batch_size === 2, JSON.stringify(lastBody));
check("a batch renders as one group with two takes", (await batchGroup.locator("audio").count()) === 2);
check("batch takes are numbered", (await batchGroup.innerText()).includes("01") && (await batchGroup.innerText()).includes("02"));
check(
  "every take offers download and open original",
  (await batchGroup.locator("a[download]").count()) === 2 && (await batchGroup.locator('a[target="_blank"]').count()) === 2,
);
check("no autoplay anywhere on the page", (await page.locator("audio[autoplay]").count()) === 0);
check(
  "two players are independently usable",
  await batchGroup.locator("audio").evaluateAll((els) => els.length === 2 && els.every((a) => a.controls) && new Set(els.map((e) => e.src)).size === 2),
);

// --- Uniform list, newest first ---------------------------------------------------------------------
const groups = page.locator('section[aria-label="Audio takes"] article[aria-label]');
const groupLabels = await groups.evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
check("results are a uniform list of every generation", groupLabels.length === 5, `${groupLabels.length} groups`);
check("newest generation is first", groupLabels[0].includes("Two takes of the same line"), groupLabels[0]);
check("no featured-result article remains", (await page.locator('article[aria-label="Latest audio"]').count()) === 0);
const rowHeights = await page.locator('section[aria-label="Audio takes"] figure').evaluateAll((els) => els.map((e) => e.clientHeight));
check("every take row gets identical treatment", new Set(rowHeights).size === 1, rowHeights.join(","));
const groupWidths = await groups.evaluateAll((els) => els.map((e) => e.clientWidth));
check("no generation is rendered larger than the others", new Set(groupWidths).size === 1, groupWidths.join(","));
await page.screenshot({ path: `${shots}/57-audio-list.png`, fullPage: true });

// --- Persistence and detail ------------------------------------------------------------------------
await page.reload();
await page.waitForSelector("article[aria-label] audio", { timeout: 30000 });
check("audio results survive a refresh", (await groups.count()) === 5, `${await groups.count()} groups`);

await geminiGroup.locator('button[aria-label^="Open details:"]').click();
await page.waitForSelector('[role="dialog"] audio');
const dialogText = await page.locator('[role="dialog"]').innerText();
check(
  "detail dialog shows script, model, voice and style",
  dialogText.includes("Script") && dialogText.includes("Gemini TTS") && dialogText.includes("Kore") && dialogText.includes("warm documentary narrator"),
  dialogText.replace(/\n/g, " | ").slice(0, 200),
);
check("detail dialog plays the take", (await audioMeta(page.locator('[role="dialog"] audio').first())).duration > 0);
await page.screenshot({ path: `${shots}/53-audio-detail.png` });
await page.keyboard.press("Escape");

// --- Failure and retry ------------------------------------------------------------------------------
await page.fill("#audio-script", "[quota] anything");
await generate.click();
const quotaGroup = page.locator('article[aria-label*="quota"]');
await quotaGroup.first().locator('[role="alert"]').waitFor({ timeout: 30000 });
const alertText = await quotaGroup.first().locator('[role="alert"]').innerText();
check("quota exhaustion shows the honest message + retry", alertText.includes("Daily free speech generation quota has been used") && alertText.includes("Retry"));
check("a failed generation renders no player", (await quotaGroup.first().locator("audio").count()) === 0);
await page.screenshot({ path: `${shots}/54-audio-failed.png` });

await quotaGroup.first().getByRole("button", { name: "Retry" }).click();
await page.waitForFunction(() => document.querySelectorAll('article[aria-label*="quota"]').length === 2, null, { timeout: 30000 });
check("retry submits the same script again as a new generation", (await quotaGroup.count()) === 2);
await quotaGroup.first().locator('[role="alert"]').waitFor({ timeout: 30000 });
check("the retried generation reports its own failure", (await quotaGroup.first().locator('[role="alert"]').innerText()).includes("Generation failed"));

// --- Voice Change / Translate stay honest previews ---------------------------------------------------
check(
  "voice change and translate are links to preview pages",
  (await form.locator('a[href="/tools/voice-change"]').count()) === 1 &&
    (await form.locator('a[href="/tools/translate"]').count()) === 1,
);
await form.locator('a[href="/tools/voice-change"]').click();
await page.waitForURL(/\/tools\/voice-change$/);
check("voice change preview is reachable and honest", /not available|no free|preview/i.test(await page.locator("main").innerText()));
await page.goBack();
await page.waitForSelector("#audio-script");

// --- History integration + reuse ---------------------------------------------------------------------
await page.goto(`${base}/history?type=audio`);
await page.waitForSelector("article");
const apiList = await (await page.request.get(`${base}/api/generations?type=audio&limit=50`)).json();
check(
  "history lists every audio generation",
  (await page.locator("article").count()) === apiList.items.length,
  `${await page.locator("article").count()} vs ${apiList.items.length}`,
);
check("failed takes render safely in history", (await page.locator("article", { hasText: "Generation failed" }).count()) === 2);
check("no <img> used for audio tiles", (await page.locator("article img").count()) === 0);
await page.screenshot({ path: `${shots}/55-history-audio.png` });
await page.locator("article", { hasText: "Gemini follows it" }).first().locator("button").first().click();
await page.waitForSelector('[role="dialog"] audio');
check("history detail plays audio", (await audioMeta(page.locator('[role="dialog"] audio').first())).duration > 0);
await page.getByRole("button", { name: "Reuse prompt" }).click();
await page.waitForURL(/\/generate\/audio\?prompt=/);
await page.waitForSelector("#audio-script");
check(
  "reuse from history restores script, model and voice",
  (await page.inputValue("#audio-script")).includes("Gemini follows") &&
    (await model.innerText()).includes("Gemini TTS") &&
    (await voicePicker.innerText()).includes("Kore"),
);
// Reuse inside the studio carries the style prompt too (the deep link does not).
await page.goto(`${base}/generate/audio`, { waitUntil: "networkidle" });
await page.waitForSelector("article[aria-label] audio", { timeout: 30000 });
await geminiGroup.locator('button[aria-label^="Reuse prompt:"]').click();
await page.waitForTimeout(300);
check(
  "in-studio reuse restores script, model, voice and style",
  (await page.inputValue("#audio-script")).includes("Gemini follows") &&
    (await model.innerText()).includes("Gemini TTS") &&
    (await voicePicker.innerText()).includes("Kore") &&
    (await page.inputValue("#audio-style")) === "warm documentary narrator",
);

// Reusing a take that has no style must clear the one left over from the previous reuse.
await plainGroup.locator('button[aria-label^="Reuse prompt:"]').click();
await page.waitForTimeout(300);
check(
  "reuse restores the model and voice of the chosen take",
  (await model.innerText()).includes("Aura 1") && (await voicePicker.innerText()).includes("Orion"),
);
check("reuse restores the batch size", (await batch.innerText()).includes("1/2"), await batch.innerText());
await selectModel(/Gemini TTS/);
check("the previous style prompt was cleared, not just hidden", (await page.inputValue("#audio-style")) === "");

// --- Rate limit -------------------------------------------------------------------------------------
// The API allows 10 speech generations per 10 minutes per user; the rail must say so plainly.
await selectModel(/Aura 1/);
await page.unroute("**/api/generations/audio");
await page.route("**/api/generations/audio", (route) =>
  route.fulfill({
    status: 429,
    contentType: "application/json",
    body: JSON.stringify({
      error: {
        code: "rate_limited",
        message: "Too many speech generations. Try again in about 9 minutes.",
        details: { retry_after_seconds: 540 },
      },
    }),
  }),
);
await page.fill("#audio-script", "One take too many.");
await generate.click();
await form.locator('[role="alert"]').waitFor({ timeout: 10000 });
const limited = await form.locator('[role="alert"]').innerText();
check(
  "rate limit is surfaced in plain language",
  limited.includes("Too many speech generations") && limited.includes("Try again in about 9 minutes"),
  limited,
);
check("a rate-limited submission adds no take to the list", (await groups.count()) === 7, `${await groups.count()} groups`);
await page.unroute("**/api/generations/audio");
await page.screenshot({ path: `${shots}/59-audio-rate-limit.png` });

// --- Mobile -----------------------------------------------------------------------------------------
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
await mobile.addCookies(await context.cookies());
const mp = await mobile.newPage();
await mp.goto(`${base}/generate/audio`, { waitUntil: "networkidle" });
await mp.waitForSelector("article[aria-label] audio", { timeout: 30000 });
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
check("no horizontal overflow on mobile", !overflow);
check("player fits the mobile viewport", await mp.locator("article audio").first().evaluate((a) => a.clientWidth <= 390 && a.clientWidth > 120));
check(
  "rail stacks above the results on mobile",
  await mp.evaluate(() => {
    const rail = document.querySelector('form[aria-label="Speech generator"]').getBoundingClientRect();
    const list = document.querySelector('section[aria-label="Audio takes"]').getBoundingClientRect();
    return list.top >= rail.bottom - 1;
  }),
);
await mp.screenshot({ path: `${shots}/56-audio-mobile.png` });

const unexpected = consoleErrors.filter((e) => !e.includes("429"));
check(
  "no unexpected console errors",
  unexpected.length === 0,
  `${unexpected.join(" | ").slice(0, 200)} :: ${[...new Set(httpFailures)].join(" | ").slice(0, 200)}`,
);
console.log(results.join("\n"));
await browser.close();
if (results.some((r) => r.startsWith("FAIL"))) process.exitCode = 1;
