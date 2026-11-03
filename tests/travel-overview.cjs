// Screenshot text reconstructed with native fields and simulated change handlers.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.MEL_TEST_EXTENSION?path.resolve(process.env.MEL_TEST_EXTENSION):path.resolve(__dirname,'..'),seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8'));
const id='ta2-u5-5.4-exx-intro-gaps',lesson=seed.lessons.find(l=>l.id===id),c=vm.createContext({});
for(const f of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',f+'.js'),'utf8'),c);
const header={origin:'https://myenglishlab.pearson-intl.com'};
const enriched=c.MEL.enrichCatalog([lesson])[0];
assert.equal(enriched.items.length,8);assert.equal(c.MEL.enrichCatalog([enriched])[0].items.length,8);
const custom={...lesson,items:lesson.items.slice(1)};
assert.deepEqual(c.MEL.enrichCatalog([custom])[0].items,custom.items);
const answers=['countries','of',"'ve",'and','going','new',"'m"];
const input=n=>`<input type="text" data-test="${n}">`;
const html=`<!doctype html><meta charset="utf-8"><h2>5 | Travel</h2><h3>Exercise 1</h3><p>Read Finn's text and complete it with the words below.</p><div>spent new 'm and going of countries 've</div><div class="itemContent">I've <input readonly value="spent"> a lot of time living in different ${input(1)} so there isn't one place I think ${input(2)} as home. I ${input(3)} lived in Scotland ${input(4)} Poland and China. I love ${input(5)} to new places and learning about ${input(6)} cultures. Today, I ${input(7)} asking people about travel.</div><button>Save</button><button>Submit</button><script>window.model={};window.saved=0;document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);document.querySelectorAll('[data-test]').forEach(el=>el.onchange=()=>model[el.dataset.test]=el.value);</script>`;
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-travel-overview-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});let app;
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();
  async function open(activity='unseen-travel-overview'){await p.goto(header.origin+'/activities/'+activity+'/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);}
  const solve=(onlyN='')=>app.evaluate(({id,onlyN})=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id,onlyN}),{id,onlyN});
  await open();let r=await solve();assert.equal(r.done,7,JSON.stringify(r));assert.equal(r.unresolved.length,0);
  const values=()=>p.locator('[data-test]').evaluateAll(fields=>fields.map(el=>el.value));
  assert.deepEqual(await values(),answers);assert.equal(await p.locator('[readonly]').inputValue(),'spent');assert.equal(await p.evaluate(()=>saved),0);
  await p.locator('[data-test="1"]').fill('');await solve('1b');assert.deepEqual(await values(),answers);
  await open();await p.locator('.itemContent').evaluate(el=>el.after(el.cloneNode(true)));await solve('1b');assert((await values()).every(v=>v===''));
  await p.locator('h3').evaluate(el=>el.textContent='Exercise 2');assert.equal((await solve()).ok,false);
  const stored=await worker.evaluate(()=>chrome.storage.local.get('melAnswerDataV11'));assert.deepEqual(stored.melAnswerDataV11.lessons.find(l=>l.id===id),lesson);
  console.log('PASS Travel Ex1: all seven gaps, countries-only repair, fixed spent, ambiguous duplicate refused, original library preserved');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-travel-overview-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
