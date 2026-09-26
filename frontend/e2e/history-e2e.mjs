// Browser-level check of History against the local stack with the backend in
// USE_FAKE_PROVIDERS mode (GENERATION_RATE_LIMIT_PER_MINUTE raised for seeding). No real quota.
import { chromium } from "playwright";

const base = process.env.E2E_BASE ?? "http://127.0.0.1:3000";
const shots = process.argv[2];
const email = `history-${Date.now()}@example.com`;
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(String(e)));

// 1. anonymous access
await page.goto(`${base}/history`);
await page.waitForURL(/\/login\?next=%2Fhistory/);
check("anonymous /history redirects to login", true);

// sign up (keeping the ?next= so we land back on History)
await page.goto(`${base}/signup?next=%2Fhistory`, { waitUntil: "networkidle" });
await page.fill("#signup-name", "History Tester");
await page.fill("#signup-email", email);
await page.fill("#signup-password", "passw0rd1");
await page.check("#signup-terms");
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL(/\/history$/);

// 2. empty states
await page.waitForSelector("text=Nothing here yet.");
check("empty state (all) with CTA", (await page.getByRole("link", { name: "Image Studio" }).count()) === 1);
await page.getByRole("tab", { name: "Videos" }).click();
await page.waitForSelector("text=No video generations yet.");
await page.getByRole("tab", { name: "Audio" }).click();
await page.waitForSelector("text=No audio generations yet.");
await page.getByRole("tab", { name: "Images" }).click();
await page.waitForSelector("text=No image generations yet.");
check("video/audio/images empty states", true);
await page.screenshot({ path: `${shots}/20-history-empty.png` });

// seed: 26 completed + 1 failed via the API (fake provider, no latency)
const post = (body) => page.request.post(`${base}/api/generations/image`, { data: body });
for (let i = 0; i < 26; i += 1) {
  const r = await post({ prompt: `seed ${i} zebra-${i} on a lime background`, model_id: i % 2 ? "sdxl-lightning" : "flux-1-schnell", aspect_ratio: i % 2 ? "16:9" : "1:1" });
  if (r.status() !== 202) throw new Error(`seed failed: ${r.status()} ${await r.text()}`);
}
await post({ prompt: "[fail] this one breaks", model_id: "flux-1-schnell" });
await page.waitForTimeout(1500);

// 3. history renders, pagination
await page.goto(`${base}/history`);
await page.waitForSelector("article");
let tiles = await page.locator("article").count();
check("first page shows 24 tiles", tiles === 24, `count=${tiles}`);
check("day group header present", (await page.getByRole("heading", { name: "Today" }).count()) === 1);
await page.getByRole("button", { name: "Load more" }).click();
await page.waitForFunction(() => document.querySelectorAll("article").length === 27);
tiles = await page.locator("article").count();
check("load more appends remaining 3", tiles === 27 && (await page.getByRole("button", { name: "Load more" }).count()) === 0);
check("completed tiles render media", (await page.locator('article img[src*="dev-assets"]').count()) === 26);
await page.screenshot({ path: `${shots}/21-history-grid.png` });

// 4. failed tile
const failedTile = page.locator("article", { hasText: "Generation failed" });
check("failed tile rendered safely", (await failedTile.count()) === 1 && (await failedTile.innerText()).includes("safety filter"));
check("no broken images", (await page.locator("article img").evaluateAll((imgs) => imgs.filter((i) => i.complete && i.naturalWidth === 0).length)) === 0);

// 5. images filter + search
await page.getByRole("tab", { name: "Images" }).click();
await page.waitForURL(/type=image/);
await page.waitForSelector("article");
check("images filter keeps image records", (await page.locator("article").count()) >= 24);
await page.fill('input[aria-label="Search prompts and models"]', "zebra-7");
await page.waitForFunction(() => document.querySelectorAll("article").length === 1);
check("search narrows to 1 tile", true);
await page.fill('input[aria-label="Search prompts and models"]', "");
await page.waitForFunction(() => document.querySelectorAll("article").length >= 24);

// 6. detail dialog + reuse prompt
await page.getByRole("tab", { name: "All" }).click();
await page.waitForSelector("article");
await page.locator("article", { hasText: "zebra-25" }).locator("button").first().click();
await page.waitForSelector('[role="dialog"]');
const dialogText = await page.locator('[role="dialog"]').innerText();
check("detail dialog shows prompt/model/aspect/status", dialogText.includes("zebra-25") && dialogText.includes("SDXL Lightning") && dialogText.includes("16:9") && dialogText.includes("Completed"));
await page.screenshot({ path: `${shots}/22-history-detail.png` });
await page.getByRole("button", { name: "Reuse prompt" }).click();
await page.waitForURL(/\/generate\/image\?prompt=/);
await page.waitForSelector("#image-prompt");
const promptValue = await page.inputValue("#image-prompt");
const modelChip = await page.getByRole("button", { name: "Model" }).innerText();
const aspectChip = await page.getByRole("button", { name: "Aspect ratio" }).innerText();
check("reuse prompt restores prompt/model/aspect", promptValue.includes("zebra-25") && modelChip.includes("SDXL Lightning") && aspectChip.includes("16:9"));

// 7. retry a failed generation from history, then processing state
await page.goto(`${base}/history`);
await page.waitForSelector("article");
await post({ prompt: "[slow] a very patient generation", model_id: "flux-1-schnell" });
await page.reload();
await page.waitForSelector("article", { hasText: "Generating" });
check("processing tile shows generating state", true);
await page.screenshot({ path: `${shots}/23-history-processing.png` });
await page.locator("article", { hasText: "Generation failed" }).getByRole("button", { name: "Retry" }).click();
await page.waitForURL(/\/generate\/image/);
await page.waitForSelector('[role="status"]', { timeout: 10000 });
check("retry from history starts a new generation and opens the generator", true);
await page.goto(`${base}/history`);
await page.waitForSelector('article:has-text("patient") img[src*="dev-assets"]', { timeout: 20000 });
check("processing tile updates to completed via polling", true);

// 8. refresh persistence
await page.reload();
await page.waitForSelector("article");
check("history persists after refresh", (await page.locator("article").count()) >= 24);

// 9. mobile
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
await mobile.addCookies(await context.cookies());
const mp = await mobile.newPage();
await mp.goto(`${base}/history`);
await mp.waitForSelector("article");
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
check("no horizontal overflow on mobile", !overflow);
await mp.screenshot({ path: `${shots}/24-history-mobile.png` });
await mp.locator("article").first().locator("button").first().click();
await mp.waitForSelector('[role="dialog"]');
const dialogBox = await mp.locator('[role="dialog"]').boundingBox();
check("detail dialog fits mobile viewport", dialogBox.width <= 390 && dialogBox.height <= 844);
await mp.screenshot({ path: `${shots}/25-history-mobile-detail.png` });

check("no unexpected console errors", consoleErrors.length === 0, consoleErrors.join(" | ").slice(0, 300));
console.log(results.join("\n"));
if (results.some((r) => r.startsWith("FAIL"))) process.exitCode = 1;
await browser.close();
