// R10: the secondary product surfaces — the two real composers, the effects library, and the
// concept/preview family. Runs against the backend in USE_FAKE_PROVIDERS mode; nothing here
// submits a generation, so no provider is ever called.
import { base, check, setup, signup, goto, matrix, finish } from './r9-helpers.mjs';

const { browser, context, page } = await setup();
let generationCalls = 0;
page.on('request', (r) => {
  if (r.url().includes('/api/generations') && r.method() === 'POST') generationCalls += 1;
});

const PREVIEW_ROUTES = [
  ['/canvas', 'Canvas'],
  ['/genjutsu', 'Genjutsu'],
  ['/3d-jutsu', '3D Jutsu'],
  ['/supercomputer', 'Supercomputer'],
  ['/academy', 'Academy'],
  ['/contests', 'Contests'],
  ['/enterprise', 'For teams'],
  ['/integrations/chatgpt', 'ChatGPT plugin'],
  ['/integrations/mcp', 'MCP server'],
];

try {
  // ---------------------------------------------------------------- Cinema Studio (real)
  await goto(page, '/cinema-studio');
  check('cinema: one h1', (await page.getByRole('heading', { level: 1 }).count()) === 1);
  check('cinema: explains it composes rather than generates',
    /does not generate|writes the direction/i.test(await page.locator('main').innerText()));
  const scene = page.locator('#cinema-scene');
  check('cinema: scene field is labelled', await page.getByText('Scene', { exact: true }).isVisible());
  const decks = ['Camera & lens', 'Movement', 'Lighting', 'Colour grade'];
  for (const deck of decks) {
    check(`cinema: ${deck} deck present`, (await page.getByRole('group', { name: deck }).count()) === 1);
  }
  const treatment = page.locator('section[aria-label="Shot treatment"] p').first();

  await scene.fill('A lone figure walks through an empty subway station at night');
  await page.getByRole('button', { name: 'Anamorphic', exact: true }).click();
  await page.getByRole('button', { name: 'Crane up', exact: true }).click();
  await page.getByRole('button', { name: 'Noir', exact: true }).click();
  await page.getByRole('button', { name: 'Black & white', exact: true }).click();
  check('cinema: selection is exposed as pressed state',
    (await page.getByRole('button', { name: 'Anamorphic', exact: true }).getAttribute('aria-pressed')) === 'true');

  const expected = 'A lone figure walks through an empty subway station at night, anamorphic lens, oval bokeh, horizontal flares, crane shot rising up, hard chiaroscuro lighting, deep shadows, black and white, cinematic';
  check('cinema: treatment shows the composed sentence', (await treatment.innerText()).trim() === expected, (await treatment.innerText()).slice(0, 80));

  const cinemaLink = page.getByRole('link', { name: 'Open in Video Studio' });
  const cinemaHref = new URL(base + (await cinemaLink.getAttribute('href')));
  check('cinema: hands off to the video generator', cinemaHref.pathname === '/generate/video');
  check('cinema: prompt is handed over exactly', cinemaHref.searchParams.get('prompt') === expected);
  check('cinema: model and aspect preserved',
    cinemaHref.searchParams.get('model') === 'ltx-video' && cinemaHref.searchParams.get('aspect') === '16:9');

  // Special characters must survive composition and serialisation.
  const tricky = 'A "quiet" street & a sign reading = 50% off, at dusk — café';
  await scene.fill(tricky);
  const trickyHref = new URL(base + (await cinemaLink.getAttribute('href')));
  check('cinema: special characters survive the handoff', trickyHref.searchParams.get('prompt').startsWith(tricky), trickyHref.searchParams.get('prompt').slice(0, 60));

  // Empty scene must not produce a link with a leading empty clause.
  await scene.fill('   ');
  check('cinema: empty scene disables the handoff', (await page.getByRole('link', { name: 'Open in Video Studio' }).count()) === 0);
  check('cinema: empty scene explains itself', (await treatment.innerText()).includes('Describe the scene'));
  await scene.fill('A lone figure walks through an empty subway station at night');
  await matrix(page, 'cinema-studio');

  // Anonymous: the studio is gated, but the composed destination survives the login round trip.
  await page.getByRole('link', { name: 'Open in Video Studio' }).click();
  await page.waitForURL(/\/login\?next=/);
  const gated = new URL(base + decodeURIComponent(new URL(page.url()).searchParams.get('next')));
  check('cinema: the handoff survives the auth gate',
    gated.pathname === '/generate/video' && gated.searchParams.get('prompt').includes('subway station'));

  await signup(context, 'r10');
  await goto(page, '/cinema-studio');
  await page.locator('#cinema-scene').fill('A lone figure walks through an empty subway station at night');

  // The handoff actually lands in the studio with the prompt in place.
  await page.getByRole('link', { name: 'Open in Video Studio' }).click();
  await page.waitForURL(/\/generate\/video\?/);
  await page.locator('#video-prompt').waitFor();
  check('cinema: video composer is prefilled', (await page.locator('#video-prompt').inputValue()).includes('subway station'));

  // ---------------------------------------------------------------- Marketing Studio (real)
  await goto(page, '/marketing-studio');
  check('marketing: one h1', (await page.getByRole('heading', { level: 1 }).count()) === 1);
  check('marketing: no competitor brand placeholder',
    (await page.locator('#marketing-brand').getAttribute('placeholder')) === 'e.g. Northstar');
  check('marketing: says where generation happens',
    /composes the brief|performs the generation/i.test(await page.locator('main').innerText()));
  check('marketing: no fake campaign machinery',
    !/impressions|CTR|conversion|schedule post|publish to|ad account|analytics/i.test(await page.locator('main').innerText()));

  await page.locator('#marketing-product').fill('a copper desk lamp');
  await page.locator('#marketing-brand').fill('Northstar & Co');
  const direction = page.locator('section[aria-label="Creative direction"] p').first();
  const imageExpected = 'professional studio product photo of a copper desk lamp by Northstar & Co, seamless backdrop, soft key light, crisp reflections, advertising photography';
  check('marketing: brief is composed from the inputs', (await direction.innerText()).trim() === imageExpected, (await direction.innerText()).slice(0, 80));

  let mkLink = page.getByRole('link', { name: /^Open in (Image|Video) Studio$/ });
  let mkHref = new URL(base + (await mkLink.getAttribute('href')));
  check('marketing: image template targets the image studio', mkHref.pathname === '/generate/image');
  check('marketing: image deep link is exact',
    mkHref.searchParams.get('prompt') === imageExpected &&
      mkHref.searchParams.get('model') === 'sdxl-lightning' &&
      mkHref.searchParams.get('aspect') === '1:1');

  await page.getByRole('button', { name: /UGC creator clip/ }).click();
  const videoExpected = 'young creator excitedly showing a copper desk lamp from Northstar & Co to the camera, handheld phone video, bright apartment, ugc style';
  mkLink = page.getByRole('link', { name: /^Open in (Image|Video) Studio$/ });
  mkHref = new URL(base + (await mkLink.getAttribute('href')));
  check('marketing: video template targets the video studio', mkHref.pathname === '/generate/video');
  check('marketing: video deep link is exact',
    mkHref.searchParams.get('prompt') === videoExpected &&
      mkHref.searchParams.get('model') === 'ltx-video' &&
      mkHref.searchParams.get('aspect') === '9:16');
  check('marketing: selected format is exposed',
    (await page.getByRole('button', { name: /UGC creator clip/ }).getAttribute('aria-pressed')) === 'true');
  await matrix(page, 'marketing-studio');

  await page.getByRole('link', { name: /^Open in Video Studio$/ }).click();
  await page.waitForURL(/\/generate\/video\?/);
  await page.locator('#video-prompt').waitFor();
  check('marketing: video composer is prefilled', (await page.locator('#video-prompt').inputValue()) === videoExpected);

  // ---------------------------------------------------------------- Effects (real)
  await goto(page, '/effects');
  const cards = page.locator('main article[data-category]');
  const total = await cards.count();
  const counter = await page.locator('main p[role="status"]').innerText();
  check('effects: library renders every preset', total > 0 && counter === `${total} of ${total} presets`, `${total} rendered vs "${counter}"`);
  check('effects: nothing claims to be generated output',
    !/generated with|real output/i.test(await page.locator('main').innerText()));
  check('effects: artwork is labelled as concept', (await page.getByText(/· Concept artwork/).count()) === total);

  await page.getByRole('button', { name: 'Camera', exact: true }).click();
  const cameraCount = await cards.count();
  check('effects: category filter narrows the index', cameraCount > 0 && cameraCount < total, `${cameraCount} camera presets`);
  check('effects: filter exposes its state',
    (await page.getByRole('button', { name: 'Camera', exact: true }).getAttribute('aria-pressed')) === 'true');
  check('effects: every visible card belongs to the category',
    (await page.locator('main article[data-category="Camera"]').count()) === cameraCount);

  await page.getByRole('button', { name: 'All', exact: true }).click();
  await page.getByLabel('Search effects').fill('zoom');
  const searched = await cards.count();
  check('effects: search narrows the index', searched > 0 && searched < total, `${searched} matches`);
  await page.getByLabel('Search effects').fill('zzzzz');
  check('effects: empty search states itself', await page.getByText(/No effects match/).isVisible());
  await page.getByLabel('Search effects').fill('');

  // Several presets, not one: each must carry its own prompt into the video studio.
  for (const [name, fragment] of [
    ['Crash Zoom', 'rapid crash zoom onto the subject'],
    ['360 Orbit', 'camera orbits 360 degrees around the subject'],
    ['Explosion', 'a massive explosion erupts behind the subject'],
    ['Flip Phone', 'y2k flip phone selfie video'],
  ]) {
    const href = new URL(base + (await page.getByRole('link', { name: `Use effect ${name}` }).getAttribute('href')));
    check(`effects: ${name} opens the video studio`, href.pathname === '/generate/video');
    check(`effects: ${name} carries its own prompt`, href.searchParams.get('prompt').includes(fragment), href.searchParams.get('prompt').slice(0, 50));
    check(`effects: ${name} carries the model`, href.searchParams.get('model') === 'ltx-video');
  }
  const portrait = new URL(base + (await page.getByRole('link', { name: 'Use effect Flip Phone' }).getAttribute('href')));
  check('effects: a portrait preset carries its aspect', portrait.searchParams.get('aspect') === '9:16');
  await matrix(page, 'effects');

  await page.getByRole('link', { name: 'Use effect Crash Zoom' }).click();
  await page.waitForURL(/\/generate\/video\?/);
  await page.locator('#video-prompt').waitFor();
  check('effects: video composer is prefilled', (await page.locator('#video-prompt').inputValue()).includes('crash zoom'));

  // ---------------------------------------------------------------- Preview family
  for (const [path, title] of PREVIEW_ROUTES) {
    await goto(page, path);
    const main = page.locator('main');
    const text = await main.innerText();
    check(`${path}: renders its title as the only h1`,
      (await page.getByRole('heading', { level: 1 }).count()) === 1 &&
        (await page.getByRole('heading', { level: 1 }).innerText()).trim() === title);
    check(`${path}: states Preview in text`, await main.getByText('Preview', { exact: true }).first().isVisible());
    check(`${path}: states the boundary`, /preview only\./i.test(text));
    check(`${path}: never claims to be available`, !/available now|\bavailable\b/i.test(text));
    check(`${path}: has no operational controls`,
      (await main.locator('input,textarea,select,form,[role=dialog]').count()) === 0);
    check(`${path}: has no buttons, only links`, (await main.locator('button').count()) === 0);
    check(`${path}: artwork is labelled as concept`, /Concept artwork/.test(text));
    const links = await main.locator('a[href^="/"]').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    check(`${path}: offers a real destination`, links.some((h) => /^\/(generate|edit|effects|cinema-studio|community|image|video|audio|signup|pricing|history)/.test(h)), links.join(' '));
  }

  // Canvas keeps its illustration, and says it is one.
  await goto(page, '/canvas');
  check('canvas: diagram is presented as an illustration',
    /illustration of one workflow|not an editable canvas/i.test(await page.locator('main').innerText()));
  check('canvas: the concept page still states the boundary', /preview only\./i.test(await page.locator('main').innerText()));
  check('canvas: nothing on the page is operable as a canvas',
    (await page.locator('main button, main [draggable="true"], main canvas, main input').count()) === 0);
  check('canvas: each step links to a real workspace', (await page.getByRole('link', { name: 'Open this step ↗' }).count()) === 4);
  await matrix(page, 'canvas');

  // Integrations must not imply installation or connection.
  for (const path of ['/integrations/chatgpt', '/integrations/mcp']) {
    await goto(page, path);
    const text = await page.locator('main').innerText();
    check(`${path}: no connect/install affordance`,
      (await page.getByRole('button', { name: /connect|install|authorize|sync/i }).count()) === 0 &&
        (await page.getByRole('link', { name: /^(Connect|Install)/i }).count()) === 0);
    check(`${path}: no claim of being connected`, !/\bConnected\b|\bInstalled\b/.test(text));
  }
  await goto(page, '/integrations/mcp');
  check('mcp: the snippet is labelled a sketch', /configuration sketch/i.test(await page.locator('main').innerText()));
  check('mcp: the snippet carries no real package or key',
    !/@higgsfield|HIGGSFIELD_API_KEY/.test(await page.locator('main').innerText()));
  await matrix(page, 'integrations-mcp');
  await goto(page, '/integrations/chatgpt');
  await matrix(page, 'integrations-chatgpt');
  for (const [path, name] of [['/genjutsu', 'genjutsu'], ['/3d-jutsu', '3d-jutsu'], ['/supercomputer', 'supercomputer'], ['/academy', 'academy'], ['/contests', 'contests'], ['/enterprise', 'enterprise']]) {
    await goto(page, path);
    await matrix(page, name);
  }

  // Contests and Academy must not invent competition or course state.
  await goto(page, '/contests');
  const contestsText = await page.locator('main').innerText();
  check('contests: no money, dates, ranks or entry counts are stated',
    !/\$[0-9]|prize pool of|closes on|\b\d+ entries\b|\b\d+(st|nd|rd|th) place\b|monday|sunday/i.test(contestsText));
  check('contests: denies live competition explicitly',
    /no live contests, entries, deadlines, prizes, votes, leaderboards or winners/i.test(contestsText));
  await goto(page, '/academy');
  const academyText = await page.locator('main').innerText();
  check('academy: no invented durations or levels',
    !/\b\d+\s*min\b|\bBeginner\b|\bIntermediate\b|\bAdvanced\b|\b\d+% complete\b/i.test(academyText));
  check('academy: denies course machinery explicitly',
    /no course player, enrolment, progress, certificate or student record/i.test(academyText));
  check('academy: lessons link into real workspaces', (await page.locator('main a[href^="/generate/"], main a[href="/edit/image"], main a[href="/effects"], main a[href="/cinema-studio"]').count()) >= 6);

  // ---------------------------------------------------------------- Pricing (static)
  await goto(page, '/pricing');
  const pricingText = await page.locator('main').innerText();
  check('pricing: free plan is marked current', /current plan/i.test(pricingText) && /\bFree\b/i.test(pricingText));
  check('pricing: paid tiers are marked unavailable', (await page.getByText('Not available', { exact: true }).count()) === 2);
  check('pricing: no assessment-build language', !/assessment/i.test(pricingText));
  check('pricing: no fake discount', !/% off|save \d|was \$/i.test(pricingText));
  check('pricing: no fake monthly price on concepts', !/\$29|\$99|per month/i.test(pricingText));
  check('pricing: no checkout affordance',
    (await page.getByRole('link', { name: /buy|checkout|upgrade|subscribe|contact sales/i }).count()) === 0 &&
      (await page.locator('main button').count()) === 0);
  check('pricing: the only action is a real signup', (await page.getByRole('link', { name: 'Create a free account' }).getAttribute('href')) === '/signup');
  await matrix(page, 'pricing');

  // ---------------------------------------------------------------- System (real check)
  await goto(page, '/system');
  await page.getByText(/Reachable · version/).waitFor({ timeout: 30000 });
  const systemText = await page.locator('main').innerText();
  check('system: reports a real check', /live check/i.test(systemText) && /Reachable · version/.test(systemText));
  check('system: database row is reported', /Connected|Unavailable/.test(systemText));
  check('system: status is carried by words, not only colour', /\bOK\b|Failing|Checking/i.test(systemText));
  check('system: claims no history it does not have',
    /Nothing is polled, stored or averaged/i.test(systemText) && !/uptime|99\.9|incident|latency/i.test(systemText));
  check('system: re-check is a real control', (await page.getByRole('button', { name: 'Re-check' }).count()) === 1);
  await matrix(page, 'system');

  check('no generation request was made anywhere in R10', generationCalls === 0, `${generationCalls} calls`);
} finally {
  await finish(browser);
}
