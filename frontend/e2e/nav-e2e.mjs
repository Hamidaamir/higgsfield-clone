// Browser-level navigation / demo-path check for the product shell built in M6 against the
// local stack with the backend in USE_FAKE_PROVIDERS mode: landing → Explore → catalog →
// signup → generators → History → secondary routes, at desktop and phone widths.
// Usage: node e2e/nav-e2e.mjs <screenshot-dir> [reference.png]
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const base = process.env.E2E_BASE ?? "http://127.0.0.1:3000";
const shots = process.argv[2];
// A 64×64 lime PNG (valid, decodable) for the image-edit before/after check when no file is given.
const pngPath = process.argv[3] ?? join(shots, "nav-ref.png");
if (!process.argv[3]) writeFileSync(pngPath, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAOklEQVR4nO3OMQEAAAgDoK1/aM3g4QcFqEtUqVQqlUqlUqlUKpVKpVKpVCqVSqVSqVQqlUqlUqlUKn0FDtPAAf5YbSMAAAAASUVORK5CYII=", "base64"));
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
const visible = (locator) => locator.first().waitFor({ state: "visible", timeout: 15000 }).then(() => true, () => false);
const notFound = [];
page.on("response", (r) => r.status() === 404 && notFound.push(r.url()));
const h1 = () => page.locator("h1").first().innerText();

// --- Unauthenticated Create landing ----------------------------------------------------
// `/` is the Create entry point since R2; the discovery galleries live under Explore.
const landing = await page.goto(`${base}/`);
check("landing renders for anonymous visitor", landing.status() === 200 && (await visible(page.getByRole("link", { name: "Sign up", exact: true }))));
check("create page offers the four workspaces", (await page.locator('section#creative-modes a').count()) === 4);
check("create shows the curated showcase for anonymous visitors", await visible(page.getByRole("heading", { name: "From the studio" })));
check("create shows the real FLUX output shipped with the app", (await page.locator('img[src*="flux-lime-jacket"]').count()) >= 1);
check("discovery artwork is rendered locally (no third-party photo hosts)", (await page.locator('img[src^="http"]').count()) === 0);
await page.screenshot({ path: `${shots}/60-create.png` });

// --- Explore discovery -----------------------------------------------------------------
await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Explore", exact: true }).click();
await page.waitForURL(/\/community$/);
check("Explore opens the curated gallery", (await h1()).length > 0);
check("explore plays the real LTX clip shipped with the app", (await page.locator('video[src*="/showcase/ltx-paper-boat"]').count()) >= 1);

await page.goto(`${base}/effects`);
check("effects page reachable from the shell", (await h1()).toLowerCase().includes("effects"));
// The effects filters are pressable buttons in a labelled group, not tab panels.
await page.getByRole("group", { name: "Effect category" }).getByRole("button", { name: "Camera", exact: true }).click();
const effectCards = page.locator('section[aria-label="Effects library"] a[href^="/generate/video"]');
const effectCount = await effectCards.count();
check("effects filter narrows the grid", effectCount > 0 && effectCount < 15, `${effectCount} camera effects`);
const effectHref = await effectCards.first().getAttribute("href");
check("effect card deep-links into the video generator with a prompt", /\/generate\/video\?.*prompt=/.test(effectHref ?? ""));

// --- Catalog pages + mega menu ---------------------------------------------------------
await page.goto(`${base}/image`);
// The catalog states availability per entry as text, not as a coloured chip.
check(
  "/image catalog marks entries Available and Preview",
  (await page.locator('main article[data-status="available"]').count()) >= 2 &&
    (await page.locator('main article[data-status="preview"]').count()) >= 5 &&
    (await page.getByText("Preview", { exact: true }).count()) >= 5,
);
check(
  "real image model card links to the generator",
  (await page.locator('section[aria-labelledby="models-heading"] a[href^="/generate/image?model="]').count()) >= 1,
);
const primaryNav = page.getByRole("navigation", { name: "Primary" });
// The dense mega menu was replaced by the Studio panel: four real workspaces, click to open.
await page.waitForLoadState("networkidle");
await page.getByRole("button", { name: /^Studio/ }).click();
const studioPanel = page.getByRole("dialog");
await studioPanel.waitFor({ state: "visible" });
const studioLinks = await studioPanel.getByRole("link").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
check(
  "Studio panel lists exactly the four real workspaces",
  JSON.stringify(studioLinks) ===
    JSON.stringify(["/generate/image", "/generate/video", "/generate/audio", "/edit/image"]),
  studioLinks.join(", "),
);
await page.keyboard.press("Escape");
check("Escape closes the Studio panel", (await page.getByRole("dialog").count()) === 0);
// Active section is shown with accent text and nothing else.
const sectionColor = (label) =>
  primaryNav.getByRole("link", { name: label, exact: true }).evaluate((a) => getComputedStyle(a).color);
check("nav marks the current section", (await sectionColor("Explore")) !== (await sectionColor("Archive")));

// Preview product pages are honest and link back to a working path.
await page.goto(`${base}/tools/relight`);
check("preview tool page renders with a working fallback link", (await page.getByText("Preview", { exact: true }).count()) >= 1 && (await page.locator('a[href^="/generate/image"], a[href^="/edit/image"]').count()) >= 1);
await page.goto(`${base}/models/seedance-2-5`);
check("reference model page renders", (await h1()).length > 0);
check("unknown tool slug is a real 404", (await page.goto(`${base}/tools/does-not-exist`)).status() === 404);
check("404 keeps the product shell and offers a way back", (await page.locator('nav[aria-label="Primary"]').count()) === 1 && (await visible(page.getByRole("link", { name: "Back to Create" }))));

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
check("community shows model metadata, not invented users or like counts", (await page.getByText(/FLUX\.1 Schnell|LTX Video/).count()) >= 2 && (await page.getByText(/\d,\d{3}/).count()) === 0);
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
await page.waitForLoadState("networkidle");
await page.locator('main a[href^="/signup"], form a[href^="/signup"]').first().click();
await page.waitForURL(/\/signup/);
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
await page.setInputFiles('input[aria-label="Upload reference image"]', pngPath);
await page.waitForSelector('form[aria-label="Image editor"] img');
// The submit unlocks only once the upload resolves into an asset id.
await page.waitForFunction(
  () => !document.querySelector('form[aria-label="Image editor"]')?.innerText.includes("Uploading"),
  null,
  { timeout: 25000 },
);
await page.locator('form[aria-label="Image editor"] button[type="submit"]').click();
const editRow = page.locator('section[aria-label="Edits"] article[aria-label*="Make it snow"]').first();
check("submitting an edit shows a before → after pair immediately", await visible(editRow));
check("the pair shows the reference image as Before", await visible(editRow.locator('img[alt^="Before the edit"]')));
check("both halves of the diptych are labelled", (await editRow.locator("figcaption").allInnerTexts()).join("|").toLowerCase().includes("before|after"));
await editRow.locator('img[alt^="After the edit"]').waitFor({ state: "visible", timeout: 25000 });
check("the edit completes into the After slot", true);
await page.screenshot({ path: `${shots}/61-edit-image.png` });

await page.goto(`${base}/`, { waitUntil: "networkidle" });
check("create switches to Recent creations when signed in", await visible(page.getByRole("heading", { name: "Recent creations" })));
check("the edit just made appears in recent work", await visible(page.locator('article button[aria-label^="Open details"]')));
await page.locator('section#creative-modes a[href="/generate/image"]').click();
await page.waitForURL(/\/generate\/image$/);
// The account already holds an edit, so the workspace shows results rather than the empty hero.
check("create → image generator", await visible(page.locator("#image-prompt")));

await page.goto(`${base}${effectHref}`);
await page.waitForSelector("#video-prompt");
check("effect deep link prefills the video prompt", (await page.inputValue("#video-prompt")).length > 10);
// The rail's mode nav links to the honest preview page for unimplemented Edit Video.
await page.locator('form[aria-label="Video generator"] a[href="/tools/edit-video"]').click();
await page.waitForURL(/\/tools\/edit-video$/);
check("video rail Edit link opens the preview page", true);

await page.goto(`${base}/generate/audio`);
check("audio generator reachable", await visible(page.getByRole("form", { name: "Speech generator" })));
// The audio rail's mode nav links to the honest preview pages for Voice Change / Translate.
const audioForm = 'form[aria-label="Speech generator"]';
check(
  "audio rail links to the Voice Change / Translate previews",
  (await page.locator(`${audioForm} a[href="/tools/voice-change"]`).count()) === 1 &&
    (await page.locator(`${audioForm} a[href="/tools/translate"]`).count()) === 1,
);
await page.locator(`${audioForm} a[href="/tools/translate"]`).click();
await page.waitForURL(/\/tools\/translate$/);
check("audio rail Translate link opens the preview page", true);
await page.getByRole("button", { name: "Account menu" }).click();
await page.getByRole("menuitem", { name: "Archive" }).click();
await page.waitForURL(/\/history$/);
check("account menu → Archive opens History", true);
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
const drawerHrefs = await drawer.getByRole("link").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
check(
  "mobile drawer lists every section and the four studios",
  ["/", "/history", "/community", "/generate/image", "/generate/video", "/generate/audio", "/edit/image"].every((h) =>
    drawerHrefs.includes(h),
  ),
  drawerHrefs.join(", "),
);
await mp.screenshot({ path: `${shots}/62-mobile-drawer.png` });
await drawer.getByRole("link", { name: "Explore", exact: true }).click();
await mp.waitForURL(/\/community$/);
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
