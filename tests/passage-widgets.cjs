// Unknown widget: assert diagnostics only, never invent an interaction adapter.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=path.resolve(__dirname,'..'),seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8'));
const id='ta2-u8-8.2-ex6b',lesson=seed.lessons.find(l=>l.id===id),esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
const tokens=lesson.passage.split(/\s+/);
const html=`<!doctype html><meta charset="utf-8"><style>.story{max-width:550px}</style><h2>8.2 | Listening</h2><h3>Exercise 6B</h3><p>${lesson.instruction}</p><nav>SECRET_NAVIGATION</nav><div class="story">${tokens.map((w,i)=>`<span class="storyToken ${i===12?'example':''}" data-index="${i}">${esc(w)}</span>`).join(' ')}<input type="hidden" value="SECRET_VALUE"><span hidden>SECRET_HIDDEN</span><a href="https://example.invalid/?token=SECRET_URL"></a></div><button>Save</button><button>Submit</button><script>window.clicks=0;window.saved=0;document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);document.querySelectorAll('.storyToken').forEach(el=>el.onclick=()=>{clicks++;el.classList.toggle('marked');});</script>`;
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-passage-widgets-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();await p.goto('https://myenglishlab.pearson-intl.com/activities/2520700219/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();const app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);
  const report=async()=>{const r=await app.evaluate(id=>chrome.runtime.sendMessage({type:'MEL_DRAG_DIAGNOSTIC',lessonId:id}),id);assert(r.ok);return r.report.frames.find(f=>f.controls?.questionWidgets?.regions.length)?.controls.questionWidgets;};
  let d=await report();assert(d);assert.equal(d.regions.length,1);assert.equal(d.regions[0].truncated,false);assert.equal(d.regions[0].nodes.filter(n=>n.classes?.includes('storyToken')).length,tokens.length);assert(d.regions[0].nodes.some(n=>n.tag==='#text'&&n.text==='Mr'));assert(d.regions[0].nodes.some(n=>n.tag==='#text'&&n.text==='money.'));assert.equal(await p.evaluate(()=>clicks),0);
  for(const secret of ['SECRET_NAVIGATION','SECRET_VALUE','SECRET_HIDDEN','SECRET_URL'])assert(!JSON.stringify(d).includes(secret));
  // Remove passage anchor: the prompt-only parenthetical cleanup must still find it.
  await worker.evaluate(id=>chrome.storage.local.get('melAnswerDataV11').then(async s=>{s.melAnswerDataV11.lessons.find(l=>l.id===id).passage='';await chrome.storage.local.set(s);}),id);
  d=await report();assert.equal(d.regions.length,1);assert.equal(d.regions[0].truncated,false);
  const yearsIndex=tokens.indexOf('years');await p.locator('.storyToken').nth(yearsIndex).click();d=await report();assert(d.regions[0].nodes.some(n=>n.classes?.includes('marked')));
  const r=await app.evaluate(id=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id}),id);assert.equal(r.kind,'unresolved');assert.equal(r.fallback,false);assert(r.message.includes('chọn nhiều từ sai'));assert.equal(await p.evaluate(()=>clicks),1);assert.equal(await p.evaluate(()=>saved),0);
  console.log(`PASS full ${tokens.length}-token passage captured beyond old 120-node limit; source-only parentheses ignored even without passage anchor; selected class retained; secrets omitted; unsupported widget not clicked or submitted`);
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-passage-widgets-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
