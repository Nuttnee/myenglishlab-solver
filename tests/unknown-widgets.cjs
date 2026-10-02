// Diagnostic coverage only: deliberately unknown custom spans, not a claimed adapter.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=path.resolve(__dirname,'..'),seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8'));
const id='ta2-u8-x-ex3',lesson=seed.lessons.find(l=>l.id===id),esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
const body=`<!doctype html><meta charset="utf-8"><h2>8.1 | Grammar: relative clauses</h2><h3>Exercise 3</h3><p>Click on the correct alternatives.</p><nav>private navigation</nav><style>.token{cursor:pointer}.selected{font-weight:700;text-decoration:underline}li{margin:12px}</style><ol>${lesson.items.map(i=>'<li><div class="itemContent">'+esc(i.prompt).replace(/(\w+) \/ (\w+)/,`<span class="customWidget"><span class="token ${i.isExample?'selected':''}" data-index="0">$1</span> / <span class="token" data-index="1">$2</span></span>`)+(i.n==='2'?'<input type="hidden" value="SECRET_TOKEN"><span hidden>SECRET_HIDDEN</span><a href="https://example.invalid/?token=SECRET_URL"></a>':'')+'</div></li>').join('')}</ol><button id="save">Save</button><button id="submit">Submit</button><script>window.clicks=0;document.addEventListener('click',e=>{if(e.target.matches('.token')){clicks++;e.target.parentElement.querySelectorAll('.token').forEach(t=>t.classList.remove('selected'));e.target.classList.add('selected');}});</script>`;
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-unknown-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body}));const p=await ctx.newPage();await p.goto('https://myenglishlab.pearson-intl.com/activities/unknown-widget/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();const app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));
  const report=async()=>{const r=await app.evaluate(id=>chrome.runtime.sendMessage({type:'MEL_DRAG_DIAGNOSTIC',lessonId:id}),id);assert.equal(r.ok,true,JSON.stringify(r));return r.report.frames.find(f=>f.controls?.questionWidgets?.regions.length)?.controls;};
  const before=await report();assert(before);assert.equal(before.fields.length,0);assert.equal(before.questionWidgets.regions.length,10);assert.equal(before.questionWidgets.readOnly,true);assert.equal(await p.evaluate(()=>clicks),0);
  const serialized=JSON.stringify(before.questionWidgets);for(const secret of ['SECRET_TOKEN','SECRET_HIDDEN','SECRET_URL','private navigation'])assert(!serialized.includes(secret));
  const row=before.questionWidgets.regions.find(r=>r.context.includes('Hamburg'));
  assert.equal(row.nodes.filter(n=>n.classes?.includes('token')).length,2);assert(row.nodes.some(n=>n.tag==='#text'&&n.text==='where'));assert(row.nodes.filter(n=>n.tag==='#text').every(n=>n.parent!==null));
  await p.locator('li').nth(1).locator('.token').nth(1).click();const after=await report();assert.equal(await p.evaluate(()=>clicks),1);
  const selected=after.questionWidgets.regions.find(r=>r.context.includes('Hamburg')).nodes.find(n=>n.classes?.includes('selected'));
  assert(selected);assert.equal(selected.style.fontWeight,'700');assert.equal(selected.style.textDecorationLine,'underline');
  console.log('PASS empty supported fields now retain ten question widget trees, text order, parent indexes, token classes/attributes and selected styles; read-only, secrets/navigation omitted');
  const solve=await app.evaluate(id=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id}),id);assert.equal(solve.kind,'unresolved');assert.equal(await p.evaluate(()=>clicks),1);
  console.log('PASS unsupported spans still report unresolved without guessing clicks or claiming success');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-unknown-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
