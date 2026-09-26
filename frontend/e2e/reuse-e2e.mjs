// History → generator reuse and deep-link parsing across all three studios.
// Runs against the backend in USE_FAKE_PROVIDERS mode (no real provider quota).
import { chromium } from "playwright";

const base = process.env.E2E_BASE ?? "http://127.0.0.1:3000";
const shots = process.argv[2];
const email = `reuse-${Date.now()}@example.com`;
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);

// Deliberately awkward text: spaces, commas, &, ?, =, quotes and non-ASCII.
const NEGATIVE = 'blur, watermarks & logos ? size=large "no text" café';
const STYLE = 'warm & unhurried, like a "late-night" narrator ? tempo=slow café';

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(String(e)));

let lastBody = null;
const capture = async (pattern) => {
  await page.unroute(pattern).catch(() => {});
  await page.route(pattern, async (route) => {
    lastBody = route.request().postDataJSON();
    await route.continue();
  });
};

await page.goto(`${base}/signup?next=%2Fgenerate%2Fimage`, { waitUntil: "networkidle" });
await page.fill("#signup-name", "Reuse Tester");
await page.fill("#signup-email", email);
await page.fill("#signup-password", "passw0rd1");
await page.check("#signup-terms");
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL(/\/generate\/image$/);

const pickModel = async (scope, name) => {
  await scope.getByRole("button", { name: "Model", exact: true }).click();
  await page.getByRole("option", { name }).click();
  await page.waitForTimeout(150);
};
const reuseFromHistory = async (type, text) => {
  await page.goto(`${base}/history?type=${type}`, { waitUntil: "networkidle" });
  await page.locator("article", { hasText: text }).first().locator("button").first().click();
  await page.waitForSelector('[role="dialog"]');
  await page.getByRole("button", { name: "Reuse prompt" }).click();
  await page.waitForURL(/\/generate\//);
};

// ============================================================ IMAGE negative prompt
await capture("**/api/generations/image");
const dock = page.getByRole("form", { name: "Image generator" });
await pickModel(dock, /SDXL Lightning/);
await dock.getByRole("button", { name: /Advanced/ }).click();
await page.fill("#image-negative-prompt", NEGATIVE);
await page.fill("#image-prompt", "a calm harbour at dawn");
await dock.getByRole("button", { name: "Generate", exact: true }).click();
await page.waitForSelector('article[aria-label*="calm harbour"] img', { timeout: 40000 });
check("image submit sends the negative prompt", lastBody?.negative_prompt === NEGATIVE, JSON.stringify(lastBody?.negative_prompt));

lastBody = null;
await reuseFromHistory("image", "calm harbour");
check("image reuse URL carries the negative prompt", new URL(page.url()).searchParams.get("negative") === NEGATIVE, page.url().slice(0, 120));
check("image reuse keeps prompt, model, aspect and batch", ["prompt", "model", "aspect", "batch"].every((k) => new URL(page.url()).searchParams.has(k)), page.url().slice(0, 160));
await page.waitForSelector("#image-prompt");
check("image advanced opens so the restored value is visible", (await page.locator("#image-negative-prompt").count()) === 1);
check("image negative prompt restored exactly", (await page.inputValue("#image-negative-prompt")) === NEGATIVE, await page.inputValue("#image-negative-prompt"));
check("image model restored", (await dock.getByRole("button", { name: "Model", exact: true }).innerText()).includes("SDXL Lightning"));
await page.screenshot({ path: `${shots}/80-reuse-image.png` });
await dock.getByRole("button", { name: "Generate", exact: true }).click();
await page.waitForFunction(() => document.querySelectorAll("article[aria-label]").length >= 2, null, { timeout: 40000 });
check("image resubmit sends the restored negative prompt", lastBody?.negative_prompt === NEGATIVE, JSON.stringify(lastBody?.negative_prompt));

// A generation without a negative prompt must not carry one back.
lastBody = null;
await pickModel(dock, /FLUX\.1 Schnell/);
check("negative control hidden for a model without support", (await page.locator("#image-negative-prompt").count()) === 0);
await page.fill("#image-prompt", "a quiet field of wheat");
await dock.getByRole("button", { name: "Generate", exact: true }).click();
await page.waitForSelector('article[aria-label*="quiet field"] img', { timeout: 40000 });
check("unsupported model never sends a negative prompt", !lastBody?.negative_prompt, JSON.stringify(lastBody));
await reuseFromHistory("image", "quiet field");
check("reuse of a take without a negative prompt adds no parameter", !new URL(page.url()).searchParams.has("negative"), page.url().slice(0, 120));

// ============================================================ VIDEO negative prompt
await capture("**/api/generations/video");
lastBody = null;
await page.goto(`${base}/generate/video`, { waitUntil: "networkidle" });
const rail = page.getByRole("form", { name: "Video generator" });
await rail.getByRole("button", { name: /Advanced/ }).click();
await page.fill("#video-negative-prompt", NEGATIVE);
await page.fill("#video-prompt", "a paper boat drifting at golden hour");
await rail.locator('button[type="submit"]').click();
await page.waitForSelector('article[aria-label*="paper boat"] video', { timeout: 60000 });
check("video submit sends the negative prompt", lastBody?.negative_prompt === NEGATIVE, JSON.stringify(lastBody?.negative_prompt));

lastBody = null;
await reuseFromHistory("video", "paper boat");
check("video reuse URL carries the negative prompt", new URL(page.url()).searchParams.get("negative") === NEGATIVE, page.url().slice(0, 120));
check("video reuse keeps prompt, model, aspect and duration", ["prompt", "model", "aspect", "duration"].every((k) => new URL(page.url()).searchParams.has(k)), page.url().slice(0, 160));
await page.waitForSelector("#video-prompt");
check("video advanced opens so the restored value is visible", (await page.locator("#video-negative-prompt").count()) === 1);
check("video negative prompt restored exactly", (await page.inputValue("#video-negative-prompt")) === NEGATIVE, await page.inputValue("#video-negative-prompt"));
await page.screenshot({ path: `${shots}/81-reuse-video.png` });
await rail.locator('button[type="submit"]').click();
await page.waitForFunction(() => document.querySelectorAll('[role="status"]').length > 0, null, { timeout: 20000 });
check("video resubmit sends the restored negative prompt", lastBody?.negative_prompt === NEGATIVE, JSON.stringify(lastBody?.negative_prompt));

// ============================================================ AUDIO style + batch
await capture("**/api/generations/audio");
lastBody = null;
await page.goto(`${base}/generate/audio`, { waitUntil: "networkidle" });
const arail = page.getByRole("form", { name: "Speech generator" });
const takes = arail.getByRole("group", { name: "Number of takes" });
await pickModel(arail, /Gemini TTS/);
await page.fill("#audio-style", STYLE);
await page.fill("#audio-script", "A line whose delivery is described in detail.");
await arail.locator('button[type="submit"]').click();
await page.waitForSelector('article[aria-label*="delivery is described"] audio', { timeout: 45000 });
check("audio submit sends the style prompt", lastBody?.style_prompt === STYLE, JSON.stringify(lastBody?.style_prompt));

lastBody = null;
await reuseFromHistory("audio", "delivery is described");
check("audio reuse URL carries the style prompt", new URL(page.url()).searchParams.get("style") === STYLE, page.url().slice(0, 140));
check("audio reuse keeps prompt, model, voice and batch", ["prompt", "model", "voice", "batch"].every((k) => new URL(page.url()).searchParams.has(k)), page.url().slice(0, 180));
await page.waitForSelector("#audio-script");
check("audio style prompt restored exactly", (await page.inputValue("#audio-style")) === STYLE, await page.inputValue("#audio-style"));
await page.screenshot({ path: `${shots}/82-reuse-audio.png` });
await arail.locator('button[type="submit"]').click();
await page.waitForFunction(() => document.querySelectorAll('article[aria-label*="delivery is described"]').length === 2, null, { timeout: 45000 });
check("audio resubmit sends the restored style prompt", lastBody?.style_prompt === STYLE, JSON.stringify(lastBody?.style_prompt));

// A batch round trip: Aura at 2 takes, back through History.
lastBody = null;
await page.goto(`${base}/generate/audio`, { waitUntil: "networkidle" });
await pickModel(arail, /Aura 1/);
await arail.getByRole("button", { name: "More takes" }).click();
await page.fill("#audio-script", "Two takes to carry through history.");
await arail.locator('button[type="submit"]').click();
await page.waitForFunction(() => document.querySelectorAll('article[aria-label*="carry through history"] audio').length === 2, null, { timeout: 45000 });
check("audio batch of two submitted", lastBody?.batch_size === 2, JSON.stringify(lastBody));
lastBody = null;
await reuseFromHistory("audio", "carry through history");
check("audio reuse URL carries batch=2", new URL(page.url()).searchParams.get("batch") === "2", page.url().slice(0, 140));
await page.waitForSelector("#audio-script");
// The script can mount before the registry supplies Aura's max_batch. Wait for
// the exact expected restored control, rather than asserting against its loading shell.
await page.waitForFunction(() => document.querySelector('[role="group"][aria-label="Number of takes"]')?.innerText.includes("2/2"));
check("audio batch restored from the URL", (await takes.innerText()).includes("2/2"), await takes.innerText());
check("a take without a style clears the control", (await page.locator("#audio-style").count()) === 0);
await arail.locator('button[type="submit"]').click();
await page.waitForTimeout(1200);
check("audio resubmit sends the restored batch and no style", lastBody?.batch_size === 2 && !lastBody?.style_prompt, JSON.stringify(lastBody));

// ============================================================ AUDIO batch deep links
// Valid values, straight from the registry's own max_batch for each model.
const registry = await (await page.request.get(`${base}/api/models?type=audio`)).json();
const maxBatch = (id) => registry.find((m) => m.id === id).max_batch;
for (const id of ["aura-1", "melotts", "gemini-tts"]) {
  const want = maxBatch(id);
  await page.goto(`${base}/generate/audio?model=${id}&prompt=deep+link&batch=${want}`, { waitUntil: "networkidle" });
  await page.waitForSelector("#audio-script");
  check(`${id}: batch=${want} accepted from the URL`, (await takes.innerText()).includes(`${want}/${want}`), await takes.innerText());
}

// Invalid values are clamped or ignored; the registry decides the ceiling.
const invalid = [
  ["gemini-tts", "4", 1],
  ["aura-1", "999", 2],
  ["melotts", "0", 1],
  ["melotts", "abc", 1],
  ["aura-1", "-3", 1],
  ["aura-1", "2.9", 2],
];
for (const [id, raw, want] of invalid) {
  await page.goto(`${base}/generate/audio?model=${id}&prompt=deep+link&batch=${encodeURIComponent(raw)}`, { waitUntil: "networkidle" });
  await page.waitForSelector("#audio-script");
  const shown = await takes.innerText();
  check(`${id}: batch=${raw} resolves to ${want}`, shown.includes(`${want}/${maxBatch(id)}`), shown.replace(/\n/g, " "));
}

// The clamped value is what actually reaches the API.
lastBody = null;
await page.goto(`${base}/generate/audio?model=gemini-tts&prompt=deep+link&batch=999`, { waitUntil: "networkidle" });
await page.fill("#audio-script", "An out of range batch must never be sent.");
await arail.locator('button[type="submit"]').click();
await page.waitForTimeout(1500);
check("an out-of-range batch never reaches the POST body", lastBody?.batch_size === maxBatch("gemini-tts"), JSON.stringify(lastBody));

// A style in the URL must not be sent to a model that cannot use one.
lastBody = null;
await page.goto(`${base}/generate/audio?model=aura-1&prompt=deep+link&style=${encodeURIComponent(STYLE)}`, { waitUntil: "networkidle" });
await page.waitForSelector("#audio-script");
check("style control stays hidden for a model without support", (await page.locator("#audio-style").count()) === 0);
await page.fill("#audio-script", "A style the model cannot use.");
await arail.locator('button[type="submit"]').click();
await page.waitForTimeout(1500);
check("an unsupported style never reaches the POST body", lastBody && !lastBody.style_prompt, JSON.stringify(lastBody));

// Deep links without the new parameters behave exactly as before.
await page.goto(`${base}/generate/audio?model=melotts&prompt=plain+link`, { waitUntil: "networkidle" });
await page.waitForSelector("#audio-script");
check("a link without batch or style is unchanged", (await takes.innerText()).includes("1/4") && (await page.locator("#audio-style").count()) === 0, await takes.innerText());
await page.goto(`${base}/generate/image?model=sdxl-lightning&prompt=plain+link`, { waitUntil: "networkidle" });
await page.waitForSelector("#image-prompt");
check("image link without a negative prompt keeps advanced collapsed", (await page.locator("#image-negative-prompt").count()) === 0);

const unexpected = consoleErrors.filter((e) => !e.includes("429"));
check("no unexpected console errors", unexpected.length === 0, unexpected.join(" | ").slice(0, 300));
console.log(results.join("\n"));
await browser.close();
if (results.some((r) => r.startsWith("FAIL"))) process.exitCode = 1;
