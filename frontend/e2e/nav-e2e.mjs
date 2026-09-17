// Browser-level navigation / demo-path check for the product shell built in M6 against the
// local stack with the backend in USE_FAKE_PROVIDERS mode: landing → Explore → catalog →
// signup → generators → History → secondary routes, at desktop and phone widths.
// Usage: node e2e/nav-e2e.mjs <screenshot-dir>
import { chromium } from "playwright";

const base = "http://127.0.0.1:3000";
const shots = process.argv[2];
const email = `nav-${Date.now()}@example.com`;
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(String(e)));

const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
// Client components hydrate after `goto` resolves, so visibility checks wait briefly instead of sampling.
const visible = (locator) => locator.first().waitFor({ state: "visible", timeout: 8000 }).then(() => true, () => false);
const notFound = [];
page.on("response", (r) => r.status() === 404 && notFound.push(r.url()));
const h1 = () => page.locator("h1").first().innerText();

// --- Unauthenticated landing / Explore -------------------------------------------------
const landing = await page.goto(`${base}/`);
check("landing renders for anonymous visitor", landing.status() === 200 && (await visible(page.getByRole("link", { name: "Sign up", exact: true }))));
check("explore shows the signup card", await visible(page.getByRole("region", { name: "Sign up" })));
check("explore has curated galleries", (await page.locator("section[aria-label]").count()) >= 5);
await page.screenshot({ path: `${shots}/60-explore.png` });

await page.getByRole("link", { name: /Higgsfield Effects/ }).click();
await page.waitForURL(/\/effects$/);
check("explore feature card → /effects", (await h1()).toLowerCase().includes("effects"));
await page.getByRole("tab", { name: "Camera" }).click();
const effectCards = page.locator('section[aria-label="Effects library"] a[href^="/generate/video"]');
const effectCount = await effectCards.count();
check("effects filter narrows the grid", effectCount > 0 && effectCount < 15, `${effectCount} camera effects`);
const effectHref = await effectCards.first().getAttribute("href");
check("effect card deep-links into the video generator with a prompt", /\/generate\/video\?.*prompt=/.test(effectHref ?? ""));

// --- Catalog pages + mega menu ---------------------------------------------------------
await page.goto(`${base}/image`);
check("/image catalog lists Available and Preview tools", (await page.getByText("Available now").count()) >= 2 && (await page.getByText("Preview", { exact: true }).count()) >= 5);
check("real image model card links to the generator", (await page.locator('section[aria-label="Models"] a[href^="/generate/image?model="]').count()) >= 1);
const primaryNav = page.getByRole("navigation", { name: "Primary" });
await primaryNav.getByRole("link", { name: "Video", exact: true }).hover();
const menuLink = primaryNav.locator('a[href="/generate/video"]');
await menuLink.first().waitFor({ state: "visible" });
check("video mega menu opens on hover with the real generator", await menuLink.first().isVisible());
await page.keyboard.press("Escape");
check("Escape closes the mega menu", (await menuLink.count()) === 0);
const colorOf = (href) => primaryNav.locator(`a[href="${href}"]`).evaluate((a) => getComputedStyle(a).color);
check("nav marks the current section", (await colorOf("/image")) !== (await colorOf("/video")));

// Preview product pages are honest and link back to a working path.
await page.goto(`${base}/tools/relight`);
check("preview tool page renders with a working fallback link", (await page.getByText("Preview", { exact: true }).count()) >= 1 && (await page.locator('a[href^="/generate/image"], a[href^="/edit/image"]').count()) >= 1);
await page.goto(`${base}/models/seedance-2-5`);
check("reference model page renders", (await h1()).length > 0);
check("unknown tool slug is a real 404", (await page.goto(`${base}/tools/does-not-exist`)).status() === 404);

// --- Secondary routes ------------------------------------------------------------------
const secondary = ["/video", "/audio", "/cinema-studio", "/marketing-studio", "/canvas", "/community", "/genjutsu", "/supercomputer", "/3d-jutsu", "/academy", "/contests", "/integrations/mcp", "/integrations/chatgpt", "/pricing", "/enterprise"];
const broken = [];
for (const path of secondary) {
  const res = await page.goto(`${base}${path}`);
  const ok = res.status() === 200 && (await page.locator("h1").count()) >= 1 && (await noOverflow());
  if (!ok) broken.push(`${path}:${res.status()}`);
}
check("all secondary routes render with a heading and no overflow", broken.length === 0, broken.join(", "));

await page.goto(`${base}/community`);
const recreateHref = await page.getByRole("link", { name: /Recreate/ }).first().getAttribute("href");
check("community posts carry a Recreate deep link", /\/generate\/(image|video)\?/.test(recreateHref ?? ""));
await page.goto(`${base}/cinema-studio`);
const composed = await page.locator('a[href^="/generate/video?"]').first().getAttribute("href");
check("cinema studio composes a prompt for the video generator", /prompt=/.test(composed ?? ""));
await page.goto(`${base}/pricing`);
check("pricing page exposes the free signup path", (await page.locator('a[href^="/signup"]').count()) >= 1);

// --- Auth gate + signup --------------------------------------------------------------------
await page.goto(`${base}/generate/video`);
await page.waitForURL(/\/login\?next=%2Fgenerate%2Fvideo/);
check("generators redirect anonymous users to login with next", true);
await page.goto(`${base}/edit/image`);
await page.waitForURL(/\/login\?next=%2Fedit%2Fimage/);
check("/edit/image is auth-gated", true);
await page.locator('main a[href^="/signup"], form a[href^="/signup"]').first().click();
await page.waitForURL(/\/signup/);
await page.getByRole("button", { name: /Continue with Email/ }).click();
await page.fill("#signup-name", "Nav Tester");
await page.fill("#signup-email", email);
await page.fill("#signup-password", "passw0rd1");
await page.check("#signup-terms");
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL(/\/edit\/image$/);
check("signup returns to the requested edit page", true);

// --- Authenticated demo path -------------------------------------------------------------
check("image editor renders with generate disabled until an upload", await page.locator('form[aria-label="Image editor"] button[type="submit"]').isDisabled());
await page.getByRole("button", { name: "Make it snow" }).click();
check("quick-edit chip fills the instruction", (await page.inputValue("#edit-instruction")) === "Make it snow");
await page.screenshot({ path: `${shots}/61-edit-image.png` });

await page.goto(`${base}/`);
check("explore switches to the welcome-back card when signed in", await visible(page.getByRole("region", { name: "Continue creating" })));
await page.getByRole("link", { name: "Create an image" }).click();
await page.waitForURL(/\/generate\/image$/);
check("explore → image generator", await visible(page.getByText("Start creating with")));

await page.goto(`${base}${effectHref}`);
await page.waitForSelector("#video-prompt");
check("effect deep link prefills the video prompt", (await page.inputValue("#video-prompt")).length > 10);
await page.getByRole("tab", { name: "Edit Video" }).click();
await page.waitForURL(/\/tools\/edit-video$/);
check("video sidebar Edit Video tab opens the preview page", true);

await page.goto(`${base}/generate/audio`);
check("audio generator reachable", await visible(page.getByRole("form", { name: "Speech generator" })));
await page.getByRole("button", { name: "Account menu" }).click();
await page.getByRole("menuitem", { name: "History" }).click();
await page.waitForURL(/\/history$/);
check("account menu → History", true);
await page.goto(`${base}/settings`);
check("settings shows the real account", await visible(page.getByText(email)));
await page.goto(`${base}/projects`);
check("projects page is an honest empty state", await visible(page.locator('main a[href="/history"], section a[href="/history"]')));

// --- Mobile ------------------------------------------------------------------------------------
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mp = await mobile.newPage();
const mErrors = [];
mp.on("pageerror", (e) => mErrors.push(String(e)));
const mobileBroken = [];
for (const path of ["/", "/image", "/effects", "/community", "/pricing", "/login"]) {
  await mp.goto(`${base}${path}`, { waitUntil: "networkidle" });
  if (!(await mp.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1))) mobileBroken.push(path);
}
check("no horizontal overflow on phone width", mobileBroken.length === 0, mobileBroken.join(", "));
await mp.goto(`${base}/`, { waitUntil: "networkidle" });
await mp.getByRole("button", { name: "Open navigation" }).click();
const drawer = mp.getByRole("navigation", { name: "Mobile" });
await drawer.waitFor({ state: "visible" });
check("mobile drawer lists the primary sections", (await drawer.getByRole("link").count()) >= 10);
await mp.screenshot({ path: `${shots}/62-mobile-drawer.png` });
await drawer.getByRole("link", { name: "Video", exact: true }).click();
await mp.waitForURL(/\/video$/);
check("mobile drawer navigates and closes", (await mp.getByRole("navigation", { name: "Mobile" }).count()) === 0);
check("no mobile page errors", mErrors.length === 0, mErrors.join(" | ").slice(0, 200));

// The deliberate /tools/does-not-exist probe is the only 404 this flow should produce.
const stray404 = notFound.filter((u) => !u.includes("does-not-exist"));
check("no stray 404 responses", stray404.length === 0, stray404.join(", ").slice(0, 300));
const unexpected = consoleErrors.filter((e) => !e.includes("401") && !(stray404.length === 0 && e.includes("404")));
check("no unexpected console errors", unexpected.length === 0, unexpected.join(" | ").slice(0, 300));
console.log(results.join("\n"));
await browser.close();
if (results.some((r) => r.startsWith("FAIL"))) process.exitCode = 1;
