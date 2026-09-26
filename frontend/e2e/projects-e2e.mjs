import { base, check, setup, signup, goto, matrix, finish } from './r9-helpers.mjs';
const {browser,context,page}=await setup();
try {
  await goto(page,'/projects');
  check('Projects protected with return path',new URL(page.url()).pathname==='/login' && new URL(page.url()).searchParams.get('next')==='/projects');
  await signup(context,'projects'); await goto(page,'/projects');
  check('Projects heading',await page.getByRole('heading',{name:'Projects',exact:true}).isVisible());
  check('Roadmap and unavailable features explicit',await page.getByText('On the roadmap',{exact:true}).isVisible() && await page.getByText(/Project creation, folders and sharing are not available yet/).isVisible());
  const main=page.locator('main');
  check('No invented project controls',await main.locator('button,input,form,[role=dialog]').count()===0);
  check('Archive terminology replaces History',!(await main.innerText()).includes('History'));
  check('Archive destination preserved',await page.getByRole('link',{name:'Open Archive'}).getAttribute('href')==='/history');
  await matrix(page,'projects');
  await page.getByRole('link',{name:'Open Archive'}).click(); await page.waitForURL(base+'/history');
  check('Open Archive works',await page.getByRole('heading',{name:'Archive',exact:true}).isVisible());
} finally { await finish(browser); }
