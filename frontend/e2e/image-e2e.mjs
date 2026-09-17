// Browser-level check of the image generation workflow against the local stack
// with the backend in USE_FAKE_PROVIDERS mode (no real provider quota is used).
import { chromium } from "playwright";

const base = "http://127.0.0.1:3000";
const shots = process.argv[2];
const email = `image-${Date.now()}@example.com`;
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(String(e)));

// Sign up, land on the generator
await page.goto(`${base}/signup`);
await page.getByRole("button", { name: /Continue with Email/ }).click();
await page.fill("#signup-name", "Image Tester");
await page.fill("#signup-email", email);
await page.fill("#signup-password", "passw0rd1");
await page.check("#signup-terms");
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL(`${base}/generate/image`);
await page.waitForSelector("text=Start creating with");
await page.screenshot({ path: `${shots}/10-image-empty.png` });
check("empty workspace hero + dock render", true);

// Generate is disabled without a prompt
const generate = page.locator('form[aria-label="Image generator"] button[type="submit"]');
check("generate disabled with empty prompt", await generate.isDisabled());

// Model picker lists registry models; schnell locks aspect ratio
await page.getByRole("button", { name: "Model" }).click();
await page.waitForSelector('[role="listbox"][aria-label="Models"]');
const modelNames = await page.locator('[role="option"]').allInnerTexts();
check("model picker lists 4 models", modelNames.length === 4, modelNames.map((t) => t.split("\n")[0]).join(", "));
await page.screenshot({ path: `${shots}/11-model-picker.png` });
await page.getByRole("option", { name: /SDXL Lightning/ }).click();
await page.getByRole("button", { name: "Aspect ratio" }).click();
await page.waitForSelector('[role="listbox"][aria-label="Aspect ratio"]');
await page.getByRole("option", { name: /16:9/ }).click();
await page.getByRole("button", { name: "More images" }).click();
check("aspect + batch controls work", (await page.getByRole("button", { name: "Aspect ratio" }).innerText()).includes("16:9"));

// Submit a generation and observe the processing state
await page.fill("#image-prompt", "a red vintage car on a desert highway at sunset, cinematic");
await generate.click();
await page.waitForSelector('[role="status"]', { timeout: 10000 });
const statusCount = await page.locator('[role="status"]').count();
check("processing cards appear immediately (batch of 2)", statusCount === 2, `count=${statusCount}`);
await page.screenshot({ path: `${shots}/12-image-processing.png` });

// Completion via polling
await page.waitForSelector('figure img[src*="dev-assets"]', { timeout: 30000 });
const imgs = await page.locator('figure img[src*="dev-assets"]').count();
check("completed images rendered", imgs === 2, `count=${imgs}`);
await page.screenshot({ path: `${shots}/13-image-completed.png` });

// Persistence across refresh
await page.reload();
await page.waitForSelector('figure img[src*="dev-assets"]', { timeout: 30000 });
check("results survive refresh", (await page.locator("figure").count()) === 2);

// Lightbox
await page.locator("figure button").first().click();
await page.waitForSelector('[role="dialog"]');
check("lightbox opens with metadata", (await page.locator('[role="dialog"]').innerText()).includes("SDXL Lightning"));
await page.screenshot({ path: `${shots}/14-image-lightbox.png` });
await page.keyboard.press("Escape");

// Provider failure path
await page.fill("#image-prompt", "[fail] anything");
await page.keyboard.press("Enter");
await page.waitForSelector('[role="alert"]:has-text("Generation failed")', { timeout: 30000 });
const alertText = await page.locator('[role="alert"]:has-text("Generation failed")').first().innerText();
check("failed card shows safe message + retry", alertText.includes("safety filter") && alertText.includes("Retry"));
await page.screenshot({ path: `${shots}/15-image-failed.png` });

// Client validation: too-long prompt
await page.fill("#image-prompt", "x".repeat(2050));
check("too-long prompt disables generate and shows error", await generate.isDisabled() && (await page.locator("#image-prompt-error").innerText()).includes("2000"));

// Mobile viewport
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
await mobile.addCookies(await context.cookies());
const mp = await mobile.newPage();
await mp.goto(`${base}/generate/image`);
await mp.waitForSelector("figure", { timeout: 30000 });
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
check("no horizontal overflow on mobile", !overflow);
await mp.screenshot({ path: `${shots}/16-image-mobile.png` });

const unexpected = consoleErrors.filter((e) => !e.includes("422"));
check("no unexpected console errors", unexpected.length === 0, unexpected.join(" | ").slice(0, 300));
console.log(results.join("\n"));
await browser.close();
