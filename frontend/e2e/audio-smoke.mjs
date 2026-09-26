// ONE real Cloudflare Workers AI (MeloTTS by default, or a model name argument) -> Cloudinary speech generation through the UI.
// Uses real (generous but finite) quota: run deliberately, never in loops.
import { chromium } from "playwright";
const base = "http://127.0.0.1:3000";
const [shots, email, password, modelName = "MeloTTS"] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${base}/login?next=%2Fgenerate%2Faudio`);
await page.fill("#login-email", email);
await page.fill("#login-password", password);
await page.getByRole("button", { name: "Log in" }).click();
await page.waitForURL(/\/generate\/audio/);
await page.waitForSelector("#audio-script");
const form = page.getByRole("form", { name: "Speech generator" });
await form.getByRole("button", { name: "Model", exact: true }).click();
await page.getByRole("option", { name: new RegExp(modelName) }).click();
await page.fill("#audio-script", "Welcome to Forma. Lifelike speech from any script, ready for your projects.");
const t = Date.now();
await page.getByRole("form", { name: "Speech generator" }).locator('button[type="submit"]').click();
await page.waitForSelector('[role="status"]', { timeout: 15000 });
await page.waitForFunction(
  () => document.querySelector('article[aria-label="Latest audio"] audio') || document.querySelector('article[aria-label="Latest audio"] [role="alert"]'),
  null,
  { timeout: 120000 },
);
const elapsed = ((Date.now() - t) / 1000).toFixed(1);
if (await page.locator('article[aria-label="Latest audio"] [role="alert"]').count()) {
  console.log(`FAILED after ${elapsed}s:`, await page.locator('article[aria-label="Latest audio"] [role="alert"]').innerText());
  await browser.close();
  process.exit(2);
}
const meta = await page.locator('article[aria-label="Latest audio"] audio').evaluate((a) => new Promise((res) => {
  const done = () => res({ duration: a.duration, host: new URL(a.currentSrc).host });
  if (a.readyState >= 1) done(); else { a.onloadedmetadata = done; a.onerror = () => res({ error: a.error?.code }); }
}));
console.log(`completed in ${elapsed}s; player metadata:`, JSON.stringify(meta));
await page.screenshot({ path: `${shots}/60-audio-real-result.png` });
await page.goto(`${base}/history?type=audio`);
await page.waitForSelector("article");
await page.locator("article").first().locator("button").first().click();
await page.waitForSelector('[role="dialog"] audio');
await page.waitForTimeout(800);
await page.screenshot({ path: `${shots}/61-audio-real-history-detail.png` });
console.log("history audio tile + detail dialog play the take");
await browser.close();
