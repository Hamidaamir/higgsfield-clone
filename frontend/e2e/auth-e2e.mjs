// Browser-level check of the auth flow against the local stack (next start :3000 + uvicorn :8000).
import { chromium } from "playwright";

const base = "http://127.0.0.1:3000";
const shots = process.argv[2];
const email = `browser-${Date.now()}@example.com`;
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(String(e)));
page.on("response", (r) => r.status() >= 400 && console.log("HTTP", r.status(), r.url()));

// Restart the uvicorn server to pick up the errors.py change is the caller's job; here we just drive the UI.
await page.goto(`${base}/signup`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${shots}/01-signup-methods.png` });
await page.getByRole("button", { name: /Continue with Email/ }).click();
await page.screenshot({ path: `${shots}/02-signup-form.png` });

// Client validation: submit empty
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForTimeout(300);
check("client validation shows errors", (await page.getByRole("alert").count()) >= 3);
await page.screenshot({ path: `${shots}/03-signup-validation.png` });

await page.fill("#signup-name", "Browser Tester");
await page.fill("#signup-email", email);
await page.fill("#signup-password", "passw0rd1");
await page.check("#signup-terms");
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL(`${base}/generate/image`, { timeout: 15000 });
check("signup redirects to /generate/image", page.url().endsWith("/generate/image"));
await page.waitForSelector("text=Browser Tester");
await page.screenshot({ path: `${shots}/04-after-signup.png` });

// Refresh persistence
await page.reload();
await page.waitForSelector("text=Browser Tester", { timeout: 15000 });
check("session persists after refresh", true);

// Protected page directly
await page.goto(`${base}/history`);
check("logged-in user can open /history", page.url().endsWith("/history"));

// Logout via menu
await page.getByRole("button", { name: "Account menu" }).click();
await page.getByRole("menuitem", { name: "Log out" }).click();
await page.waitForURL(`${base}/`, { timeout: 15000 });
await page.waitForSelector("text=Sign up");
check("logout returns to explore with Login/Sign up", true);

// Anonymous protected route
await page.goto(`${base}/generate/image`);
await page.waitForURL(/\/login\?next=/);
check("anonymous protected route redirects to login", true);
await page.screenshot({ path: `${shots}/05-login-methods.png` });

// Wrong password
await page.getByRole("button", { name: /Continue with Email/ }).click();
await page.fill("#login-email", email);
await page.fill("#login-password", "wrongpass1");
await page.getByRole("button", { name: "Log in" }).click();
await page.waitForSelector("text=Invalid email or password.");
check("wrong password shows generic error", true);
await page.screenshot({ path: `${shots}/06-login-error.png` });

// Correct login honours ?next
await page.fill("#login-password", "passw0rd1");
await page.getByRole("button", { name: "Log in" }).click();
await page.waitForURL(`${base}/generate/image`, { timeout: 15000 });
check("login redirects to next param", true);

// Mobile viewport screenshot of signup
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mp = await mobile.newPage();
await mp.goto(`${base}/signup`);
await mp.screenshot({ path: `${shots}/07-signup-mobile.png`, fullPage: false });
await mp.getByRole("button", { name: /Continue with Email/ }).click();
await mp.screenshot({ path: `${shots}/08-signup-form-mobile.png` });
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
check("no horizontal overflow on mobile", !overflow);

// --- Google sign-in (FakeGoogleOAuth in USE_FAKE_PROVIDERS mode: the round trip stays local) ------
// The OAuth callback redirects to PUBLIC_APP_URL (http://localhost:3000), so this part runs there.
const gBase = "http://localhost:3000";
const g = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const providers = await (await g.request.get(`${gBase}/api/auth/providers`)).json();
check("providers endpoint offers Google sign-in", providers.google === true);
await g.goto(`${gBase}/login?next=%2Fgenerate%2Fvideo`, { waitUntil: "networkidle" });
const googleLink = g.getByRole("link", { name: "Continue with Google" });
check("Google button starts the OAuth flow with next preserved", (await googleLink.getAttribute("href")) === "/api/auth/google/start?next=%2Fgenerate%2Fvideo");
check("Apple and Microsoft are explicitly unavailable, not fake", (await g.getByRole("button", { name: /Continue with Apple/ }).isDisabled()) && (await g.getByRole("button", { name: /Continue with Microsoft/ }).isDisabled()));

// The rest of this section drives the local stand-in consent page, which only exists when the
// backend has no real Google credentials. With real ones configured, following the link would
// leave the app for accounts.google.com, so the round trip is skipped instead.
if (!providers.fake_google) {
  check("Google round trip skipped (real OAuth credentials configured)", true, "run without GOOGLE_CLIENT_ID to exercise it");
  const unexpectedEarly = consoleErrors.filter((e) => !e.includes("401"));
  check("no unexpected console errors", unexpectedEarly.length === 0, unexpectedEarly.join(" | ").slice(0, 300));
  console.log(results.join(String.fromCharCode(10)));
  await browser.close();
  process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
}
await googleLink.click();
await g.waitForURL(/\/api\/auth\/google\/fake-consent\?/);
check("start redirects to the consent step with a state parameter", /state=[A-Za-z0-9_-]{16,}/.test(g.url()));
const gEmail = `google-${Date.now()}@example.com`;
await g.fill('input[name="email"]', gEmail);
await g.fill('input[name="name"]', "Google Tester");
await g.getByRole("button", { name: "Continue" }).click();
await g.waitForURL(/\/generate\/video$/);
check("callback lands on the requested page with a session", true);
const gMe = await (await g.request.get(`${gBase}/api/auth/me`)).json();
check("Google user has a local account without a password", gMe.user?.email === gEmail && gMe.user?.has_password === false);
await g.goto(`${gBase}/settings`, { waitUntil: "networkidle" });
check("settings explains the Google sign-in method", (await g.getByText("Google account").count()) === 1);
await g.getByRole("button", { name: "Account menu" }).click();
await g.getByRole("menuitem", { name: "Log out" }).click();
await g.waitForURL((u) => !u.pathname.startsWith("/settings"));
check("logout works after Google login", (await (await g.request.get(`${gBase}/api/auth/me`)).json()).user === null);
await g.goto(`${gBase}/login`, { waitUntil: "networkidle" });
await g.getByRole("link", { name: "Continue with Google" }).click();
await g.waitForURL(/fake-consent/);
await g.fill('input[name="email"]', gEmail);
await g.getByRole("button", { name: "Continue" }).click();
await g.waitForURL(/\/generate\/image$/);
const gMe2 = await (await g.request.get(`${gBase}/api/auth/me`)).json();
check("second Google login reuses the same account", gMe2.user?.id === gMe.user?.id);
await g.getByRole("button", { name: "Account menu" }).click();
await g.getByRole("menuitem", { name: "Log out" }).click();
await g.waitForURL((u) => !u.pathname.startsWith("/generate"));
await g.goto(`${gBase}/login`, { waitUntil: "networkidle" });
await g.getByRole("link", { name: "Continue with Google" }).click();
await g.waitForURL(/fake-consent/);
await g.uncheck('input[name="verified"]');
await g.getByRole("button", { name: "Continue" }).click();
await g.waitForURL(/\/login\?error=google_unverified/);
await g.waitForLoadState("networkidle");
check("unverified Google email is refused with a clear message", (await g.getByRole("alert").first().innerText()).includes("isn't verified"));
check("no session after a refused Google sign-in", (await (await g.request.get(`${gBase}/api/auth/me`)).json()).user === null);

const unexpected = consoleErrors.filter((e) => !e.includes("401"));
check("no unexpected console errors", unexpected.length === 0, unexpected.join(" | ").slice(0, 300));
console.log(results.join("\n"));
await browser.close();
