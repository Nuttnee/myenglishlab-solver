// Screenshot text reconstructed with native fields and simulated change handlers.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.MEL_TEST_EXTENSION?path.resolve(process.env.MEL_TEST_EXTENSION):path.resolve(__dirname,'..'),seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8'));
const id='ta2-u8-x-exx-r',lesson=seed.lessons.find(l=>l.id===id),c=vm.createContext({});
for(const f of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',f+'.js'),'utf8'),c);
const header={origin:'https://myenglishlab.pearson-intl.com',section:'',skill:'',exercise:'1',activityId:'2520708786'};
assert.equal(c.MEL.match(seed.lessons,[header]).lesson.id,id);
assert.notEqual(c.MEL.match(seed.lessons,[{...header,exercise:'2'}])?.lesson.id,id);
assert.notEqual(c.MEL.match(seed.lessons,[{...header,activityId:''}])?.lesson.id,id);
const enriched=c.MEL.enrichCatalog([lesson])[0];assert.equal(enriched.section,'');assert.equal(enriched.sectionTitle,'Money');assert.deepEqual(enriched.items,lesson.items);
const input=n=>`<input type="text" data-test="${n}">`;
const html=`<!doctype html><meta charset="utf-8"><h2>8 | Money</h2><h3>Exercise 1</h3><p>OVERVIEW: Watch the video. Who are you most similar to?</p><p>Complete Finn's text with one word in each gap. Then watch the video from 0:15–0:30 and check your answers.</p><style>.itemContent{width:300px;line-height:2}input{width:60px}</style><div class="itemContent">I spend a <input type="text" readonly value="lot"> of time shopping. I like ${input(1)} shoes and books. I buy things online but I ${input(2)} like visiting street ${input(3)}. How ${input(4)} you? How do you ${input(5)} about shopping?</div><button>Save</button><button>Submit</button><script>window.model={};window.saved=0;document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);document.querySelectorAll('[data-test]').forEach(el=>el.onchange=()=>model[el.dataset.test]=el.value);</script>`;
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-money-overview-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});let app;
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();
  async function open(){await p.goto(header.origin+'/activities/'+header.activityId+'/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);}
  const solve=(onlyN='')=>app.evaluate(({id,onlyN})=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id,onlyN}),{id,onlyN});
  await open();let r=await solve();assert.equal(r.done,5,JSON.stringify(r));assert(!r.error);assert.equal(r.unresolved.length,0);assert.deepEqual(await p.evaluate(()=>model),{'1':'buying','2':'also','3':'markets','4':'about','5':'feel'});assert.equal(await p.locator('[readonly]').inputValue(),'lot');assert.equal(await p.evaluate(()=>saved),0);
  await open();r=await solve('4');assert.equal(r.done,1,JSON.stringify(r));assert.deepEqual(await p.evaluate(()=>model),{'4':'about'});
  await open();await p.locator('.itemContent').evaluate(el=>el.after(el.cloneNode(true)));await solve();assert.deepEqual(await p.locator('[data-test]').evaluateAll(els=>els.map(el=>el.value)),Array(10).fill(''));
  await p.locator('h3').evaluate(el=>el.textContent='Exercise 2');assert.equal((await solve()).ok,false);
  const stored=await worker.evaluate(()=>chrome.storage.local.get('melAnswerDataV11'));assert.deepEqual(stored.melAnswerDataV11.lessons.find(l=>l.id===id),lesson);
  console.log('PASS Money Ex1 recognized by verified activity, five paragraph gaps, fixed lot, onlyN short How/about/you gap, ambiguous duplicate refused, changed exercise refused, no Save/Submit or stored source mutation');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-money-overview-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
