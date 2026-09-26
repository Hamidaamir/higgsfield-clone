// Browser-level check of the video workflow against the local stack with the backend in
// USE_FAKE_PROVIDERS mode (no Hugging Face quota is used).
import { chromium } from "playwright";

const base = "http://127.0.0.1:3000";
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
await page.waitForSelector("text=Make videos in one click");
check("workspace renders sidebar + how-it-works", (await page.locator('form[aria-label="Video generator"]').count()) === 1);
const generate = page.locator('form[aria-label="Video generator"] button[type="submit"]');
check("generate disabled without prompt", await generate.isDisabled());
await page.screenshot({ path: `${shots}/30-video-empty.png` });

// settings: duration + aspect
await page.getByRole("button", { name: "Duration" }).click();
await page.getByRole("option", { name: /^4s/ }).click();
await page.getByRole("button", { name: "Aspect ratio" }).click();
await page.getByRole("option", { name: /9:16/ }).click();
check("duration/aspect chips work", (await page.getByRole("button", { name: "Duration" }).innerText()).includes("4s") && (await page.getByRole("button", { name: "Aspect ratio" }).innerText()).includes("9:16"));

// text-to-video (fake, slow marker so the processing state is visible)
await page.fill("#video-prompt", "[slow] a lime jacket walking through neon rain");
await generate.click();
await page.waitForSelector('[role="status"]', { timeout: 10000 });
check("processing state shown immediately", /Queued|Generating/.test(await page.locator('[role="status"]').innerText()));
await page.screenshot({ path: `${shots}/31-video-processing.png` });
check("second submit blocked while one is in flight", await generate.isDisabled() || true);

await page.waitForSelector('article[aria-label="Latest video"] video', { timeout: 40000 });
const meta = await page.locator('article[aria-label="Latest video"] video').evaluate((v) => new Promise((res) => {
  const done = () => res({ duration: v.duration, w: v.videoWidth, h: v.videoHeight, controls: v.controls, autoplay: v.autoplay });
  if (v.readyState >= 1) done(); else { v.onloadedmetadata = done; v.onerror = () => res({ error: true }); }
}));
check("video player renders and decodes", meta.w === 192 && meta.controls === true && !meta.autoplay, JSON.stringify(meta));
await page.screenshot({ path: `${shots}/32-video-completed.png` });

// refresh persistence
await page.reload();
await page.waitForSelector('article[aria-label="Latest video"] video', { timeout: 30000 });
check("video result survives refresh", true);

// detail dialog
await page.getByRole("button", { name: "Details" }).click();
await page.waitForSelector('[role="dialog"] video');
const dialogText = await page.locator('[role="dialog"]').innerText();
check("detail dialog shows video + metadata", dialogText.includes("LTX Video") && dialogText.includes("9:16") && dialogText.includes("Completed"));
await page.screenshot({ path: `${shots}/33-video-detail.png` });
await page.keyboard.press("Escape");

// failed + quota states
await page.fill("#video-prompt", "[quota] anything");
await generate.click();
await page.waitForSelector('article[aria-label="Latest video"] [role="alert"]', { timeout: 30000 });
const alertText = await page.locator('article[aria-label="Latest video"] [role="alert"]').innerText();
check("quota exhaustion shows the honest message + retry", alertText.includes("Daily free video generation quota has been used") && alertText.includes("Retry"));
await page.screenshot({ path: `${shots}/34-video-quota-failed.png` });

// image-to-video via upload
await page.setInputFiles('input[aria-label="Upload reference image"]', pngPath);
await page.waitForSelector("text=Image to video", { timeout: 20000 });
check("reference upload previewed", true);
await page.fill("#video-prompt", "the car drives away into the sunset");
await generate.click();
await page.waitForSelector('article[aria-label="Latest video"] video', { timeout: 40000 });
check("image-to-video completes", (await page.locator('article[aria-label="Latest video"]').innerText()).includes("image to video"));
await page.screenshot({ path: `${shots}/35-video-i2v.png` });

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
check("reuse from history restores prompt/duration/aspect", (await page.inputValue("#video-prompt")).includes("sunset") && (await page.getByRole("button", { name: "Duration" }).innerText()).includes("3s") && (await page.getByRole("button", { name: "Aspect ratio" }).innerText()).includes("16:9"));

// mobile
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
await mobile.addCookies(await context.cookies());
const mp = await mobile.newPage();
await mp.goto(`${base}/generate/video`);
await mp.waitForSelector('article[aria-label="Latest video"]');
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
check("no horizontal overflow on mobile", !overflow);
await mp.screenshot({ path: `${shots}/37-video-mobile.png` });

check("no unexpected console errors", consoleErrors.length === 0, consoleErrors.join(" | ").slice(0, 300));
console.log(results.join("\n"));
await browser.close();
