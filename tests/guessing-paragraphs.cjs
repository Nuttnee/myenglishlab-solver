// Screenshot paragraph text; dropdown inventories and native handlers are simulated.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.MEL_TEST_EXTENSION?path.resolve(process.env.MEL_TEST_EXTENSION):path.resolve(__dirname,'..');
const seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8')),id='ta2-u9-x-exx-certainty-texts',lesson=seed.lessons.find(l=>l.id===id),c=vm.createContext({});
for(const file of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',file+'.js'),'utf8'),c);
const header={origin:'https://myenglishlab.pearson-intl.com',section:'9.3',skill:'function',sectionTitle:'Function: making guesses',exercise:'3',activityId:'unseen-guessing-texts'};
assert.equal(c.MEL.match(seed.lessons,[header]).lesson.id,id);
for(const change of [{section:'9.2'},{exercise:'2'},{skill:'listening',sectionTitle:'Listening'}])assert.notEqual(c.MEL.match(seed.lessons,[{...header,...change}])?.lesson.id,id);
const enriched=c.MEL.enrichCatalog([lesson])[0];assert.equal(enriched.skill,'grammar');assert.equal(c.MEL.headerSkill(enriched),'function');assert.deepEqual(enriched.items,lesson.items);
const select=n=>`<select data-test="${n}"><option value="">Select an option</option>${['could','perhaps','might','maybe'].map((t,i)=>`<option value="option-${i}">${t}</option>`).join('')}</select>`;
const paragraphs=[
`The rain forest is home to thirty percent of all animal and plant life on Earth and 2.5 million types of insects. But it is disappearing because people cut down the trees for money. We don't know how fast it is disappearing, but satellite pictures show that it <input readonly value="might"> be by 15,000 square km every year. Some scientists think the rain forest ${select('1b')} disappear completely by 2080.`,
`We aren't sure exactly how many people died during the tsunami, but it was ${select('2a')} as many as 1,000. The tsunami destroyed large parts of the city, and the complete reconstruction of houses and other buildings ${select('2b')} take ten years or more.`,
`Everyone knows Venice – it ${select('3a')} be Italy's most famous city – but now it has a big problem: built on water, it is now sinking into the water. The situation is very serious: ${select('3b')} Venice will be completely under water in the next sixty years.`,
`Because of global warming, the ice is melting in the Arctic and some scientists say there ${select('4a')} be no ice there by 2060. Many animals that live in the Arctic, for example polar bears and foxes, ${select('4b')} be in danger.`
];
const expected={'1b':'could','2a':'perhaps','2b':'might','3a':'might','3b':'maybe','4a':'might','4b':'could'};
const html=`<!doctype html><meta charset="utf-8"><h2>9.3 | Function: making guesses</h2><h3>Exercise 3</h3><p>Select the correct alternative to complete the paragraphs.</p><style>li{margin:40px;width:650px;line-height:2}input{width:80px}</style><ol>${paragraphs.map((p,i)=>`<li value="${i+1}">${p}</li>`).join('')}</ol><button>Save</button><button>Submit</button><script>window.model={};window.saved=0;document.querySelectorAll('select').forEach(el=>el.onchange=()=>model[el.dataset.test]=el.selectedOptions[0].textContent);document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);</script>`;
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-guessing-texts-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();let app;
  const open=async()=>{await p.goto(header.origin+'/activities/unseen-guessing-texts/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);};
  const solve=onlyN=>app.evaluate(({id,onlyN})=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id,onlyN}),{id,onlyN});
  await open();let r=await solve();assert.equal(r.done,7,JSON.stringify(r));assert.equal(r.unresolved.length,0);assert.deepEqual(await p.evaluate(()=>model),expected);assert.equal(await p.locator('[readonly]').inputValue(),'might');assert.equal(await p.evaluate(()=>saved),0);
  await open();await p.locator('ol').evaluate(el=>el.prepend(el.lastElementChild));r=await solve();assert.equal(r.done,7,JSON.stringify(r));assert.deepEqual(await p.evaluate(()=>model),expected);
  await open();r=await solve('3b');assert.equal(r.done,1);assert.deepEqual(await p.evaluate(()=>model),{'3b':'maybe'});
  await open();await p.locator('[data-test="2a"] option').filter({hasText:'perhaps'}).evaluate(el=>el.remove());r=await solve();assert(!('2a' in await p.evaluate(()=>model)));
  await open();await p.locator('[data-test="4b"] option').filter({hasText:'could'}).evaluate(el=>el.after(el.cloneNode(true)));r=await solve();assert(!('4b' in await p.evaluate(()=>model)));
  await open();await p.locator('li[value="3"]').evaluate(el=>el.after(el.cloneNode(true)));r=await solve();assert(!('3a' in await p.evaluate(()=>model)));assert(!('3b' in await p.evaluate(()=>model)));
  await open();await p.locator('h3').evaluate(el=>el.textContent='Exercise 2');r=await solve();assert.equal(r.ok,false);assert.deepEqual(await p.evaluate(()=>model),{});
  assert.deepEqual((await worker.evaluate(()=>chrome.storage.local.get('melAnswerDataV11'))).melAnswerDataV11,seed);
  console.log('PASS seven paragraph dropdowns; fixed example preserved; reordered paragraphs and onlyN; missing/duplicate options and duplicate paragraphs refused; changed header refused; no Save/Submit or source mutation');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-guessing-texts-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
