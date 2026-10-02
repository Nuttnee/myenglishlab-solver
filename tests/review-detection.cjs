// Run with Playwright available via npm or NODE_PATH; optionally set MEL_TEST_BROWSER.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=path.resolve(__dirname,'..'),seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8'));
const lesson=seed.lessons.find(l=>l.id==='ta2-u6-r2-ex6');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
function fixture(label='R2',combined=false){return `<!doctype html><meta charset="utf-8">${combined?`<h2>${label} | ${lesson.sectionTitle}</h2>`:`<table><tr><td>${label}</td><td>${lesson.sectionTitle}</td></tr></table>`}<h3>Exercise 6</h3><p>Complete the sentences.</p>
 <style>.drag{display:inline-block;padding:5px;border:1px solid}.drop{display:inline-block;min-width:120px;min-height:22px;border:1px solid}.question{margin:10px}.wordpoolWrapper{padding:10px}</style>
 <div class="wordpoolWrapper" id="wordpoolWrapperi_1" role="listbox">${lesson.items.slice().reverse().map((i,n)=>`<div class="drag ${i.isExample?'example':''}" data-id="i_1--drag_and_drop--${n+11}" ${i.isExample?'aria-disabled="true"':'draggable="true" role="option" tabindex="0"'}>${esc(i.answer[0])}</div>`).join('')}</div>
 <div class="droppableWrapper">${lesson.items.map(i=>`<div class="question"><b>${i.n}</b> ${esc(i.prompt.split('___')[0])}<div class="drop ${i.isExample?'example':''}" id="i_1RESPONSE_${i.n}" ${i.isExample?'':'role="region" aria-label="Drop items here"'}>${i.isExample?`<div class="drag example">${esc(i.answer[0])}</div>`:''}</div>.</div>`).join('')}</div><button id="submit">Submit</button>
 <script>window.model={};window.ops=0;window.submits=0;document.querySelector('#submit').onclick=()=>submits++;
 document.addEventListener('dragstart',e=>{if(e.target.matches('[draggable=true]'))e.dataTransfer.setData('token',e.target.dataset.id);});document.addEventListener('dragover',e=>e.preventDefault());document.addEventListener('drop',e=>{const t=e.target.closest('.drop'),s=[...document.querySelectorAll('[draggable=true]')].find(s=>s.dataset.id===e.dataTransfer.getData('token'));if(t&&s){t.textContent=s.textContent;model[t.id]=s.textContent;ops++;}});
 </script>`;}
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-review-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});let html=fixture();
 try{
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();
  await p.goto('https://myenglishlab.pearson-intl.com/activities/review-fixture/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();const app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));
  assert.equal(await app.evaluate(()=>state.lessonId),lesson.id);assert.equal(await app.locator('h1').innerText(),'MyEnglishLab Solver');
  const result=await app.evaluate(id=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id}),lesson.id);assert.equal(result.done,6,JSON.stringify(result));assert(!result.error);
  for(const i of lesson.items.filter(i=>!i.isExample))assert.equal(await p.locator('#i_1RESPONSE_'+i.n).innerText(),i.answer[0]);assert.equal(await p.locator('.drop.example').innerText(),'front of you');assert.equal(await p.evaluate(()=>submits),0);
  const again=await app.evaluate(id=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id}),lesson.id);assert.equal(again.done,0);assert.equal(again.skipped,6);
  console.log('PASS R2 Ex6 auto-detected without activity link; six phrases dragged, example preserved, idempotent, no Submit, unversioned UI');
  // Exercise the real DOM parser directly as a standalone script on the same browser.
  const probe=await ctx.newPage();
  async function read(body){await probe.setContent(body);for(const f of ['rules','context','page'])await probe.addScriptTag({path:path.join(base,'lib',f+'.js')});return probe.evaluate(()=>MELPage.pageInfo());}
  for(const [input,expected] of [['R1','R1'],['r2','R2'],['R 3','R3'],['Review 2','R2'],['6.2','6.2']])for(const combined of [false,true]){const page=await read(fixture(input,combined));assert.equal(page.section,expected,input+' combined='+combined);assert.equal(page.exercise,'6');}
  const ambiguous=await read('<table><tr><td>R1</td><td>Grammar</td></tr><tr><td>R2</td><td>Grammar</td></tr></table><h3>Exercise 6</h3>');assert.equal(ambiguous.identityConflict,true);
  const none=await read('<h3>Exercise 6</h3><p>We travelled on the R2 bus yesterday.</p>');assert.equal(none.section,'');
  for(const f of ['catalog','data'])await probe.addScriptTag({path:path.join(base,'lib',f+'.js')});
  const match=await probe.evaluate(({lessons,page})=>MEL.match(lessons,[page]),{lessons:seed.lessons,page:ambiguous});assert.equal(match,null);
  console.log('PASS R1/R2/R3, Review N, case/space and combined/split headers; decimal headers retained; ambiguous headers and prose R2 refused');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-review-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
