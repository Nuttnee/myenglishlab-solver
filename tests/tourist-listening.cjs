// Screenshot sentences and fixed example; native change handler simulated.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.MEL_TEST_EXTENSION?path.resolve(process.env.MEL_TEST_EXTENSION):path.resolve(__dirname,'..');
const seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8')),id='ta2-u5-5.1-exx-tobigutt-tf',lesson=seed.lessons.find(l=>l.id===id),c=vm.createContext({});
for(const file of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',file+'.js'),'utf8'),c);
const header={origin:'https://myenglishlab.pearson-intl.com',section:'5.1',skill:'listening',sectionTitle:'Listening',exercise:'6B',activityId:'unseen-tourist-listening'};
assert.equal(c.MEL.match(seed.lessons,[header]).lesson.id,id);
for(const change of [{section:'5.2'},{exercise:'6A'},{skill:'grammar',sectionTitle:'Grammar'}])assert.notEqual(c.MEL.match(seed.lessons,[{...header,...change}])?.lesson.id,id);
const enriched=c.MEL.enrichCatalog([lesson])[0];assert.equal(enriched.skill,'reading');assert.equal(enriched.sectionTitle,'Listening');assert.equal(c.MEL.headerSkill(enriched),'listening');assert.equal(lesson.exercise,'');assert.deepEqual(enriched.items,lesson.items);
for(const change of [{sectionTitle:'Function: custom shopping'},{skill:'grammar'},{section:'5.2'},{exercise:'6A'}]){
 const edited={...lesson,...change};assert.equal(c.MEL.enrichCatalog([edited])[0].verifiedHeaderTitle,undefined);assert.deepEqual(c.MEL.enrichCatalog([edited])[0],edited);
}
assert.equal(c.MEL.match([enriched,{...enriched,id:'duplicate-review'}],[header]),null);
const prompts=["A German man wanted to visit his girlfriend in Sydney, Australia.","When he was booking his ticket, he made a mistake.","His flight took him to the wrong town in Australia.","He was wearing summer clothes because the weather in Montana was hot.","His parents and friends sent him warm clothes.","After a few days, he bought a ticket to Australia."];
const expected={'2':'T','3':'F','4':'F','5':'F','6':'T'};
const html=`<!doctype html><meta charset="utf-8"><h2>5.1 | Listening</h2><h3>Exercise 6B</h3><p>Listen to the story about a German tourist. Are the sentences true (T) or false (F)?</p><style>ol{width:650px}li{margin:15px}</style><ol>${prompts.map((p,i)=>`<li value="${i+1}" class="${i===0?'example':''}">${p}${['T','F'].map(v=>`<label style="display:block"><input type="radio" name="question-${i+1}" data-test="${i+1}" value="${v}" ${i===0?'disabled '+(v==='T'?'checked':''):''}>${v}</label>`).join('')}</li>`).join('')}</ol><button>Save</button><button>Submit</button><script>window.model={};window.saved=0;document.querySelectorAll('input').forEach(el=>el.onchange=()=>model[el.dataset.test]=el.value);document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);</script>`;
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-tourist-tf-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();let app;
  const open=async()=>{await p.goto(header.origin+'/activities/unseen-tourist-listening/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);};
  const solve=onlyN=>app.evaluate(({id,onlyN})=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id,onlyN}),{id,onlyN});
  await open();let r=await solve();assert.equal(r.done,5,JSON.stringify(r));assert.equal(r.unresolved.length,0);assert.deepEqual(await p.evaluate(()=>model),expected);assert.equal(await p.locator('.example input:checked').inputValue(),'T');assert.equal(await p.evaluate(()=>saved),0);
  await open();await p.locator('ol').evaluate(el=>el.prepend(el.lastElementChild));r=await solve();assert.equal(r.done,5);assert.deepEqual(await p.evaluate(()=>model),expected);
  await open();r=await solve('6');assert.equal(r.done,1);assert.deepEqual(await p.evaluate(()=>model),{'6':'T'});
  await open();await p.locator('li[value="3"]').evaluate(el=>{const copy=el.cloneNode(true);copy.querySelectorAll('input').forEach(x=>x.name+='-duplicate');el.after(copy);});r=await solve();assert(!('3' in await p.evaluate(()=>model)));
  await open();await p.locator('h3').evaluate(el=>el.textContent='Exercise 6A');r=await solve();assert.equal(r.ok,false);assert.deepEqual(await p.evaluate(()=>model),{});
  assert.deepEqual((await worker.evaluate(()=>chrome.storage.local.get('melAnswerDataV11'))).melAnswerDataV11,seed);
  console.log('PASS 5.1 Listening 6B header with source reading skill retained; five T/F choices including truncated question 4; fixed example absent from seed; reordered rows/onlyN; duplicates and 6A refused; no Save/Submit/source mutation');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-tourist-tf-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
