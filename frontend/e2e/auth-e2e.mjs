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
check("auth page carries no product navigation", (await page.locator('nav[aria-label="Primary"]').count()) === 0);
check("auth header keeps the wordmark home link", (await page.getByRole("link", { name: /Higgsfield home/ }).count()) === 1);
check("auth header keeps the theme control", (await page.getByRole("button", { name: /Color theme/ }).count()) === 1);
check("signup has a single meaningful h1", (await page.locator("h1").count()) === 1);
check("email fields are visible without an extra step", await page.locator("#signup-email").isVisible());
check(
  "no fake credit or plan promises remain",
  !/50 credits|business email|Scale and Enterprise/i.test(await page.locator("body").innerText()),
);
await page.screenshot({ path: `${shots}/01-signup.png` });

// Password reveal is a client-side affordance over the same field.
await page.fill("#signup-password", "passw0rd1");
check("password is masked by default", (await page.locator("#signup-password").getAttribute("type")) === "password");
await page.getByRole("button", { name: "Show password" }).click();
check("password can be revealed", (await page.locator("#signup-password").getAttribute("type")) === "text");
await page.getByRole("button", { name: "Hide password" }).click();
check("password can be masked again", (await page.locator("#signup-password").getAttribute("type")) === "password");

// The login <-> signup switch keeps the deep link.
await page.goto(`${base}/signup?next=%2Fgenerate%2Fvideo`, { waitUntil: "networkidle" });
check(
  "signup switch link preserves next",
  (await page.getByRole("link", { name: "Sign in" }).getAttribute("href")) === "/login?next=%2Fgenerate%2Fvideo",
);
await page.getByRole("link", { name: "Sign in" }).click();
await page.waitForURL(/\/login\?next=%2Fgenerate%2Fvideo/);
check(
  "login switch link preserves next",
  (await page.getByRole("link", { name: "Create an account" }).getAttribute("href")) === "/signup?next=%2Fgenerate%2Fvideo",
);

// Google callback error codes render a restrained banner; unknown codes are ignored.
await page.goto(`${base}/login?error=google`, { waitUntil: "networkidle" });
check("google error banner renders", (await page.getByRole("alert").first().innerText()).includes("didn't complete"));
await page.goto(`${base}/login?error=google_unverified`, { waitUntil: "networkidle" });
check("google unverified banner renders", (await page.getByRole("alert").first().innerText()).includes("isn't verified"));
await page.goto(`${base}/login?error=not-a-real-code`, { waitUntil: "networkidle" });
// Next always renders a visually-hidden route announcer with role=alert; ignore it.
check(
  "unknown error codes are ignored",
  (await page.locator('[role="alert"]:not(#__next-route-announcer__)').count()) === 0,
);

await page.goto(`${base}/signup`, { waitUntil: "networkidle" });

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
check(
  "unimplemented providers are absent rather than shown as dead buttons",
  (await g.getByRole("button", { name: /Continue with (Apple|Microsoft)/ }).count()) === 0 &&
    (await g.getByRole("link", { name: /Continue with (Apple|Microsoft)/ }).count()) === 0,
);

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

// Theme control on the auth page uses the shared store and persists.
const themed = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const tp = await themed.newPage();
await tp.goto(`${base}/login`, { waitUntil: "networkidle" });
await tp.getByRole("button", { name: /Color theme/ }).click();
await tp.getByRole("button", { name: "Dark" }).click();
await tp.waitForFunction(() => document.documentElement.getAttribute("data-theme") === "dark");
check("theme control works from the auth page", (await tp.evaluate(() => getComputedStyle(document.body).backgroundColor)) === "rgb(14, 13, 12)");
await tp.reload({ waitUntil: "domcontentloaded" });
check("theme preference persists across reload", (await tp.evaluate(() => document.documentElement.getAttribute("data-theme"))) === "dark");
await themed.close();

const unexpected = consoleErrors.filter((e) => !e.includes("401"));
check("no unexpected console errors", unexpected.length === 0, unexpected.join(" | ").slice(0, 300));
console.log(results.join("\n"));
await browser.close();
