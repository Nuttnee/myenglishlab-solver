// Screenshot sentences and fixed example; native change handler simulated.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.MEL_TEST_EXTENSION?path.resolve(process.env.MEL_TEST_EXTENSION):path.resolve(__dirname,'..');
const seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8')),id='ta2-u9-r3-ex11',lesson=seed.lessons.find(l=>l.id===id),c=vm.createContext({});
for(const file of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',file+'.js'),'utf8'),c);
const header={origin:'https://myenglishlab.pearson-intl.com',section:'R3',skill:'function',sectionTitle:'Function: making guesses',exercise:'11',activityId:'unseen-review-incorrect'};
assert.equal(c.MEL.match(seed.lessons,[header]).lesson.id,id);
for(const change of [{section:'R2'},{exercise:'12'},{skill:'listening',sectionTitle:'Listening'}])assert.notEqual(c.MEL.match(seed.lessons,[{...header,...change}])?.lesson.id,id);
const enriched=c.MEL.enrichCatalog([lesson])[0];assert.equal(enriched.skill,'grammar');assert.equal(enriched.sectionTitle,'Review 3');assert.equal(c.MEL.headerSkill(enriched),'function');assert.deepEqual(enriched.items,lesson.items);
for(const change of [{sectionTitle:'Function: custom shopping'},{skill:'reading'},{section:'R2'},{exercise:'12'}]){
 const edited={...lesson,...change};assert.equal(c.MEL.enrichCatalog([edited])[0].verifiedHeaderTitle,undefined);assert.deepEqual(c.MEL.enrichCatalog([edited])[0],edited);
}
assert.equal(c.MEL.match([enriched,{...enriched,id:'duplicate-review'}],[header]),null);
const prompts=["A: Is that Richard in the photo?<br>B: He has the same hair colour, but I'm not sure. It _____ him.","A: Are you going to the meeting tomorrow?<br>B: I don't really know. _____.","A: What's the answer to question 3?<br>B: I don't know, but _____ C because Moscow is in Russia.","A: Is Paris as expensive as London?<br>B: It _____ be. When I went there a few years ago, I paid €12 for a coffee!","A: Why hasn't she moved to a place nearer work?<br>B: I don't know, but _____ too expensive."];
const options=[["could be","can't","might be"],["Maybe","I definitely will","Perhaps"],["it can't be","it's definitely not","it mightn't be"],["could","can't","might"],["it can't be","perhaps it's","it might be"]];
const expected={'2':'I definitely will','3':"it mightn't be",'4':"can't",'5':"it can't be"};
const html=`<!doctype html><meta charset="utf-8"><h2>R3 | Function: making guesses</h2><h3>Exercise 11</h3><p>Select the incorrect alternative in each sentence.</p><style>li{margin:20px;width:650px}</style><ol>${prompts.map((p,i)=>`<li value="${i+1}" class="${i===0?'example':''}">${p}${options[i].map((v,j)=>`<label style="display:block"><input type="radio" name="question-${i+1}" data-test="${i+1}" value="option-${j}" ${i===0?'disabled '+(j===1?'checked':''):''}>${v}</label>`).join('')}</li>`).join('')}</ol><button>Save</button><button>Submit</button><script>window.model={};window.saved=0;document.querySelectorAll('input').forEach(el=>el.onchange=()=>model[el.dataset.test]=el.parentElement.textContent.trim());document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);</script>`;
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-review-incorrect-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();let app;
  const open=async()=>{await p.goto(header.origin+'/activities/unseen-review-incorrect/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);};
  const solve=onlyN=>app.evaluate(({id,onlyN})=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id,onlyN}),{id,onlyN});
  await open();let r=await solve();assert.equal(r.done,4,JSON.stringify(r));assert.equal(r.unresolved.length,0);assert.deepEqual(await p.evaluate(()=>model),expected);assert.equal(await p.locator('.example input:checked').inputValue(),'option-1');assert.equal(await p.evaluate(()=>saved),0);
  await open();await p.locator('ol').evaluate(el=>el.prepend(el.lastElementChild));r=await solve();assert.equal(r.done,4);assert.deepEqual(await p.evaluate(()=>model),expected);
  await open();r=await solve('5');assert.equal(r.done,1);assert.deepEqual(await p.evaluate(()=>model),{'5':"it can't be"});
  await open();await p.locator('li[value="3"]').evaluate(el=>{const copy=el.cloneNode(true);copy.querySelectorAll('input').forEach(x=>x.name+='-duplicate');el.after(copy);});r=await solve();assert(!('3' in await p.evaluate(()=>model)));
  await open();await p.locator('h3').evaluate(el=>el.textContent='Exercise 12');r=await solve();assert.equal(r.ok,false);assert.deepEqual(await p.evaluate(()=>model),{});
  assert.deepEqual((await worker.evaluate(()=>chrome.storage.local.get('melAnswerDataV11'))).melAnswerDataV11,seed);
  console.log('PASS R3 11 Function header with grammar source retained; four incorrect alternatives; fixed example absent from seed retained; reordered groups/onlyN, duplicates and changed exercise refused; no Save/Submit/source mutation');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-review-incorrect-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
