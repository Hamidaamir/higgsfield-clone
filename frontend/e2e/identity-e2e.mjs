// R11: product identity, edge states and a whole-app route sweep.
// Runs against the backend in USE_FAKE_PROVIDERS mode; no generation is ever submitted.
import { readdir } from 'node:fs/promises';
import { base, check, setup, signup, goto, matrix, finish } from './r9-helpers.mjs';

const { browser, context, page } = await setup();

/** Routes discovered from the app directory, with fixtures for the dynamic segments. */
async function discoverRoutes() {
  const roots = ['src/app', 'src/app/(marketing)', 'src/app/(app)', 'src/app/(auth)'];
  const found = new Set(['/']);
  for (const root of roots) {
    let entries;
    try {
      entries = await readdir(root, { withFileTypes: true, recursive: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isFile() || entry.name !== 'page.tsx') continue;
      const dir = entry.parentPath ?? entry.path;
      const segments = dir
        .replace(/\\/g, '/')
        .replace(/^src\/app/, '')
        .split('/')
        .filter((s) => s && !s.startsWith('('));
      if (segments.some((s) => s.startsWith('['))) continue; // dynamic: covered by fixtures below
      found.add('/' + segments.join('/'));
    }
  }
  return [...found].map((r) => (r === '/' ? '/' : r.replace(/\/$/, '')));
}

const DYNAMIC_FIXTURES = ['/models/flux-1-schnell', '/models/seedance-2-5', '/tools/create-image', '/tools/relight'];
const NEEDS_AUTH = ['/generate/image', '/generate/video', '/generate/audio', '/edit/image', '/edit/video', '/history', '/projects', '/settings'];

try {
  // ------------------------------------------------------------------ identity
  await goto(page, '/');
  const shell = page.locator('header').first();
  check('wordmark reads FORMA.', (await shell.getByRole('link', { name: 'Forma home' }).innerText()).replace(/\s/g, '') === 'FORMA.');
  check('wordmark is typographic, not an image', (await shell.getByRole('link', { name: 'Forma home' }).locator('img, svg').count()) === 0);
  check('the accent full stop is decorative', (await shell.getByRole('link', { name: 'Forma home' }).locator('[aria-hidden="true"]').count()) === 1);
  check('document title carries the product and descriptor', (await page.title()) === 'Forma — AI creative studio', await page.title());
  check('meta description is truthful about scope',
    /images, video and speech/i.test(await page.locator('meta[name="description"]').getAttribute('content')));

  const body = await page.locator('body').innerText();
  check('no old product identity in the shell', !/higgsfield/i.test(body));
  check('no assessment or clone language', !/assessment|take-home|not affiliated|\bclone\b/i.test(body));
  const footer = page.locator('footer');
  check('footer carries the Forma masthead', (await footer.getByRole('link', { name: 'Forma home' }).count()) === 1);
  check('footer signs off with the descriptor', /AI creative studio\./i.test(await footer.innerText()), (await footer.innerText()).slice(-60));

  await page.setViewportSize({ width: 390, height: 844 });
  check('wordmark survives at mobile width', await shell.getByRole('link', { name: 'Forma home' }).isVisible());
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.waitForTimeout(300);
  check('mobile drawer carries no old identity', !/higgsfield/i.test(await page.locator('body').innerText()));
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1440, height: 900 });

  await goto(page, '/login');
  check('auth shell shows the Forma wordmark', (await page.getByRole('link', { name: 'Forma home' }).count()) >= 1);
  check('login page has no old identity', !/higgsfield/i.test(await page.locator('body').innerText()));
  check('login title is namespaced', (await page.title()).includes('· Forma'), await page.title());
  await matrix(page, 'identity-login');

  // ------------------------------------------------------------------ catalog cleanup
  const models = await (await context.request.get(`${base}/api/models?type=image`)).json();
  check('real provider models are untouched',
    models.some((m) => m.name === 'FLUX.1 Schnell') && models.some((m) => m.name === 'SDXL Lightning'));
  for (const [path, gone] of [['/image', 'Soul'], ['/video', 'Genjutsu'], ['/video', 'Reframe'], ['/video', 'Explainer']]) {
    await goto(page, path);
    const text = await page.locator('main').innerText();
    check(`${path}: competitor entry "${gone}" is gone`, !new RegExp(gone, 'i').test(text));
    check(`${path}: no fabricated Forma model`, !/Forma (Soul|Genjutsu|Video|Image|Audio) ?[0-9.]*/i.test(text));
  }
  await goto(page, '/image');
  check('/image still lists real models', /FLUX\.1 Schnell/.test(await page.locator('main').innerText()));
  const deadLinks = [];
  for (const path of ['/image', '/video', '/audio']) {
    await goto(page, path);
    const hrefs = await page.locator('main a[href^="/models/"], main a[href^="/tools/"]').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    for (const href of [...new Set(hrefs)]) {
      const res = await context.request.get(base + href);
      if (!res.ok()) deadLinks.push(`${href} → ${res.status()}`);
    }
  }
  check('every catalog link still resolves', deadLinks.length === 0, deadLinks.join(', '));
  check('the removed model pages 404', (await context.request.get(`${base}/models/higgsfield-soul-2`)).status() === 404);
  check('the removed tool pages 404', (await context.request.get(`${base}/tools/reframe`)).status() === 404);

  // ------------------------------------------------------------------ not found + errors
  await goto(page, '/definitely-not-a-route');
  check('404 renders the editorial page', (await page.getByRole('heading', { name: 'Page not found', level: 1 }).count()) === 1);
  check('404 offers Create and Archive', (await page.getByRole('link', { name: 'Back to Create' }).count()) === 1 && (await page.getByRole('link', { name: 'Open Archive' }).count()) === 1);
  check('404 mounts exactly one header', (await page.locator('header').count()) === 1);
  check('404 exposes no stack trace',
    !/\bat [\w$.]+ \(|\.tsx?:\d+|stack trace|TypeError|ReferenceError/i.test(await page.locator('main').innerText()));
  await matrix(page, 'not-found');

  await goto(page, '/tools/does-not-exist');
  check('unknown tool slug 404s inside the marketing shell',
    (await page.getByRole('heading', { name: 'Page not found', level: 1 }).count()) === 1 && (await page.locator('header').count()) === 1);

  // ------------------------------------------------------------------ auth guard + API failure
  await goto(page, '/settings');
  check('protected route redirects when signed out', new URL(page.url()).pathname === '/login');
  const user = await signup(context, 'r11');

  // Loading: hold /api/auth/me open and check the guard's own skeleton appears.
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  await page.route('**/api/auth/me', async (r) => { await gate; await r.continue(); });
  await page.goto(base + '/settings', { waitUntil: 'domcontentloaded' });
  await page.locator('[aria-busy="true"][aria-label="Loading"]').waitFor({ timeout: 15000 });
  check('auth guard shows an accessible loading state', true);
  await page.screenshot({ path: `${process.argv[2] ?? 'test-results/r11'}/guard-loading.png` });
  release();
  await page.waitForLoadState('networkidle');
  await page.unroute('**/api/auth/me');

  check('authenticated settings renders the account', (await page.locator('main dl').innerText()).includes(user.email));

  // Session failure: the guard explains and offers a way back.
  await page.route('**/api/auth/me', (r) => r.fulfill({ status: 503, json: { detail: 'down' } }));
  await page.reload({ waitUntil: 'networkidle' });
  const sessionError = page.getByRole('heading', { name: "We couldn't verify your session" });
  await sessionError.waitFor({ timeout: 20000 });
  check('session failure is explained, not spun forever', await sessionError.isVisible());
  check('session failure offers retry and sign-in',
    (await page.getByRole('button', { name: 'Try again' }).count()) === 1 && (await page.getByRole('link', { name: 'Sign in' }).count()) === 1);
  check('session failure fabricates no account data', (await page.locator('main dl').count()) === 0);
  check('sign-in link returns to the page you were on',
    (await page.getByRole('link', { name: 'Sign in' }).getAttribute('href')) === '/login?next=%2Fsettings');
  await matrix(page, 'guard-session-error');
  await page.unroute('**/api/auth/me');

  // Session expiry: the cookie stops working while the tab is open.
  await page.reload({ waitUntil: 'networkidle' });
  await context.request.post(`${base}/api/auth/logout`);
  await page.route('**/api/auth/me', (r) => r.fulfill({ status: 401, json: { error: { code: 'unauthorized', message: 'Authentication required.' } } }));
  await page.goto(base + '/history', { waitUntil: 'networkidle' });
  await page.waitForURL(/\/login/, { timeout: 20000 });
  check('an expired session lands on login with a return path',
    new URL(page.url()).searchParams.get('next') === '/history', page.url());
  await page.unroute('**/api/auth/me');

  // Archive, Image Studio and System with the API failing.
  const signedIn = await signup(context, 'r11b');
  check('re-authenticated for API failure checks', Boolean(signedIn.email));
  // The API client retries a 5xx once after 1.5s, so the message is awaited rather than polled.
  for (const [path, probe, phrase] of [
    ['/history', '**/api/generations*', /could not be loaded/i],
    ['/generate/image', '**/api/models*', /Models could not be loaded/i],
  ]) {
    await page.route(probe, (r) => r.fulfill({ status: 503, json: { detail: 'down' } }));
    await goto(page, path);
    await page.getByText(phrase).first().waitFor({ timeout: 20000 });
    const text = await page.locator('main').innerText();
    check(`${path}: failure is stated in words`, phrase.test(text), text.replace(/\n/g, ' ').slice(0, 110));
    check(`${path}: no fabricated success content`, !/\bCompleted\b/i.test(text));
    check(`${path}: offers a way forward`, /try again|refresh/i.test(text));
    await page.unroute(probe);
  }
  // A studio whose models failed must not offer to generate.
  await page.route('**/api/models*', (r) => r.fulfill({ status: 503, json: { detail: 'down' } }));
  await goto(page, '/generate/image');
  await page.getByText(/Models could not be loaded/i).first().waitFor({ timeout: 20000 });
  await page.locator('#image-prompt').fill('a harbour at dawn');
  check('/generate/image: generate stays disabled without models',
    await page.getByRole('form', { name: 'Image generator' }).getByRole('button', { name: 'Generate', exact: true }).isDisabled());
  await page.unroute('**/api/models*');
  await page.route('**/api/health', (r) => r.fulfill({ status: 503, json: { detail: 'down' } }));
  await goto(page, '/system');
  await page.waitForTimeout(2500);
  check('/system reports a failing check honestly', /Failing/i.test(await page.locator('main').innerText()));
  check('/system invents no uptime history', !/uptime|99\.9|incident/i.test(await page.locator('main').innerText()));
  await page.unroute('**/api/health');
  await goto(page, '/system');
  await page.getByText(/Reachable · version/).waitFor({ timeout: 30000 });
  check('/system recovers to a healthy check', /\bOK\b/i.test(await page.locator('main').innerText()));

  // ------------------------------------------------------------------ route sweep
  const routes = [...(await discoverRoutes()), ...DYNAMIC_FIXTURES].sort();
  check('route discovery found the whole app', routes.length >= 25, `${routes.length} routes`);
  const overflow = [];
  const crashed = [];
  const oldIdentity = [];
  const headings = [];
  for (const route of routes) {
    for (const [theme, width] of [['light', 1440], ['dark', 1440], ['light', 768], ['dark', 390]]) {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((t) => window.localStorage.setItem('hf.theme', t), theme);
      await page.goto(base + route, { waitUntil: 'networkidle' });
      await page.evaluate((t) => { localStorage.setItem('hf.theme', t); document.documentElement.dataset.theme = t; }, theme);
      const url = new URL(page.url());
      if (NEEDS_AUTH.includes(route) && url.pathname === '/login') continue; // gated, verified above
      const text = await page.locator('body').innerText();
      if (/Application error|Unhandled Runtime Error|This page stopped short/i.test(text)) crashed.push(`${route} (${theme} ${width})`);
      if (/higgsfield|assessment build|not affiliated/i.test(text)) oldIdentity.push(`${route} (${theme} ${width})`);
      if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) overflow.push(`${route} ${theme} ${width}`);
      if (width === 1440 && theme === 'light') {
        const h1s = await page.locator('h1').count();
        if (h1s !== 1) headings.push(`${route} → ${h1s} h1`);
      }
    }
  }
  check('no route crashes in any theme or width', crashed.length === 0, crashed.join(', '));
  check('no route shows the old identity', oldIdentity.length === 0, oldIdentity.join(', '));
  check('no route overflows horizontally', overflow.length === 0, overflow.join(', '));
  check('every route has exactly one h1', headings.length === 0, headings.join(', '));
  check('route sweep covered 4 combinations per route', routes.length * 4 >= 100, `${routes.length * 4} page loads`);
} finally {
  await finish(browser);
}
