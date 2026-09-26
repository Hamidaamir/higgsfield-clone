// R8: deterministic mixed-media browser coverage. Auth/model registry are real;
// generation/asset fixtures intercept browser API traffic. Run only on the fake-provider stack.
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.E2E_BASE ?? "http://localhost:3001";
const shots = process.argv[2] ?? "test-results/r8";
await mkdir(shots, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const page = await context.newPage();
const checks = [];
const check = (name, ok) => { assert.ok(ok, name); checks.push(`PASS ${name}`); console.log(`PASS ${name}`); };
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
const today = new Date(); today.setHours(12, 0, 0, 0);
const date = (days) => new Date(today.getTime() - days * 86400000).toISOString();
const photo = "/showcase/flux-lime-jacket.jpg";
const asset = (id, type = "image", w = 1024, h = 1024) => ({ id, media_type: type, url: type === "audio" ? "/showcase/aura-welcome.mp3" : type === "video" ? "/showcase/ltx-paper-boat.mp4" : photo, thumbnail_url: type === "audio" ? null : photo, width: type === "audio" ? null : w, height: type === "audio" ? null : h, duration_ms: type === "image" ? null : 8000, mime_type: `${type}/${type === "image" ? "jpeg" : type === "audio" ? "mpeg" : "mp4"}`, size_bytes: 100, created_at: date(0) });
const gen = (id, type, prompt, settings = {}, assets = [asset(`${id}-1`, type)], days = 0, status = "completed") => ({ id, type, prompt, settings, assets, status, model_id: type === "audio" ? "aura-1" : type === "video" ? "ltx-video" : "sdxl-lightning", provider: "fixture", error_code: status === "failed" ? "provider_error" : null, error_message: status === "failed" ? "The provider could not complete this request." : null, credit_cost: 0, parent_generation_id: null, created_at: date(days), started_at: date(days), completed_at: status === "completed" ? date(days) : null });
const fixtures = [
  gen("single", "image", "A lime jacket in the late afternoon light", { aspect_ratio: "2:3", negative_prompt: "blur & logos", batch_size: 1 }, [asset("single-1", "image", 800, 1200)]),
  gen("batch", "image", "Four studies of colour, light and movement", { aspect_ratio: "16:9", batch_size: 4 }, Array.from({ length: 4 }, (_, i) => asset(`batch-${i}`, "image", 1600, 900))),
  gen("video", "video", "A paper boat crossing still water", { aspect_ratio: "16:9", duration_s: 5 }, [asset("video-1", "video", 1600, 900)]),
  gen("audio", "audio", "Welcome to the studio. Take your time, and make something worth keeping.", { voice: "aura-asteria-en", language: "en", style_prompt: "warm and unhurried", batch_size: 2 }, [asset("take-1", "audio"), asset("take-2", "audio")]),
  gen("edit", "image", "Soften the light, keep the colour", { reference_asset_id: "reference", aspect_ratio: "1:1" }),
  gen("edit-shared", "image", "A second treatment of the same reference", { reference_asset_id: "reference", aspect_ratio: "1:1" }),
  gen("missing", "image", "An edit whose original is unavailable", { reference_asset_id: "missing-reference", aspect_ratio: "1:1" }, undefined, 1),
  gen("audio-single", "audio", "A single reading from yesterday", { batch_size: 1 }, undefined, 1),
  ...["image", "video", "audio"].flatMap((type) => [
    gen(`${type}-queued`, type, `${type} waiting in the queue`, { aspect_ratio: "16:9", batch_size: 2 }, [], 1, "queued"),
    gen(`${type}-processing`, type, `${type} in production`, { aspect_ratio: "16:9" }, [], 1, "processing"),
    gen(`${type}-failed`, type, `${type} request needs another attempt`, {}, [], 2, "failed"),
  ]),
  gen("edit-queued", "image", "An edit in progress", { reference_asset_id: "reference" }, [], 2, "queued"),
  gen("long", "audio", "A long script. " + "Quiet observations about light and space. ".repeat(30), { style_prompt: "Considered, with room between each thought. ".repeat(8) }, undefined, 3),
  gen("special", "image", 'Café & colour? 100%_ "a study"', {}, undefined, 3),
  ...Array.from({ length: 8 }, (_, i) => gen(`older-${i}`, "image", `Older study ${i + 1}`, {}, undefined, 4 + i)),
];
let mode = "all", referenceCalls = 0, resolveReference;
let holdReference = true, polls = {}, transition = false, retryId;
const requests = [];
await page.goto(`${base}/signup?next=%2Fhistory`);
await page.fill("#signup-name", "Archive QA");
await page.fill("#signup-email", `archive-${Date.now()}@example.com`);
await page.fill("#signup-password", "passw0rd1");
await page.check("#signup-terms");
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL(/\/history$/);
await page.getByRole("heading", { name: "Nothing here yet." }).waitFor();
check("empty Archive has all four real studio links", await page.locator('main a[href="/edit/image"]').count() > 0 && await page.getByRole("link", { name: "Image Studio", exact: true }).count() > 0);
await page.screenshot({ path: `${shots}/archive-empty.png`, fullPage: true });

// Exercise the real backend's escaped prompt/model search before installing fixtures.
const safety = await (await page.request.get(`${base}/api/openapi.json`)).json();
assert.ok(safety.paths["/api/dev-assets/{key}"], "Run only against USE_FAKE_PROVIDERS=1 (dev-assets router must be mounted)");
const literal = 'Café & colour? 100%_ "a study"';
const seeded = await page.request.post(`${base}/api/generations/image`, { data: { prompt: literal, model_id: "sdxl-lightning", aspect_ratio: "16:9", batch_size: 1 } });
assert.equal(seeded.status(), 202);
await page.reload();
await page.getByRole("textbox", { name: "Search prompts and models" }).fill(literal);
await page.locator("article").waitFor();
check("real API search matches literal special characters", (await page.locator("article h3").innerText()) === literal);
const literalQuery = await (await page.request.get(`${base}/api/generations?q=${encodeURIComponent("100%_")}&type=image&limit=24`)).json();
check("real API escapes percent and underscore, retains type and q", literalQuery.items.length === 1 && literalQuery.items[0].prompt === literal);
const modelQuery = await (await page.request.get(`${base}/api/generations?q=sdxl-lightning&limit=24`)).json();
check("real API matches model ID", modelQuery.items.length === 1);

await page.route("**/api/assets/*", async (route) => {
  const id = new URL(route.request().url()).pathname.split("/").at(-1);
  if (id === "reference") {
    referenceCalls++;
    if (holdReference) await new Promise((resolve) => { resolveReference = resolve; });
    await route.fulfill({ json: asset("reference") });
  } else await route.fulfill({ status: 404, json: { error: { code: "not_found", message: "Asset not found." } } });
});
await page.route("**/api/generations**", async (route) => {
  const url = new URL(route.request().url());
  if (url.pathname.endsWith("/retry")) {
    retryId = url.pathname.split("/").at(-2);
    check("retry uses existing POST mutation", route.request().method() === "POST");
    return route.fulfill({ status: 202, json: gen("retry-child", fixtures.find((g) => g.id === retryId).type, "Retry", {}, [], 0, "queued") });
  }
  if (url.pathname === "/api/generations") {
    requests.push({ time: Date.now(), params: Object.fromEntries(url.searchParams) });
    let list = mode === "empty" ? [] : fixtures;
    if (url.searchParams.has("type")) list = list.filter((g) => g.type === url.searchParams.get("type"));
    if (url.searchParams.has("q")) { const q = url.searchParams.get("q").toLowerCase(); list = list.filter((g) => `${g.prompt} ${g.model_id}`.toLowerCase().includes(q)); }
    const offset = Number(url.searchParams.get("cursor") ?? 0), limit = Number(url.searchParams.get("limit"));
    return route.fulfill({ json: { items: list.slice(offset, offset + limit), next_cursor: list.length > offset + limit ? String(offset + limit) : null } });
  }
  const id = url.pathname.split("/").at(-1), g = fixtures.find((g) => g.id === id);
  polls[id] = (polls[id] ?? 0) + 1;
  return route.fulfill({ json: transition && id === "image-queued" ? { ...g, status: "completed", assets: [asset("finished")] } : g ?? gen(id, "image", "Retry", {}, []) });
});
const record = (id) => page.locator(`article[data-generation-id="${id}"]`);
const load = async (suffix = "") => { await page.goto(`${base}/history${suffix}`); await page.locator("article").first().waitFor(); };
const shot = async (name) => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${shots}/${name}.png`, fullPage: true });
};
await load();
await page.getByRole("status", { name: "" }).count();
await record("edit").getByText("Loading the original image…").waitFor();
check("reference loading is honest", await record("edit").getByText("Loading the original image…").isVisible());
holdReference = false; resolveReference();
await record("edit").getByRole("img", { name: /Before the edit/ }).waitFor();
check("shared edit reference uses one cached fetch", referenceCalls === 1);
check("one generation groups all four image plates", await record("batch").locator("figure").count() === 4);
check("audio batch groups two takes without images", await record("audio").locator("audio").count() === 2 && await record("audio").locator("img").count() === 0);
check("video Archive loads poster only, no video players", await record("video").locator("img").count() === 1 && await page.locator("article video").count() === 0);
check("video poster preserves asset aspect ratio", await record("video").getByRole("button", { name: /^Open video/ }).evaluate((el) => el.style.aspectRatio === "1600 / 900"));
check("audio metadata and decorative waveform", (await record("audio").innerText()).includes("warm and unhurried") && await record("audio").locator("[aria-hidden] span[style]").count() === 96);
check("audio metadata preload, no autoplay", await page.locator("article audio").evaluateAll((els) => els.every((el) => el.preload === "metadata" && !el.autoplay)));
check("real image ratio is retained", await record("single").getByRole("button", { name: /^Open image/ }).evaluate((el) => el.style.aspectRatio === "800 / 1200"));
check("date headings preserve Today and Yesterday order", (await page.locator("main h2").allTextContents()).slice(0, 2).join(",") === "Today,Yesterday");
check("images, edits and audio remain in correct date sections", await page.getByRole("region", { name: "Today", exact: true }).locator('[data-generation-id="batch"]').count() === 1 && await page.getByRole("region", { name: "Yesterday", exact: true }).locator('[data-generation-id="audio-single"]').count() === 1);
await record("missing").getByText("The original image is no longer available.").waitFor();
check("unavailable reference leaves After usable", await record("missing").getByRole("button", { name: /^Open image/ }).count() === 1);
check("pending and failed states are announced", await page.locator("article [role=status]").count() >= 6 && await page.locator("article [role=alert]").count() === 3);
await page.getByRole("button", { name: "Load more" }).click();
await record("older-7").waitFor();
check("cursor pagination retains generation grouping", await page.locator("article").count() === fixtures.length && requests.some((r) => r.params.cursor === "24" && r.params.limit === "24"));

for (const [id, index, label] of [["batch", 2, "Open image 3:"], ["audio", 1, "Details for output 2:"]]) {
  await record(id).getByRole("button", { name: new RegExp(`^${label}`) }).click();
  await page.getByRole("dialog").waitFor();
  check(`${id} opens assetIndex ${index}`, (await page.getByRole("dialog").innerText()).includes(`${index + 1} / ${fixtures.find((g) => g.id === id).assets.length}`));
  if (id === "batch") await shot("archive-detail");
  await page.keyboard.press("Escape");
}
await record("video").getByRole("button", { name: /^Open video/ }).click();
check("video plays only through accessible detail controls", await page.getByRole("dialog").locator("video").evaluate((el) => el.controls && !el.autoplay && el.preload === "metadata"));
await page.keyboard.press("Escape");

const search = page.getByRole("textbox", { name: "Search prompts and models" });
const before = requests.length;
await search.fill("colour"); await page.waitForTimeout(100);
check("search is not sent before debounce", requests.length === before);
await page.waitForFunction(() => document.querySelectorAll("article").length === 3);
check("debounced q reaches the API", requests.at(-1).params.q === "colour");
await shot("archive-search");
await page.getByRole("tab", { name: "Images", exact: true }).click();
await page.waitForURL(/type=image/); await page.waitForTimeout(350);
check("search combines with type filter", requests.at(-1).params.q === "colour" && requests.at(-1).params.type === "image");
await search.fill('Café & colour? 100%_ "a study"');
await page.waitForFunction(() => document.querySelectorAll("article").length === 1);
check("special-character q round trips intact", requests.at(-1).params.q === 'Café & colour? 100%_ "a study"');
await search.fill("no-matching-archive-work");
await page.getByRole("heading", { name: "No matches" }).waitFor();
check("empty search states actual term", await page.getByText(/No results in your archive for/).textContent().then((s) => s.includes("no-matching-archive-work")));
await shot("archive-no-results");
await page.getByRole("button", { name: "Clear search", exact: true }).first().click();
await record("single").waitFor();
check("clear search restores results", await search.inputValue() === "");
await page.getByRole("tab", { name: "Images", exact: true }).focus();
await page.keyboard.press("ArrowRight");
await page.waitForURL(/type=video/);
check("keyboard arrow selects filter and updates URL", await page.getByRole("tab", { name: "Videos", exact: true }).getAttribute("aria-selected") === "true");

for (const [type, tab] of [["image", "Images"], ["video", "Videos"], ["audio", "Audio"]]) {
  await load(`?type=${type}`);
  check(`direct ${type} filter URL and selected semantics`, await page.getByRole("tab", { name: tab, exact: true }).getAttribute("aria-selected") === "true");
  await page.reload(); await page.locator("article").first().waitFor();
  check(`${type} survives refresh`, await page.getByRole("tab", { name: tab, exact: true }).getAttribute("aria-selected") === "true");
  await shot(`archive-${type}`);
}
await page.getByRole("tab", { name: "All", exact: true }).click();
await page.waitForURL(/\/history$/); await record("single").waitFor();
check("All removes type parameter", !new URL(page.url()).searchParams.has("type"));
// Native history changes also drive the URL-synced filter, rather than stale local state.
await page.evaluate(() => history.pushState(null, "", "/history?type=video"));
await page.getByRole("tab", { name: "Videos", exact: true }).waitFor();
await page.waitForTimeout(300);
await page.goBack(); await record("single").waitFor();
check("back restores All", await page.getByRole("tab", { name: "All", exact: true }).getAttribute("aria-selected") === "true");
await page.goForward(); await page.waitForTimeout(300);
check("forward restores Videos", await page.getByRole("tab", { name: "Videos", exact: true }).getAttribute("aria-selected") === "true");
await load();
transition = true;
await record("image-queued").locator("img").waitFor({ timeout: 10000 });
const completedPolls = polls["image-queued"];
await page.waitForTimeout(2500);
check("active item completes in place and stops polling", polls["image-queued"] === completedPolls);
check("completed and failed records never poll", !polls.single && !polls["image-failed"]);

for (const type of ["image", "video", "audio"]) {
  await load(`?type=${type}`);
  await record(`${type}-failed`).getByRole("button", { name: "Retry", exact: true }).click();
  await page.waitForURL(new RegExp(`/generate/${type}`));
  check(`${type} retry uses original generation ID`, retryId === `${type}-failed`);
}
await load("?type=image");
await record("edit").getByRole("button", { name: /^Reuse prompt:/ }).click();
await page.waitForURL(/\/generate\/image\?/);
check("edit reuse preserves safe image route without reference ID", !new URL(page.url()).searchParams.has("reference_asset_id") && !page.url().includes("reference"));

for (const width of [1440, 768, 390]) for (const theme of ["light", "dark"]) {
  if (width === 768 && theme === "dark") continue;
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.evaluate((theme) => localStorage.setItem("hf.theme", theme), theme);
  await load();
  await page.getByRole("button", { name: "Load more" }).click(); await record("older-7").waitFor();
  await page.waitForTimeout(250);
  check(`${theme} ${width} has no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const beforeBox = await record("edit").locator("figure").first().boundingBox();
  const afterBox = await record("edit").getByRole("group", { name: "After", exact: true }).boundingBox();
  check(`${width} edit comparison layout`, width === 390 ? afterBox.y > beforeBox.y + beforeBox.height : afterBox.x > beforeBox.x);
  const contrast = await record("single").locator("time").evaluate((el) => {
    const rgb = (value) => value.match(/[\d.]+/g).slice(0, 3).map(Number);
    const luminance = (values) => values.map((n) => n / 255).map((n) => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4).reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0);
    const a = luminance(rgb(getComputedStyle(el).color));
    const b = luminance(rgb(getComputedStyle(document.body).backgroundColor));
    return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  });
  check(`${theme} ${width} small metadata contrast meets AA`, contrast >= 4.5);
  await shot(`archive-${theme}-${width}`);
  for (const id of ["batch", "video", "audio", "audio-single", "edit", "missing", "image-processing", "video-queued", "audio-queued", "image-failed", "long"]) {
    await record(id).screenshot({ path: `${shots}/entry-${id}-${theme}-${width}.png` });
  }
}
await search.focus();
check("search has keyboard focus", await search.evaluate((el) => el === document.activeElement));
await shot("archive-mobile-focus");
mode = "empty";
await page.goto(`${base}/history?type=video`);
await page.getByRole("heading", { name: "No video generations yet." }).waitFor();
check("empty filter distinct from empty Archive", await page.getByRole("link", { name: "Open Video", exact: true }).count() === 1);
await shot("archive-empty-filter");
check("no browser runtime errors", errors.length === 0);
await writeFile(`${shots}/archive-results.txt`, checks.join("\n") + "\n");
await browser.close();
