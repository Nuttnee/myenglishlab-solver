// Screenshot paragraph text; dropdown inventories and native handlers are simulated.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.MEL_TEST_EXTENSION?path.resolve(process.env.MEL_TEST_EXTENSION):path.resolve(__dirname,'..');
const seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8')),id='ta2-u9-r3-ex10',lesson=seed.lessons.find(l=>l.id===id),c=vm.createContext({});
for(const file of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',file+'.js'),'utf8'),c);
const header={origin:'https://myenglishlab.pearson-intl.com',section:'R3',skill:'grammar',sectionTitle:'Grammar: articles',exercise:'10',activityId:'unseen-review-articles'};
assert.equal(c.MEL.match(seed.lessons,[header]).lesson.id,id);
for(const change of [{section:'9.2'},{exercise:'2'},{skill:'listening',sectionTitle:'Listening'}])assert.notEqual(c.MEL.match(seed.lessons,[{...header,...change}])?.lesson.id,id);
const enriched=c.MEL.enrichCatalog([lesson])[0];assert.equal(enriched.skill,'grammar');assert.equal(c.MEL.headerSkill(enriched),'grammar');assert.deepEqual(enriched.items,lesson.items);
const select=n=>`<select data-test="${n}"><option value="">Select an option</option>${['a','an','the','-'].map((t,i)=>`<option value="option-${i}">${t}</option>`).join('')}</select>`;
const story=`<input readonly value="A"> plane carrying ${select('2')} actor, ${select('3')} politician, a monk and a cleaner is going to crash. There are only ${select('4')} three parachutes. ${select('5')} actor says, 'I entertain ${select('6')} millions of people so I should live.' He takes one of ${select('7')} parachutes and jumps out of ${select('8')} plane. The politician says, 'I'm ${select('9')} most intelligent person in ${select('10')} England so I should live.' He also takes ${select('11')} parachute and jumps. The monk says, 'I'm ${select('12')} old man and I have lived ${select('13')} good long life. You take ${select('14')} last parachute.' The cleaner says, 'Don't worry. The most intelligent man in ${select('15')} country just jumped out with my ${select('16')} rucksack on his back.'`;
const expected={'2':'an','3':'a','4':'-','5':'the','6':'-','7':'the','8':'the','9':'the','10':'-','11':'a','12':'an','13':'a','14':'the','15':'the','16':'-'};
const html=`<!doctype html><meta charset="utf-8"><h2>R3 | Grammar: articles</h2><h3>Exercise 10</h3><p>Complete the text by selecting the correct article, a, an, the or – (no article).</p><style>.itemContent{width:650px;line-height:2}input{width:80px}</style><div class="itemContent">${story}</div><button>Save</button><button>Submit</button><script>window.model={};window.saved=0;document.querySelectorAll('select').forEach(el=>el.onchange=()=>model[el.dataset.test]=el.selectedOptions[0].textContent);document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);</script>`;
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-review-articles-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();let app;
  const open=async()=>{await p.goto(header.origin+'/activities/unseen-review-articles/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);};
  const solve=onlyN=>app.evaluate(({id,onlyN})=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id,onlyN}),{id,onlyN});
  await open();let r=await solve();assert.equal(r.done,15,JSON.stringify(r));assert.equal(r.unresolved.length,0);assert.deepEqual(await p.evaluate(()=>model),expected);assert.equal(await p.locator('[readonly]').inputValue(),'A');assert.equal(await p.evaluate(()=>saved),0);
  await open();r=await solve('2');assert.equal(r.done,1);assert.deepEqual(await p.evaluate(()=>model),{'2':'an'});
  await open();r=await solve('5');assert.equal(r.done,1);assert.deepEqual(await p.evaluate(()=>model),{'5':'the'});
  await open();await p.locator('select').evaluateAll(els=>els.forEach(el=>{if(!['2','5'].includes(el.dataset.test))el.value=el.dataset.test==='4'?'option-3':'option-0';}));r=await solve();assert.equal(r.done,15);assert.deepEqual(await p.evaluate(()=>model),expected);
  // Correct short neighbours alone must not authorize writes without two anchors.
  await open();await p.locator('select').evaluateAll(els=>els.forEach(el=>{if(!['2','5'].includes(el.dataset.test))el.remove();}));r=await solve();assert.deepEqual(await p.evaluate(()=>model),{});
  await open();await p.locator('[data-test="2"] option').filter({hasText:/^an$/}).evaluate(el=>el.remove());r=await solve();assert(!('2' in await p.evaluate(()=>model)));
  await open();await p.locator('.itemContent').evaluate(el=>el.after(el.cloneNode(true)));r=await solve();assert.deepEqual(await p.evaluate(()=>model),{});
  await open();await p.locator('h3').evaluate(el=>el.textContent='Exercise 11');r=await solve();assert.equal(r.ok,false);assert.deepEqual(await p.evaluate(()=>model),{});
  assert.deepEqual((await worker.evaluate(()=>chrome.storage.local.get('melAnswerDataV11'))).melAnswerDataV11,seed);
  console.log('PASS all 15 article dropdowns including short actor fragments; fixed A, onlyN 2/5, missing option/duplicate passage/header change refused; no Save/Submit/source mutation');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-review-articles-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
