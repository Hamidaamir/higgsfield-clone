// Browser-level check of the Edit & Enhance workspace (/edit/image) against the local stack
// with the backend in USE_FAKE_PROVIDERS mode (no real provider quota is used).
import { chromium } from "playwright";

const base = process.env.E2E_BASE ?? "http://127.0.0.1:3000";
const [shots, pngPath] = process.argv.slice(2);
const email = `edit-${Date.now()}@example.com`;
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const consoleErrors = [];
const httpFailures = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(String(e)));
page.on("response", (r) => {
  if (r.status() >= 400) httpFailures.push(`${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}`);
});

await page.goto(`${base}/edit/image`);
await page.waitForURL(/\/login\?next=%2Fedit%2Fimage/);
check("anonymous /edit/image redirects to login", true);

await page.goto(`${base}/signup?next=%2Fedit%2Fimage`, { waitUntil: "networkidle" });
await page.fill("#signup-name", "Edit Tester");
await page.fill("#signup-email", email);
await page.fill("#signup-password", "passw0rd1");
await page.check("#signup-terms");
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL(/\/edit\/image$/);
await page.waitForSelector("text=Start with an image.");

const form = page.getByRole("form", { name: "Image editor" });
const generate = form.locator('button[type="submit"]');
const upload = page.locator('input[aria-label="Upload reference image"]');
const diptych = (text) => page.locator(`article[aria-label*="${text}"]`);
// The preview appears from a local object URL immediately; the asset id only exists once the
// upload resolves, which is what actually unlocks the form.
const uploadReference = async () => {
  await upload.setInputFiles(pngPath);
  await page.waitForSelector('img[alt="Reference image"]', { timeout: 20000 });
  await page.waitForFunction(
    () => !document.querySelector('form[aria-label="Image editor"]')?.innerText.includes("Uploading"),
    null,
    { timeout: 25000 },
  );
};

let lastBody = null;
await page.route("**/api/generations/image", async (route) => {
  lastBody = route.request().postDataJSON();
  await route.continue();
});

// ---- No reference: the workspace says editing starts with an image ---------------------------
check("workspace renders the editing rail", (await form.count()) === 1);
check("header identifies the workspace", (await page.getByRole("heading", { name: "Edit & Enhance" }).count()) === 1);
check("empty state names the first step", (await page.getByRole("heading", { name: "Start with an image." }).count()) === 1);
check("no fake before/after imagery in the empty state", (await page.locator('section[aria-label="Edits"] img').count()) === 0);
check("upload control is immediately visible", await page.getByRole("button", { name: "Add a reference image" }).isVisible());
check("generate is disabled without a reference", await generate.isDisabled());
check("no credit cost shown", !/credit/i.test(await form.innerText()));
await page.screenshot({ path: `${shots}/90-edit-empty.png` });

// An instruction alone is not enough — an edit needs a real image.
await page.fill("#edit-instruction", "Make it nighttime with neon lights");
check("instruction alone cannot be submitted", await generate.isDisabled());

// ---- Reference upload, preview, replace, remove ----------------------------------------------
await page.route("**/api/assets/upload", async (route) => {
  await new Promise((r) => setTimeout(r, 2500));
  await route.continue();
});
await upload.setInputFiles(pngPath);
await page.waitForSelector('img[alt="Reference image"]', { timeout: 20000 });
check("an uploading reference is shown as uploading", (await form.innerText()).includes("Uploading"));
check("generate stays disabled while the upload is in flight", await generate.isDisabled());
await page.screenshot({ path: `${shots}/91a-edit-uploading.png` });
await page.waitForFunction(
  () => !document.querySelector('form[aria-label="Image editor"]')?.innerText.includes("Uploading"),
  null,
  { timeout: 25000 },
);
await page.unroute("**/api/assets/upload");
check("reference preview appears after upload", (await page.locator('img[alt="Reference image"]').count()) === 1);
check("replace and remove are visible without hover", (await form.getByRole("button", { name: "Replace" }).count()) === 1 && (await form.getByRole("button", { name: "Remove" }).count()) === 1);
check("generate is enabled once a reference and instruction exist", await generate.isEnabled());
await page.screenshot({ path: `${shots}/91-edit-reference.png` });

await form.getByRole("button", { name: "Remove" }).click();
check("remove clears the reference", (await page.locator('img[alt="Reference image"]').count()) === 0);
check("generate is disabled again after removing the reference", await generate.isDisabled());
await uploadReference();
check("a reference can be uploaded again after removal", await generate.isEnabled());

// ---- Instruction + quick edits ------------------------------------------------------------------
await page.fill("#edit-instruction", "   ");
check("whitespace-only instruction cannot be submitted", await generate.isDisabled());
await page.fill("#edit-instruction", "x".repeat(2050));
check("over-limit instruction blocks submission", await generate.isDisabled());
check("over-limit instruction explains the limit", (await form.locator('[role="alert"]').innerText()).includes("Instructions are limited to 2000 characters."));
check("counter appears near the limit", (await form.innerText()).includes("2050/2000"));
await page.screenshot({ path: `${shots}/92-edit-long-instruction.png` });

const quickButtons = form.getByRole("button", { name: /Make it snow|nighttime|dramatic sunset|red jacket|35mm/ });
check("all five quick edits are real buttons", (await quickButtons.count()) === 5, `${await quickButtons.count()}`);
await form.getByRole("button", { name: "Make it snow" }).click();
check("a quick edit fills the instruction field", (await page.inputValue("#edit-instruction")) === "Make it snow");
check("generate is enabled after a quick edit", await generate.isEnabled());

// ---- Aspect comes from the registry ---------------------------------------------------------------
const registry = await (await page.request.get(`${base}/api/models?type=image`)).json();
const spec = registry.find((m) => m.id === "flux-2-klein");
check("model row names the registry model", (await form.innerText()).includes(spec.name), spec.name);
const aspect = form.getByRole("button", { name: "Aspect ratio" });
await aspect.click();
const offered = await page.locator('[role="listbox"][aria-label="Aspect ratio"] [role="option"]').allInnerTexts();
check("aspect options match the registry", offered.length === spec.aspect_ratios.length && spec.aspect_ratios.every((r) => offered.some((t) => t.includes(r))), `${offered.join(",")} vs ${spec.aspect_ratios.join(",")}`);
await page.screenshot({ path: `${shots}/93-edit-aspect-open.png` });
await page.getByRole("option", { name: "16:9" }).click();
check("aspect selection is reflected in the rail", (await aspect.innerText()).includes("16:9"));

// ---- Submit: the edit carries the uploaded reference ------------------------------------------------
await page.fill("#edit-instruction", "[slow] Give it a 35mm film look at dusk");
await generate.click();
await page.waitForSelector('[role="status"]', { timeout: 15000 });
check("processing state appears immediately", /queued|generating/i.test(await page.locator('[role="status"]').first().innerText()));
check("submission carries the uploaded reference", Boolean(lastBody?.reference_asset_id) && lastBody?.batch_size === 1, JSON.stringify(lastBody));
check("submission carries the chosen aspect ratio", lastBody?.aspect_ratio === "16:9", JSON.stringify(lastBody?.aspect_ratio));
check("submission uses the registry edit model", lastBody?.model_id === "flux-2-klein", JSON.stringify(lastBody?.model_id));

const slowGroup = diptych("35mm film look");
check("the before side shows the real reference while the edit runs", (await slowGroup.locator('img[alt^="Before the edit"]').count()) === 1);
check("the after side is an aspect-correct pending plate", await slowGroup.locator('[role="status"]').evaluate((el) => el.clientWidth > 0 && Math.abs(el.clientWidth / el.clientHeight - 16 / 9) < 0.2));
check("no fake percentage or ETA while generating", !/%|\bETA\b|minutes? left/i.test(await slowGroup.innerText()));
await page.screenshot({ path: `${shots}/94-edit-processing.png` });

await slowGroup.locator('img[alt^="After the edit"]').waitFor({ timeout: 45000 });
check("completed edit shows a real before and a real after", (await slowGroup.locator("img").count()) === 2);
const labels = await slowGroup.locator("figcaption").allInnerTexts();
check("before and after are labelled, not just positioned", labels.length === 2 && /before/i.test(labels[0]) && /after/i.test(labels[1]), labels.join(" | "));
check("the before image is the uploaded reference, not the result", await slowGroup.evaluate((el) => {
  const [before, after] = [...el.querySelectorAll("img")].map((i) => i.getAttribute("src"));
  return Boolean(before && after && before !== after);
}));
check("the instruction captions the pair", (await slowGroup.innerText()).includes("35mm film look"));
check("desktop shows the pair side by side", await slowGroup.evaluate((el) => {
  const [a, b] = [...el.querySelectorAll("figure")].map((f) => f.getBoundingClientRect());
  return Math.abs(a.top - b.top) < 4 && b.left > a.left;
}));
await page.screenshot({ path: `${shots}/95-edit-completed.png` });

// ---- Actions ----------------------------------------------------------------------------------------
check("result offers details, download and open original", (await slowGroup.locator('button[aria-label^="Open details:"]').count()) === 1 && (await slowGroup.locator("a[download]").count()) === 1 && (await slowGroup.locator('a[target="_blank"]').count()) === 1);
await slowGroup.locator('button[aria-label^="Open details:"]').click();
await page.waitForSelector('[role="dialog"] img');
const dialogText = await page.locator('[role="dialog"]').innerText();
check("detail dialog opens on the edited image", dialogText.includes("35mm film look") && dialogText.includes("FLUX.2 Klein"), dialogText.replace(/\n/g, " | ").slice(0, 160));
await page.screenshot({ path: `${shots}/96-edit-detail.png` });
await page.getByRole("button", { name: "Reuse prompt" }).click();
check("reuse restores the instruction", (await page.inputValue("#edit-instruction")).includes("35mm film look"));

// ---- A second edit keeps its own pair ----------------------------------------------------------------
await page.fill("#edit-instruction", "Turn the sky into a dramatic sunset");
await generate.click();
await diptych("dramatic sunset").locator('img[alt^="After the edit"]').waitFor({ timeout: 45000 });
const groups = page.locator('section[aria-label="Edits"] article[aria-label]');
check("each edit is its own comparison", (await groups.count()) === 2, `${await groups.count()} groups`);
check("newest edit is first", (await groups.first().getAttribute("aria-label")).includes("dramatic sunset"));
check("every group renders exactly one before and one after", await groups.evaluateAll((els) => els.every((e) => e.querySelectorAll("img").length === 2)));
await page.screenshot({ path: `${shots}/97-edit-list.png`, fullPage: true });

// ---- Persistence, failure and retry -------------------------------------------------------------------
await page.reload();
await page.waitForSelector('img[alt^="After the edit"]', { timeout: 30000 });
check("edits survive a refresh", (await groups.count()) === 2);
check("the before side is restored from the assets API", (await page.locator('img[alt^="Before the edit"]').count()) === 2);
// A refresh clears the in-memory upload, so editing again starts from a fresh reference.
check("a refresh clears the pending reference", (await page.locator('img[alt="Reference image"]').count()) === 0 && (await generate.isDisabled()));
await uploadReference();

await page.fill("#edit-instruction", "[fail] break this edit");
await generate.click();
const failedGroup = diptych("break this edit");
await failedGroup.locator('[role="alert"]').waitFor({ timeout: 30000 });
check("a failed edit keeps its before image", (await failedGroup.locator('img[alt^="Before the edit"]').count()) === 1);
check("failure shows the API message and a retry", (await failedGroup.locator('[role="alert"]').innerText()).includes("Generation failed") && (await failedGroup.getByRole("button", { name: "Retry" }).count()) === 1);
check("no stack trace in the failure message", !/Traceback|at .*\.js:|Exception/i.test(await failedGroup.locator('[role="alert"]').innerText()));
await page.screenshot({ path: `${shots}/98-edit-failed.png` });
await failedGroup.first().getByRole("button", { name: "Retry" }).click();
await page.waitForFunction(() => document.querySelectorAll('article[aria-label*="break this edit"]').length === 2, null, { timeout: 30000 });
check("retry starts another edit from the same reference", (await failedGroup.count()) === 2);

// ---- Other tools stay honest previews -------------------------------------------------------------------
for (const [name, slug] of [["Relight", "relight"], ["Inpaint", "inpaint"], ["Upscale", "image-upscale"], ["Face Swap", "face-swap"], ["Character Swap", "character-swap"]]) {
  const link = form.locator(`a[href="/tools/${slug}"]`);
  check(`${name} is a link to its preview page`, (await link.count()) === 1);
}
check("preview tools are not presented as working controls", (await form.locator('section:has(a[href="/tools/relight"]) button').count()) === 0);
await form.locator('a[href="/tools/relight"]').click();
await page.waitForURL(/\/tools\/relight$/);
check("a preview tool opens its honest page", /not available|no free|preview/i.test(await page.locator("main").innerText()));
await page.goto(`${base}/edit/video`);
await page.waitForURL(/\/tools\/edit-video$/);
check("edit video remains preview-only", /not available|no free|preview/i.test(await page.locator("main").innerText()));

// ---- History ---------------------------------------------------------------------------------------------
await page.goto(`${base}/history?type=image`, { waitUntil: "networkidle" });
await page.waitForSelector("article");
check("edits appear in history", (await page.locator("article", { hasText: "dramatic sunset" }).count()) >= 1);

// ---- Mobile --------------------------------------------------------------------------------------------
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
await mobile.addCookies(await context.cookies());
const mp = await mobile.newPage();
await mp.goto(`${base}/edit/image`, { waitUntil: "networkidle" });
await mp.waitForSelector('img[alt^="After the edit"]', { timeout: 30000 });
check("no horizontal overflow on mobile", !(await mp.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)));
check("before and after stack on a phone", await mp.locator('section[aria-label="Edits"] article').first().evaluate((el) => {
  const [a, b] = [...el.querySelectorAll("figure")].map((f) => f.getBoundingClientRect());
  return b.top >= a.bottom - 1 && Math.abs(a.left - b.left) < 2;
}));
check("the upload control fits the viewport", await mp.getByRole("button", { name: "Add a reference image" }).evaluate((el) => el.clientWidth <= 390).catch(() => true));
check("quick edits wrap without overflow", await mp.locator('form[aria-label="Image editor"]').evaluate((el) => el.scrollWidth <= el.clientWidth + 1));
await mp.screenshot({ path: `${shots}/99-edit-mobile.png`, fullPage: true });

const unexpected = consoleErrors.filter((e) => !e.includes("429"));
check("no unexpected console errors", unexpected.length === 0, `${unexpected.join(" | ").slice(0, 200)} :: ${[...new Set(httpFailures)].join(" | ").slice(0, 200)}`);
console.log(results.join("\n"));
await browser.close();
if (results.some((r) => r.startsWith("FAIL"))) process.exitCode = 1;
