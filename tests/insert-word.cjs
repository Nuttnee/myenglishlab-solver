// Observed switcher trees; hidden fields and hover handlers are simulated, not a Pearson capture.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=path.resolve(__dirname,'..'),seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8'));
const id='ta2-u8-x-exx-i',lesson=seed.lessons.find(l=>l.id===id),observed=require('./fixtures/insert-word-observed.json');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
function renderRegion(r){const render=i=>{const n=r.nodes[i];if(n.tag==='#text')return esc(n.text)+' ';return `<${n.tag} class="${esc(n.classes)}" ${Object.entries(n.attributes||{}).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${r.nodes.map((x,j)=>x.parent===i?render(j):'').join('')}</${n.tag}>`;};return render(0);}
function fixture(mode){return `<!doctype html><meta charset="utf-8"><h2>8.2 | Writing: adding emphasis</h2><h3>Exercise 3A</h3><p>Read the product description and put the words in brackets in the correct places.</p><style>.itemContent{margin:20px}.switcher{display:inline-block}input{width:90px}input:not(.shown){display:none}</style>
<div class="itemExample"><div class="itemContent insertAWord">${renderRegion(observed.regions[0])}</div></div>
<ul><li class="item"><div class="itemContent insertAWord"><div class="sentence">${['It','sounds','good','.','(really)',''].map(t=>`<span class="switcher" role="button" tabindex="0">${t} </span>`).join('')}</div></div></li>
${observed.regions.slice(1).map(r=>`<li class="item"><div class="itemContent insertAWord">${renderRegion(r)}</div></li>`).join('')}</ul><button id="save">Save</button><button id="submit">Submit</button>
<script>window.model={};window.ops=0;window.saved=0;window.hovers=0;
document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);
for(const [row,root] of [...document.querySelectorAll('.sentence')].entries()){
 for(const [index,span] of [...root.querySelectorAll('.switcher')].entries()){
  const input=document.createElement('input');input.type='text';input.dataset.row=row;input.dataset.index=index;
  if('${mode}'==='after')span.append(input);else span.prepend(input);
  if(row===0){input.readOnly=true;if(index===4){input.value='very';input.classList.add('shown');}continue;}
  span.addEventListener('mouseover',()=>{hovers++;if('${mode}'==='ignore')return;input.classList.add('shown');if('${mode}'==='change-page')document.querySelector('h3').textContent='Exercise 3B';});
  span.addEventListener('mouseout',()=>{if(!input.value)input.classList.remove('shown');if('${mode}'==='clear-on-leave')input.value='';});
  input.addEventListener('change',()=>{ops++;model[row]=input.value;if('${mode}'==='reject')input.value='';});
 }
}
</script>`;}
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-insert-word-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});let html,app;
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();
  async function open(mode='normal'){html=fixture(mode);await p.goto('https://myenglishlab.pearson-intl.com/activities/2520697175/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);}
  const solve=(onlyN='')=>app.evaluate(({id,onlyN})=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id,onlyN}),{id,onlyN});
  const check=async()=>{assert.deepEqual(await p.evaluate(()=>model),{'1':'really','2':'fairly','3':'extremely'});assert.equal(await p.locator('.itemExample input').nth(4).inputValue(),'very');assert.equal(await p.evaluate(()=>saved),0);};
  await open();assert.equal(await app.getByRole('button',{name:'Tự chèn từ đúng vị trí',exact:true}).count(),1);
  let r=await solve();assert.equal(r.done,3,JSON.stringify(r));assert(!r.error);await check();r=await solve();assert.equal(r.skipped,3);assert.equal(await p.evaluate(()=>ops),3);
  // Assert position, not just values: after "sounds", "is" and "be" respectively.
  for(const [row,index] of [[1,2],[2,3],[3,3]])assert(await p.locator(`input[data-row="${row}"][data-index="${index}"]`).inputValue());
  console.log('PASS hover-revealed three exact gaps, readonly example, retained input/change model, idempotence, no Save/Submit');
  await open('after');r=await solve();assert.equal(r.done,3,JSON.stringify(r));await check();
  await open();await p.locator('ul').evaluate(el=>[...el.children].reverse().forEach(li=>el.append(li)));r=await solve('2');assert.equal(r.done,1,JSON.stringify(r));assert.deepEqual(await p.evaluate(()=>model),{'2':'fairly'});
  console.log('PASS inputs before or after switcher text; shuffled unnumbered questions, single-question action');
  for(const mode of ['ignore','reject','clear-on-leave','change-page']){await open(mode);r=await solve();assert.equal(r.done,0,mode+JSON.stringify(r));assert(r.error);assert.equal(await p.evaluate(()=>saved),0);}
  console.log('PASS missing hover response, rejected values, clearing on leave and page navigation stop without false success');
  await open();await p.locator('input[data-row="1"][data-index="2"]').evaluate(el=>el.value='previous');r=await solve();assert.equal(r.done,0);assert.equal(await p.locator('input[data-row="1"][data-index="2"]').inputValue(),'previous');
  const report=await app.evaluate(id=>chrome.runtime.sendMessage({type:'MEL_DRAG_DIAGNOSTIC',lessonId:id}),id);
  const diagnostic=report.report.frames.find(f=>f.controls?.insertWords?.length).controls;
  assert.equal(diagnostic.insertWords.length,4);assert(diagnostic.insertWords[1].fields.some(f=>f.visible===false));assert(!JSON.stringify(diagnostic.insertWords).includes('previous'));assert.equal(diagnostic.fields.length,0);
  await open();await p.locator('li.item').first().evaluate(el=>el.after(el.cloneNode(true)));r=await solve();assert(r.unresolved.includes('1'));assert.equal(await p.locator('input[data-row="1"][data-index="2"]').first().inputValue(),'');
  await open();await p.locator('input[data-row="1"][data-index="2"]').evaluate(el=>el.after(el.cloneNode(true)));r=await solve();assert.equal(r.done,0);assert(r.error);
  await open();await p.locator('input[data-row="1"][data-index="1"]').evaluate(el=>el.value='really');r=await solve();assert.equal(r.done,0);assert(r.error);assert.equal(await p.locator('input[data-row="1"][data-index="2"]').inputValue(),'');
  await open();await p.locator('h3').evaluate(el=>el.textContent='Exercise 3B');r=await solve();assert.equal(r.ok,false);
  console.log('PASS existing values preserved, ambiguous sentence/field rejected, diagnostics include hidden field positions without values, no native fallback');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-insert-word-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
