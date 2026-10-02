// DOM reconstructed from the user's diagnostic; click handler is simulated.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=path.resolve(__dirname,'..'),seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8'));
const id='ta2-u8-x-ex3',lesson=seed.lessons.find(l=>l.id===id),observed=require('./fixtures/inline-choices-observed.json');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
function regionHTML(region){const render=i=>{const n=region.nodes[i];if(n.tag==='#text')return esc(n.text)+' ';const attrs=Object.entries(n.attributes||{}).map(([k,v])=>`${k}="${esc(v)}"`).join(' ');return `<${n.tag} class="${esc(n.classes)}" ${attrs}>${region.nodes.map((x,j)=>x.parent===i?render(j):'').join('')}</${n.tag}>`;};return render(0);}
function fixture(mode='normal'){return `<!doctype html><meta charset="utf-8"><h2>8.1 | Grammar: relative clauses</h2><h3>Exercise 3</h3><p>Click on the correct alternatives.</p><style>.item{margin:15px}.itemNumber{display:inline-block;margin-right:10px}.underlineElement{cursor:pointer}.selected{text-decoration:underline}</style><ul class="taskItems">${observed.regions.map((r,i)=>`<li class="item" data-test="${i+1}">${regionHTML(r)}</li>`).join('')}</ul><button id="save">Save</button><button id="submit">Submit</button><script>window.ops=0;window.submits=0;window.model={};document.querySelector('#save').onclick=document.querySelector('#submit').onclick=()=>submits++;
 document.addEventListener('click',e=>{const el=e.target.closest('.underlineElement'),group=el?.closest('.underlineGroup');if(!group||group.classList.contains('example'))return;ops++;if('${mode}'==='ignore')return;if('${mode}'!=='both')group.querySelectorAll('.underlineElement').forEach(x=>{x.setAttribute('aria-pressed','false');x.classList.remove('selected');});el.classList.add('selected');if('${mode}'!=='style-only')el.setAttribute('aria-pressed','true');if('${mode}'==='both')group.querySelectorAll('.underlineElement').forEach(x=>x.setAttribute('aria-pressed','true'));model[group.closest('li').dataset.test]=el.textContent.trim();});</script>`;}
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-inline-choices-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});let html,app;
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();
  async function open(mode='normal'){html=fixture(mode);await p.goto('https://myenglishlab.pearson-intl.com/activities/2520694033/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);}
  const solve=(onlyN='')=>app.evaluate(({id,onlyN})=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id,onlyN}),{id,onlyN});
  async function check(){for(const item of lesson.items.filter(i=>!i.isExample))assert.equal(await p.locator(`[data-test="${item.n}"] [aria-pressed=true]`).evaluate(el=>el.textContent.trim()),item.answer[0]);assert.equal(await p.locator('.example .selected').evaluate(el=>el.textContent.trim()),'who');assert.equal(await p.evaluate(()=>submits),0);}
  await open();assert.equal(await app.getByRole('button',{name:'Tự chọn từ cả bài',exact:true}).count(),1);let r=await solve();assert.equal(r.done,9,JSON.stringify(r));assert(!r.error);await check();assert.equal(await p.evaluate(()=>ops),9);r=await solve();assert(!r.error);assert.equal(await p.evaluate(()=>ops),9,'do not toggle already-selected words');
  console.log('PASS real diagnostic DOM: nine correct clicks, fixed example, verified aria-pressed, idempotence, no Save/Submit');
  await open();await p.locator('li.item').evaluateAll(els=>els.reverse().forEach(el=>{el.querySelector('.itemNumber').remove();el.parentElement.append(el);}));r=await solve();assert.equal(r.done,9,JSON.stringify(r));await check();
  await open();await p.locator('[data-test="2"] .underlineElement').first().click();r=await solve('2');assert.equal(r.done,1);assert.equal(await p.locator('[data-test="2"] [aria-pressed=true]').evaluate(el=>el.textContent.trim()),'where');assert.equal(await p.evaluate(()=>ops),2);
  console.log('PASS reordered questions without numbers; single-question action replaces wrong previous selection');
  for(const mode of ['ignore','style-only','both']){await open(mode);r=await solve();assert.equal(r.done,0,mode+JSON.stringify(r));assert(r.error);assert.equal(await p.evaluate(()=>ops),1);}
  console.log('PASS ignored clicks, visual-only changes and two pressed options stop without false success');
  await open();await p.locator('[data-test="2"]').evaluate(el=>el.after(el.cloneNode(true)));r=await solve();assert.equal(await p.locator('[data-test="2"] [aria-pressed=true]').count(),0);
  await open();await p.locator('[data-test="2"] .underlineGroup').evaluate(el=>el.classList.replace('single','multiple'));r=await solve();assert.equal(await p.locator('[data-test="2"] [aria-pressed=true]').count(),0);
  await open();await p.locator('h3').evaluate(el=>el.textContent='Exercise 4');r=await solve();assert.equal(r.ok,false);assert.equal(await p.evaluate(()=>ops),0);
  console.log('PASS duplicate question, unsupported multiple-selection group and changed exercise refuse ambiguous writes');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-inline-choices-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
