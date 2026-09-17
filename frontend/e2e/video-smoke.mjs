// ONE real Hugging Face ZeroGPU -> Cloudinary video generation through the UI.
// Consumes real (tiny) daily quota: run deliberately, never in loops.
import { chromium } from "playwright";
const base = "http://127.0.0.1:3000";
const [shots, email, password] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${base}/login?next=%2Fgenerate%2Fvideo`);
await page.getByRole("button", { name: /Continue with Email/ }).click();
await page.fill("#login-email", email);
await page.fill("#login-password", password);
await page.getByRole("button", { name: "Log in" }).click();
await page.waitForURL(/\/generate\/video/);
await page.waitForSelector("#video-prompt");
await page.getByRole("button", { name: "Duration" }).click();
await page.getByRole("option", { name: /^2s/ }).click();
await page.fill("#video-prompt", "a paper boat drifting across a calm pond at golden hour, gentle ripples, cinematic");
const t = Date.now();
await page.locator('form[aria-label="Video generator"] button[type="submit"]').click();
await page.waitForSelector('[role="status"]', { timeout: 15000 });
console.log("submitted; processing state visible");
await page.waitForFunction(
  () => document.querySelector('article[aria-label="Latest video"] video') || document.querySelector('article[aria-label="Latest video"] [role="alert"]'),
  null,
  { timeout: 600000 },
);
const elapsed = ((Date.now() - t) / 1000).toFixed(0);
const failed = await page.locator('article[aria-label="Latest video"] [role="alert"]').count();
if (failed) {
  console.log(`FAILED after ${elapsed}s:`, await page.locator('article[aria-label="Latest video"] [role="alert"]').innerText());
  await page.screenshot({ path: `${shots}/40-video-real-failed.png` });
  await browser.close();
  process.exit(2);
}
const meta = await page.locator('article[aria-label="Latest video"] video').evaluate((v) => new Promise((res) => {
  const done = () => res({ duration: v.duration, w: v.videoWidth, h: v.videoHeight, host: new URL(v.currentSrc).host });
  if (v.readyState >= 1) done(); else { v.onloadedmetadata = done; v.onerror = () => res({ error: v.error?.code }); }
}));
console.log(`completed in ${elapsed}s; player metadata:`, JSON.stringify(meta));
await page.screenshot({ path: `${shots}/40-video-real-result.png` });
await page.goto(`${base}/history?type=video`);
await page.waitForSelector("article video");
console.log("history video tiles:", await page.locator("article video").count());
await page.locator("article").first().locator("button").first().click();
await page.waitForSelector('[role="dialog"] video');
await page.waitForTimeout(1000);
await page.screenshot({ path: `${shots}/41-video-real-history-detail.png` });
console.log("history detail dialog plays the clip");
await browser.close();
