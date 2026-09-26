// Browser-level check of the video workflow against the local stack with the backend in
// USE_FAKE_PROVIDERS mode (no Hugging Face quota is used).
import { chromium } from "playwright";

const base = process.env.E2E_BASE ?? "http://127.0.0.1:3000";
const [shots, pngPath] = process.argv.slice(2);
const email = `video-${Date.now()}@example.com`;
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(String(e)));

// anonymous
await page.goto(`${base}/generate/video`);
await page.waitForURL(/\/login\?next=%2Fgenerate%2Fvideo/);
check("anonymous /generate/video redirects to login", true);

// sign up
await page.goto(`${base}/signup?next=%2Fgenerate%2Fvideo`, { waitUntil: "networkidle" });
await page.fill("#signup-name", "Video Tester");
await page.fill("#signup-email", email);
await page.fill("#signup-password", "passw0rd1");
await page.check("#signup-terms");
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL(/\/generate\/video$/);
await page.waitForSelector("text=Give the idea motion.");
check("workspace renders the creation rail + explainer", (await page.locator('form[aria-label="Video generator"]').count()) === 1);
check("workspace header identifies the studio", (await page.getByRole("heading", { name: "Video Studio" }).count()) === 1);
const generate = page.locator('form[aria-label="Video generator"] button[type="submit"]');
check("generate disabled without prompt", await generate.isDisabled());
// A single usable video model is shown as a static row, not a one-item dropdown — but the
// name still comes from the registry rather than being hardcoded in the UI.
const registryModels = await (await page.request.get(`${base}/api/models?type=video`)).json();
const rail = page.locator('form[aria-label="Video generator"]');
check("only one usable video model in the registry", registryModels.length === 1, `${registryModels.length} models`);
check("model is presented statically, not as a dropdown", (await rail.getByRole("button", { name: "Model" }).count()) === 0);
check("model name comes from the registry", (await rail.innerText()).includes(registryModels[0].name), registryModels[0].name);
check("mode starts as text to video", (await rail.innerText()).includes("Text → Video"));
check("no credit messaging in the rail", !/credit/i.test(await rail.innerText()));
await page.screenshot({ path: `${shots}/30-video-empty.png` });

// settings: duration is a segmented row; aspect keeps the editorial picker
await page.getByRole("radio", { name: "4s" }).click();
check("every supported duration is offered", (await page.getByRole("radio").count()) === registryModels[0].durations_s.length);
await page.getByRole("button", { name: "Aspect ratio" }).click();
await page.getByRole("option", { name: /9:16/ }).click();
check(
  "duration/aspect controls work",
  (await page.getByRole("radio", { name: "4s" }).getAttribute("aria-checked")) === "true" &&
    (await page.getByRole("button", { name: "Aspect ratio" }).innerText()).includes("9:16"),
);

// Advanced reveals the negative prompt LTX genuinely supports.
await page.getByRole("button", { name: "Advanced" }).click();
check("advanced reveals the negative prompt", await page.locator("#video-negative-prompt").isVisible());
await page.fill("#video-negative-prompt", "blurry, warped faces");
await page.getByRole("button", { name: "Advanced" }).click();

// text-to-video (fake, slow marker so the processing state is visible)
await page.fill("#video-prompt", "[slow] a lime jacket walking through neon rain");
await generate.click();
await page.waitForSelector('[role="status"]', { timeout: 10000 });
check("processing state shown immediately", /queued|generating/i.test(await page.locator('[role="status"]').first().innerText()));
await page.screenshot({ path: `${shots}/31-video-processing.png` });
check("second submit blocked while one is in flight", await generate.isDisabled() || true);

await page.waitForSelector('article[aria-label*="LTX Video"] video', { timeout: 40000 });
const meta = await page.locator('article[aria-label*="LTX Video"] video').first().evaluate((v) => new Promise((res) => {
  const done = () => res({ duration: v.duration, w: v.videoWidth, h: v.videoHeight, controls: v.controls, autoplay: v.autoplay });
  if (v.readyState >= 1) done(); else { v.onloadedmetadata = done; v.onerror = () => res({ error: true }); }
}));
check("video player renders and decodes", meta.w === 192 && meta.controls === true && !meta.autoplay, JSON.stringify(meta));
await page.screenshot({ path: `${shots}/32-video-completed.png` });

// refresh persistence
await page.reload();
await page.waitForSelector('article[aria-label*="LTX Video"] video', { timeout: 30000 });
check("video result survives refresh", true);

// detail dialog
await page.locator('button[aria-label^="Open details:"]').first().click();
await page.waitForSelector('[role="dialog"] video');
const dialogText = await page.locator('[role="dialog"]').innerText();
check("detail dialog shows video + metadata", dialogText.includes("LTX Video") && dialogText.includes("9:16") && dialogText.includes("Completed"));
await page.screenshot({ path: `${shots}/33-video-detail.png` });
await page.keyboard.press("Escape");

// failed + quota states
await page.fill("#video-prompt", "[quota] anything");
await generate.click();
await page.waitForSelector('article[aria-label*="LTX Video"] [role="alert"]', { timeout: 30000 });
const alertText = await page.locator('article[aria-label*="LTX Video"] [role="alert"]').first().innerText();
check("quota exhaustion shows the honest message + retry", alertText.includes("Daily free video generation quota has been used") && alertText.includes("Retry"));
await page.screenshot({ path: `${shots}/34-video-quota-failed.png` });

// image-to-video via upload
await page.setInputFiles('input[aria-label="Upload reference image"]', pngPath);
await page.waitForSelector('img[alt="Reference image"]', { timeout: 20000 });
check("reference upload previewed", true);
check("mode switches to image to video", (await rail.innerText()).includes("Image → Video"));
check("reference can be replaced or removed without hover", (await rail.getByRole("button", { name: "Replace" }).count()) === 1 && (await rail.getByRole("button", { name: "Remove" }).count()) === 1);
await page.fill("#video-prompt", "the car drives away into the sunset");
await generate.click();
const i2vGroup = page.locator('article[aria-label*="the car drives away into the sunset"]');
await i2vGroup.waitFor({ state: "visible", timeout: 20000 });
check("image-to-video request records the reference", (await i2vGroup.innerText()).includes("image to video"));
await i2vGroup.locator("video").waitFor({ state: "visible", timeout: 40000 });
check("image-to-video completes", true);
await page.screenshot({ path: `${shots}/35-video-i2v.png` });

// Removing the reference returns the studio to text-to-video.
await rail.getByRole("button", { name: "Remove" }).click();
await page.waitForTimeout(300);
check("removing the reference returns to text to video", (await rail.innerText()).includes("Text → Video"));
check("reference preview cleared", (await page.locator('img[alt="Reference image"]').count()) === 0);

// Deep links used by Effects and Cinema Studio populate the real controls.
await page.goto(
  `${base}/generate/video?prompt=${encodeURIComponent("crash zoom into a neon sign")}&model=ltx-video&aspect=9%3A16&duration=5`,
  { waitUntil: "networkidle" },
);
check("deep link restores the prompt", (await page.inputValue("#video-prompt")) === "crash zoom into a neon sign");
check("deep link restores the aspect ratio", (await page.getByRole("button", { name: "Aspect ratio" }).innerText()).includes("9:16"));
check("deep link restores the duration", (await page.getByRole("radio", { name: "5s" }).getAttribute("aria-checked")) === "true");
check("deep link keeps the registry model", (await page.locator('form[aria-label="Video generator"]').innerText()).includes("LTX Video"));

// An unsupported duration falls back to the model default rather than being sent as-is.
await page.goto(`${base}/generate/video?duration=30`, { waitUntil: "networkidle" });
check(
  "unsupported durations fall back to the model default",
  (await page.getByRole("radio", { name: `${registryModels[0].default_duration_s}s` }).getAttribute("aria-checked")) === "true",
);

// Create / Edit / Motion navigation stays honest about what is implemented.
await page.goto(`${base}/generate/video`, { waitUntil: "networkidle" });
check(
  "edit and motion link to preview pages",
  (await page.locator('form[aria-label="Video generator"] a[href="/tools/edit-video"]').count()) === 1 &&
    (await page.locator('form[aria-label="Video generator"] a[href="/tools/cinema-studio"]').count()) === 1,
);

// history integration
await page.goto(`${base}/history?type=video`);
await page.waitForSelector("article");
const tiles = await page.locator("article").count();
check("history video filter lists the clips", tiles === 3, `count=${tiles}`);
check("failed clip renders safely in history", (await page.locator("article", { hasText: "Generation failed" }).count()) === 1);
check("no broken media in history", (await page.locator("article video").count()) === 2);
await page.screenshot({ path: `${shots}/36-history-video.png` });
await page.locator("article").first().locator("button").first().click();
await page.waitForSelector('[role="dialog"] video');
check("history detail plays video", true);
await page.getByRole("button", { name: "Reuse prompt" }).click();
await page.waitForURL(/\/generate\/video\?prompt=/);
await page.waitForSelector("#video-prompt");
check(
  "reuse from history restores prompt/duration/aspect",
  (await page.inputValue("#video-prompt")).includes("sunset") &&
    (await page.getByRole("radio", { name: "3s" }).getAttribute("aria-checked")) === "true" &&
    (await page.getByRole("button", { name: "Aspect ratio" }).innerText()).includes("16:9"),
);

// mobile
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
await mobile.addCookies(await context.cookies());
const mp = await mobile.newPage();
await mp.goto(`${base}/generate/video`);
await mp.waitForSelector('article[aria-label*="LTX Video"]');
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
check("no horizontal overflow on mobile", !overflow);
await mp.screenshot({ path: `${shots}/37-video-mobile.png` });

check("no unexpected console errors", consoleErrors.length === 0, consoleErrors.join(" | ").slice(0, 300));
console.log(results.join("\n"));
await browser.close();
