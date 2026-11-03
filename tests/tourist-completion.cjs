// Screenshot sentence contexts; native change handler simulated.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.MEL_TEST_EXTENSION?path.resolve(process.env.MEL_TEST_EXTENSION):path.resolve(__dirname,'..');
const seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8')),id='ta2-u5-5.1-exx-tobigutt-complete',lesson=seed.lessons.find(l=>l.id===id),c=vm.createContext({});
for(const file of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',file+'.js'),'utf8'),c);
const header={origin:'https://myenglishlab.pearson-intl.com',section:'5.1',skill:'listening',sectionTitle:'Listening',exercise:'7',activityId:'unseen-tourist-complete'};
assert.equal(c.MEL.match(seed.lessons,[header]).lesson.id,id);
for(const change of [{section:'5.2'},{exercise:'6B'},{skill:'grammar',sectionTitle:'Grammar'}])assert.notEqual(c.MEL.match(seed.lessons,[{...header,...change}])?.lesson.id,id);
const enriched=c.MEL.enrichCatalog([lesson])[0];assert.equal(enriched.skill,'reading');assert.equal(enriched.sectionTitle,'Listening');assert.equal(c.MEL.headerSkill(enriched),'listening');assert.equal(lesson.exercise,'');assert.deepEqual(enriched.items,lesson.items);
for(const change of [{sectionTitle:'Function: custom shopping'},{skill:'grammar'},{section:'5.2'},{exercise:'6B'}]){
 const edited={...lesson,...change};assert.equal(c.MEL.enrichCatalog([edited])[0].verifiedHeaderTitle,undefined);assert.deepEqual(c.MEL.enrichCatalog([edited])[0],edited);
}
assert.equal(c.MEL.match([enriched,{...enriched,id:'duplicate-review'}],[header]),null);
const prompts=["A twenty-one-year-old German tourist called Tobi Gutt wanted to visit his girlfriend in Sydney, Australia.<br>Unfortunately, ","When he looked at the plane to Sidney, he became confused. Strangely, ","A few friendly people helped him with food and drink until eventually, "];
const answers=["he typed the wrong destination on a travel website","it was very small","his parents and friends from Germany sent him some money"];
const expected=Object.fromEntries(answers.map((a,i)=>[String(i+1),a]));
const html=`<!doctype html><meta charset="utf-8"><h2>5.1 | Listening</h2><h3>Exercise 7</h3><p>Listen to the sentences. Can you remember and complete the rest of the second sentence? Write down the exact words that you hear.</p><style>li{margin:30px}input{width:124px}</style><ol>${prompts.map((p,i)=>`<li value="${i+1}">${p}<input data-test="${i+1}" type="text">.</li>`).join('')}</ol><button>Save</button><button>Submit</button><script>window.model={};window.saved=0;document.querySelectorAll('[data-test]').forEach(el=>el.onchange=()=>model[el.dataset.test]=el.value);document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);</script>`;
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-tourist-complete-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();let app;
  const open=async()=>{await p.goto(header.origin+'/activities/unseen-tourist-complete/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);};
  const solve=onlyN=>app.evaluate(({id,onlyN})=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id,onlyN}),{id,onlyN});
  await open();let r=await solve();assert.equal(r.done,3,JSON.stringify(r));assert.equal(r.unresolved.length,0);assert.deepEqual(await p.evaluate(()=>model),expected);assert.equal(await p.evaluate(()=>saved),0);
  await open();await p.locator('ol').evaluate(el=>el.prepend(el.lastElementChild));r=await solve();assert.equal(r.done,3);assert.deepEqual(await p.evaluate(()=>model),expected);
  await open();r=await solve('2');assert.equal(r.done,1);assert.deepEqual(await p.evaluate(()=>model),{'2':'it was very small'});
  await open();await p.locator('li[value="3"]').evaluate(el=>el.after(el.cloneNode(true)));r=await solve();assert(!('3' in await p.evaluate(()=>model)));
  await open();await p.locator('h3').evaluate(el=>el.textContent='Exercise 6B');r=await solve();assert.equal(r.ok,false);assert.deepEqual(await p.evaluate(()=>model),{});
  assert.deepEqual((await worker.evaluate(()=>chrome.storage.local.get('melAnswerDataV11'))).melAnswerDataV11,seed);
  console.log('PASS 5.1 Listening Ex7: three full source phrases, line break and punctuation outside input; reordered rows/onlyN; duplicate question and 6B refused; no Save/Submit/source mutation');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-tourist-complete-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
