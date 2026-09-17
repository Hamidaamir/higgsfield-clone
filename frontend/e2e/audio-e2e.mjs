// Browser-level check of the text-to-speech workflow against the local stack with the
// backend in USE_FAKE_PROVIDERS mode (no Cloudflare/Gemini quota is used).
import { chromium } from "playwright";

const base = "http://127.0.0.1:3000";
const shots = process.argv[2];
const email = `audio-${Date.now()}@example.com`;
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(String(e)));

const audioMeta = (locator) =>
  locator.evaluate((a) => new Promise((res) => {
    const done = () => res({ duration: a.duration, controls: a.controls, autoplay: a.autoplay, paused: a.paused });
    if (a.readyState >= 1) done(); else { a.onloadedmetadata = done; a.onerror = () => res({ error: a.error?.code }); }
  }));

await page.goto(`${base}/generate/audio`);
await page.waitForURL(/\/login\?next=%2Fgenerate%2Faudio/);
check("anonymous /generate/audio redirects to login", true);

await page.goto(`${base}/signup?next=%2Fgenerate%2Faudio`);
await page.getByRole("button", { name: /Continue with Email/ }).click();
await page.fill("#signup-name", "Audio Tester");
await page.fill("#signup-email", email);
await page.fill("#signup-password", "passw0rd1");
await page.check("#signup-terms");
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL(/\/generate\/audio$/);
await page.waitForSelector("text=Turn text into speech");
const form = page.getByRole("form", { name: "Speech generator" });
const generate = form.locator('button[type="submit"]');
check("workspace renders sidebar + explainer", (await page.locator('form[aria-label="Speech generator"]').count()) === 1);
check("generate disabled with empty script", await generate.isDisabled());
await page.screenshot({ path: `${shots}/50-audio-empty.png` });

// Aura-1 is the default (voice picker present); MeloTTS has languages under Advanced settings instead
check("aura default shows a voice picker", (await form.getByRole("button", { name: "Voice", exact: true }).count()) === 1);
await form.getByRole("button", { name: "Model", exact: true }).click();
await page.getByRole("option", { name: /MeloTTS/ }).click();
check("melotts has no voice picker", (await form.getByRole("button", { name: "Voice", exact: true }).count()) === 0);
await form.getByRole("button", { name: /Advanced settings/ }).click();
await form.getByRole("button", { name: "Language" }).click();
await page.getByRole("option", { name: "French" }).click();
check("language selectable under advanced settings", (await form.getByRole("button", { name: "Language" }).innerText()).includes("French"));

// slow take so the processing state is visible
await page.fill("#audio-script", "[slow] Bienvenue sur Higgsfield. Une voix réaliste pour vos projets.");
await generate.click();
await page.waitForSelector('[role="status"]', { timeout: 10000 });
check("processing state shown immediately", /Queued|Synthesizing/.test(await page.locator('[role="status"]').innerText()));
await page.screenshot({ path: `${shots}/51-audio-processing.png` });
await page.waitForSelector('article[aria-label="Latest audio"] audio', { timeout: 40000 });
const meta = await audioMeta(page.locator('article[aria-label="Latest audio"] audio').first());
check("audio player renders, decodes, no autoplay", meta.duration > 0 && meta.controls && !meta.autoplay && meta.paused, JSON.stringify(meta));
check("featured card shows model + language", (await page.locator('article[aria-label="Latest audio"]').innerText()).includes("French"));
await page.screenshot({ path: `${shots}/52-audio-completed.png` });

// Aura voice + batch 2
await form.getByRole("button", { name: "Model", exact: true }).click();
await page.getByRole("option", { name: /Aura 1/ }).click();
await form.getByRole("button", { name: "Voice", exact: true }).click();
await page.getByRole("option", { name: /Orion/ }).click();
await form.getByRole("button", { name: "More images" }).click();
await page.fill("#audio-script", "Two takes of the same line, please.");
await generate.click();
await page.waitForFunction(() => document.querySelectorAll('article[aria-label="Latest audio"] audio').length === 2, null, { timeout: 40000 });
check("aura voice + batch of 2 takes", (await page.locator('article[aria-label="Latest audio"]').innerText()).includes("Orion"));

// Gemini style prompt
await form.getByRole("button", { name: "Model", exact: true }).click();
await page.getByRole("option", { name: /Gemini TTS/ }).click();
await page.fill("#audio-style", "warm documentary narrator");
await page.fill("#audio-script", "Describe the delivery and Gemini follows it.");
await generate.click();
await page.waitForFunction(() => document.querySelector('article[aria-label="Latest audio"]')?.innerText.includes("styled"), null, { timeout: 40000 });
check("gemini model with voice details", true);

// refresh persistence
await page.reload();
await page.waitForSelector('article[aria-label="Latest audio"] audio', { timeout: 30000 });
check("audio result survives refresh", true);

// detail dialog
await page.getByRole("button", { name: "Details", exact: true }).click();
await page.waitForSelector('[role="dialog"] audio');
const dialogText = await page.locator('[role="dialog"]').innerText();
check("detail dialog shows script/model/voice/details", dialogText.includes("Script") && dialogText.includes("Gemini TTS") && dialogText.includes("Kore") && dialogText.includes("warm documentary narrator"));
await page.screenshot({ path: `${shots}/53-audio-detail.png` });
await page.keyboard.press("Escape");

// quota failure
await page.fill("#audio-script", "[quota] anything");
await generate.click();
await page.waitForSelector('article[aria-label="Latest audio"] [role="alert"]', { timeout: 30000 });
const alertText = await page.locator('article[aria-label="Latest audio"] [role="alert"]').innerText();
check("quota exhaustion shows honest message + retry", alertText.includes("Daily free speech generation quota has been used") && alertText.includes("Retry"));
await page.screenshot({ path: `${shots}/54-audio-failed.png` });

// history
await page.goto(`${base}/history?type=audio`);
await page.waitForSelector("article");
const tiles = await page.locator("article").count();
check("history audio filter lists the takes", tiles === 4, `count=${tiles}`);
check("failed take renders safely", (await page.locator("article", { hasText: "Generation failed" }).count()) === 1);
check("no <img> used for audio tiles", (await page.locator("article img").count()) === 0);
await page.screenshot({ path: `${shots}/55-history-audio.png` });
await page.locator("article").nth(1).locator("button").first().click();
await page.waitForSelector('[role="dialog"] audio');
check("history detail plays audio", (await audioMeta(page.locator('[role="dialog"] audio'))).duration > 0);
await page.getByRole("button", { name: "Reuse prompt" }).click();
await page.waitForURL(/\/generate\/audio\?prompt=/);
await page.waitForSelector("#audio-script");
check("reuse from history restores script/model/voice", (await page.inputValue("#audio-script")).includes("Gemini follows") && (await form.getByRole("button", { name: "Model", exact: true }).innerText()).includes("Gemini TTS") && (await form.getByRole("button", { name: "Voice", exact: true }).innerText()).includes("Kore"));

// mobile
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
await mobile.addCookies(await context.cookies());
const mp = await mobile.newPage();
await mp.goto(`${base}/generate/audio`);
await mp.waitForSelector('article[aria-label="Latest audio"]');
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
check("no horizontal overflow on mobile", !overflow);
await mp.screenshot({ path: `${shots}/56-audio-mobile.png` });

check("no unexpected console errors", consoleErrors.length === 0, consoleErrors.join(" | ").slice(0, 300));
console.log(results.join("\n"));
await browser.close();
