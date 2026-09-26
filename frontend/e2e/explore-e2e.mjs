import {base,shots,check,setup,signup,goto,matrix,finish} from './r9-helpers.mjs';
const {browser,context,page}=await setup();
try {
  let generationCalls=0;
  page.on('request',r=>{if(r.url().includes('/api/generations')) generationCalls++;});
  await goto(page,'/community');
  check('Explore h1',await page.getByRole('heading',{name:'Explore',exact:true,level:1}).isVisible());
  check('12 curated entries',await page.locator('main article').count()===12);
  check('Only supported filters',(await page.getByRole('tab').allTextContents()).join(',')==='All,Images,Videos');
  check('Two samples and ten concepts',await page.getByText(/· Studio sample/).count()===2 && await page.getByText(/· Concept artwork/).count()===10);
  check('All captions visible',await page.locator('main article h3').count()===12 && await page.getByText(/portrait of a woman in a lime/).isVisible());
  check('No fake social controls',await page.getByRole('button',{name:/like|follow|comment|publish/i}).count()===0);
  check('Local image loads',await page.locator('main img').first().evaluate(e=>e.complete && e.naturalWidth>0));
  check('Video has controls without autoplay',await page.locator('main video').evaluate(e=>e.controls&&!e.autoplay));
  await matrix(page,'explore-all');
  for(const [label,kind] of [['Images','image'],['Videos','video']]) {
    await page.getByRole('tab',{name:label,exact:true}).click();
    check(`${label} filter`,await page.locator('main article').count()===6 && await page.locator(`article[data-kind="${kind}"]`).count()===6);
    check(`${label} selected state`,await page.getByRole('tab',{name:label,exact:true}).getAttribute('aria-selected')==='true');
    await page.screenshot({path:`${shots}/explore-${kind}-dark-390.png`,fullPage:true});
  }
  check('Discovery makes no generation requests',generationCalls===0);
  await signup(context,'explore');
  for(const [title,kind,prompt] of [['Lime jacket portrait','image','portrait of a woman in a lime green jacket, neon-lit street at night, 35mm film, cinematic'],['Paper boat at golden hour','video','a paper boat drifting across a calm pond at golden hour, gentle ripples, cinematic']]) {
    await goto(page,'/community'); await page.getByRole('link',{name:`Recreate ${title}`,exact:true}).click();
    await page.waitForURL(u=>u.pathname===`/generate/${kind}`);
    const url=new URL(page.url());
    check(`${kind} Recreate prompt exact`,url.searchParams.get('prompt')===prompt);
    check(`${kind} Recreate model preserved`,url.searchParams.get('model')===(kind==='video'?'ltx-video':null));
    await page.locator(`#${kind}-prompt`).waitFor();
    check(`${kind} composer prefilled`,await page.locator(`#${kind}-prompt`).inputValue()===prompt);
  }
  for(const [category,real,preview] of [['image','flux-1-schnell','higgsfield-soul-2'],['video','ltx-video','seedance-2-5'],['audio','aura-1','seed-audio-1']]) {
    await goto(page,`/${category}`);
    check(`${category} catalog availability labels`,await page.locator('article[data-status=available]').count()>0 && await page.locator('article[data-status=preview]').count()>0);
    check(`${category} available model href`,await page.locator(`main a[href="/generate/${category}?model=${real}"]`).count()===1);
    check(`${category} preview href`,await page.locator(`main a[href="/models/${preview}"]`).count()===1);
    await matrix(page,`catalog-${category}`);
    await page.locator(`main a[href="/models/${preview}"]`).click();
    await page.waitForURL(base+`/models/${preview}`);
    check(`${category} preview explains boundary`,await page.getByText(/This model is not connected to generation here/).isVisible());
    check(`${category} preview has no controls`,await page.locator('main input,main textarea,main button').count()===0);
  }
  for(const [path,name,available] of [['/models/flux-1-schnell','model-available',true],['/models/higgsfield-soul-2','model-preview',false],['/tools/create-image','tool-available',true],['/tools/relight','tool-preview',false]]) {
    await goto(page,path); check(`${name} accurate status`,await page.locator('main').getByText(available?'Available':'Preview',{exact:true}).isVisible()); await matrix(page,name);
  }
  // Every available tool must open its real studio and must never carry preview language.
  for(const [slug,studio] of [['create-image','/generate/image'],['edit-image','/edit/image'],['create-video','/generate/video'],['text-to-speech','/generate/audio']]) {
    await goto(page,`/tools/${slug}`);
    check(`${slug} reads as available`,await page.locator('main').getByText('Available',{exact:true}).isVisible());
    check(`${slug} opens its studio`,await page.locator(`main a[href="${studio}"]`).count()>=1);
    check(`${slug} has no preview language`,!/Preview only|not implemented here|cannot generate/i.test(await page.locator('main').innerText()));
  }
  // Catalog availability and the detail page must agree for every model in every catalog.
  for(const category of ['image','video','audio']) {
    await goto(page,`/${category}`);
    const entries=await page.locator('main article[data-status]').evaluateAll(els=>els.map(el=>({
      status:el.dataset.status,href:el.querySelector('a')?.getAttribute('href')??''})));
    check(`${category} catalog entries all carry a destination`,entries.length>0&&entries.every(e=>e.href.length>0));
    check(`${category} available entries link into a studio, previews do not`,
      entries.every(e=>e.status==='available'?/^\/(generate|edit)\//.test(e.href):!/^\/(generate|edit)\//.test(e.href)),
      );
    for(const entry of entries.filter(e=>e.href.startsWith('/models/')||e.href.startsWith('/tools/'))) {
      await goto(page,entry.href);
      const label=entry.status==='available'?'Available':'Preview';
      check(`${entry.href} detail agrees with the catalog (${label})`,
        await page.locator('main').getByText(label,{exact:true}).isVisible());
    }
  }
  for(const slug of ['relight','inpaint','image-upscale','face-swap','character-swap']) {
    await goto(page,`/tools/${slug}`);
    check(`${slug} stays preview`,await page.getByText(/This tool is not implemented here/).isVisible());
    check(`${slug} fallback preserved`,await page.locator('main a[href="/edit/image"]').count()===1);
  }
} finally { await finish(browser); }
