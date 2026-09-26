import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
export const base = process.env.E2E_BASE ?? 'http://localhost:3001';
export const shots = process.argv[2] ?? 'test-results/r9';
export const results = [];
export function check(name, value) { results.push(`${value ? 'PASS' : 'FAIL'} ${name}`); }
export async function setup() {
  await mkdir(shots, {recursive:true});
  const browser = await chromium.launch();
  const context = await browser.newContext({viewport:{width:1440,height:900},colorScheme:'light'});
  const schema = await (await context.request.get(`${base}/api/openapi.json`)).json();
  if (!schema.paths['/api/dev-assets/{key}']) throw new Error('Fake-provider backend required');
  const page = await context.newPage();
  return {browser,context,page};
}
export async function signup(context, prefix) {
  const email = `${prefix}-${Date.now()}@example.com`;
  const response = await context.request.post(`${base}/api/auth/signup`,{data:{name:'R9 Reader',email,password:'passw0rd1',accept_terms:true}});
  if (!response.ok()) throw new Error(`Signup failed: ${response.status()}`);
  return (await response.json()).user;
}
export async function goto(page,path) { await page.goto(base+path,{waitUntil:'networkidle'}); }
export async function matrix(page, name) {
  for (const [theme,width] of [['light',1440],['dark',1440],['light',768],['light',390],['dark',390]]) {
    await page.setViewportSize({width,height:900});
    await page.evaluate(theme=>{localStorage.setItem('hf.theme',theme);document.documentElement.dataset.theme=theme;window.dispatchEvent(new Event('storage'));},theme);
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:`${shots}/${name}-${theme}-${width}.png`,fullPage:true});
    check(`${name} ${theme} ${width}: no overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
}
export async function finish(browser) { await browser.close(); console.log(results.join('\n')); if(results.some(x=>x.startsWith('FAIL'))) process.exitCode=1; }
