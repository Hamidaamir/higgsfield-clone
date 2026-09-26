// Browser-level check of the Create/Home page (R2) against the local stack with the backend in
// USE_FAKE_PROVIDERS mode. Covers the anonymous and authenticated variants, the four creative
// modes, and Recent Creations being driven by the real generations API.
// Usage: node e2e/create-e2e.mjs <screenshot-dir>
import { chromium } from "playwright";

const base = "http://127.0.0.1:3000";
const shots = process.argv[2];
const email = `create-${Date.now()}@example.com`;
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(String(e)));

// Every request to the authenticated generations endpoint, so we can prove anonymous visitors
// never touch it and that the signed-in page asks for exactly one small page of results.
const generationListCalls = [];
page.on("request", (r) => {
  const url = r.url();
  if (/\/api\/generations(\?|$)/.test(url)) generationListCalls.push(url);
});

const STUDIO_HREFS = ["/generate/image", "/generate/video", "/generate/audio", "/edit/image"];

// --- Anonymous ---------------------------------------------------------------------------------
await page.goto(`${base}/`, { waitUntil: "networkidle" });
check("hero headline renders once as the page h1", (await page.locator("h1").count()) === 1);
check("hero headline carries the accent emphasis", (await page.locator("h1 em").innerText()).includes("reality"));
check("hero eyebrow is present without numeric prefixes", (await page.getByText("AI creative studio").count()) === 1);

const modes = page.locator('section#creative-modes a');
check(
  "creative modes link to the four real workspaces",
  JSON.stringify(await modes.evaluateAll((els) => els.map((e) => e.getAttribute("href")))) === JSON.stringify(STUDIO_HREFS),
);
check("anonymous hero CTA goes to signup and preserves next", (await page.locator('a[href="/signup?next=%2F"]').count()) >= 1);
check("anonymous sees the curated studio showcase", await page.getByRole("heading", { name: "From the studio" }).isVisible());
check("anonymous is not shown a personal archive link", (await page.getByRole("link", { name: /View archive/ }).count()) === 0);
check("anonymous never calls the authenticated generations endpoint", generationListCalls.length === 0, generationListCalls.join(", "));
check("showcase media is local (no third-party hosts)", (await page.locator('img[src^="http"]').count()) === 0);
await page.screenshot({ path: `${shots}/70-create-anonymous.png`, fullPage: true });

// --- Authenticated, empty ----------------------------------------------------------------------
await page.goto(`${base}/signup?next=%2F`, { waitUntil: "networkidle" });
await page.fill("#signup-name", "Create Tester");
await page.fill("#signup-email", email);
await page.fill("#signup-password", "passw0rd1");
await page.check("#signup-terms");
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL(`${base}/`);
await page.waitForLoadState("networkidle");

check("signed-in page shows Recent creations", await page.getByRole("heading", { name: "Recent creations" }).isVisible());
await page.getByText("Nothing here yet.").waitFor({ state: "visible", timeout: 10000 });
check("empty state is purposeful, not an error", true);
const emptyLinks = await page
  .locator("section", { has: page.getByText("Nothing here yet.") })
  .getByRole("link")
  .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
check("empty state offers the studios", STUDIO_HREFS.slice(0, 3).every((h) => emptyLinks.includes(h)), emptyLinks.join(", "));
check("signed-in hero CTA points at the creative modes", (await page.locator('a[href="#creative-modes"]').count()) === 1);
await page.screenshot({ path: `${shots}/71-create-empty.png`, fullPage: true });

// --- Authenticated, with real generations --------------------------------------------------------
await page.goto(`${base}/generate/image`, { waitUntil: "networkidle" });
await page.fill("#image-prompt", "a paper boat at golden hour, 35mm film");
await page.locator("form button[type=submit]").first().click();
await page.waitForSelector('img[alt^="a paper boat"]', { timeout: 25000 });

await page.goto(`${base}/generate/audio`, { waitUntil: "networkidle" });
await page.fill("#audio-script", "Welcome to the studio. A short line of generated speech.");
await page.locator('form[aria-label="Speech generator"] button[type=submit]').click();
await page.waitForSelector("audio", { timeout: 25000 });

generationListCalls.length = 0;
await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForSelector('article button[aria-label^="Open details"]', { timeout: 15000 });

check("Recent creations is backed by the generations API", generationListCalls.length >= 1, generationListCalls.join(", "));
check("Recent creations asks for one small page", generationListCalls.every((u) => u.includes("limit=6")), generationListCalls.join(", "));
const tiles = page.locator('article button[aria-label^="Open details"]');
check("recent work shows the real generations just made", (await tiles.count()) === 2, `${await tiles.count()} tiles`);
const captions = await page.locator("article p").allInnerTexts();
check("tiles carry the real prompt text", captions.some((t) => t.includes("paper boat")), captions.slice(0, 4).join(" | "));
check("audio is represented by type, not a broken frame", captions.some((t) => t.includes("Audio")));
check("no database ids are shown", !captions.some((t) => /[0-9a-f]{8}-[0-9a-f]{4}/.test(t)));
check("video is never autoplayed", (await page.locator("video[autoplay]").count()) === 0);
check("archive link is offered", (await page.getByRole("link", { name: /View archive/ }).getAttribute("href")) === "/history");
await page.screenshot({ path: `${shots}/72-create-recent.png`, fullPage: true });

// Detail interaction reuses the shared generation dialog.
await tiles.first().click();
const dialog = page.getByRole("dialog");
await dialog.waitFor({ state: "visible" });
check("a creation opens the shared detail dialog", (await dialog.count()) === 1);
await page.keyboard.press("Escape");
check("detail dialog closes on Escape", (await page.getByRole("dialog").count()) === 0);

// --- Mobile ---------------------------------------------------------------------------------------
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(400);
check(
  "no horizontal overflow at 390px",
  await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1),
);
check("creative modes remain reachable on mobile", (await page.locator('section#creative-modes a').count()) === 4);
await page.screenshot({ path: `${shots}/73-create-mobile.png`, fullPage: true });

// --- Themes ------------------------------------------------------------------------------------------
await page.setViewportSize({ width: 1440, height: 900 });
for (const [theme, expected] of [["light", "rgb(249, 246, 240)"], ["dark", "rgb(14, 13, 12)"]]) {
  const themed = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const tp = await themed.newPage();
  await tp.addInitScript((t) => localStorage.setItem("hf.theme", t), theme);
  await tp.goto(`${base}/`, { waitUntil: "networkidle" });
  const bg = await tp.evaluate(() => getComputedStyle(document.body).backgroundColor);
  check(`create page renders in the ${theme} theme`, bg === expected, bg);
  await themed.close();
}

const unexpected = consoleErrors.filter((e) => !e.includes("401"));
check("no unexpected console errors", unexpected.length === 0, unexpected.join(" | ").slice(0, 300));
console.log(results.join(String.fromCharCode(10)));
await browser.close();
if (results.some((r) => r.startsWith("FAIL"))) process.exitCode = 1;
