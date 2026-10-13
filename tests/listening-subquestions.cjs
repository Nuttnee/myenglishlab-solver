// BR/LI/input structure and question text from user diagnostic; handlers simulated.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.MEL_TEST_EXTENSION?path.resolve(process.env.MEL_TEST_EXTENSION):path.resolve(__dirname,'..');
const seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8')),id='ta2-u9-x-exx-listening-questions';
const rules=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(base,'lib/rules.js'),'utf8'),rules);
for(const otherId of ['ta1-u2-x-ex4','ta2-u5-5.1-exx-pastcont-conversations'])assert(rules.MELRules.rows(seed.lessons.find(l=>l.id===otherId)).every(r=>!r.subQuestion),'Conversation numbering must retain its existing matching rules');
const input=(key,example=false)=>`<input class="normalWidth" type="text" data-test="${key}" ${example?'readonly value="dog"':''}>`;
const questions=[[
 `a) Who does the speaker go for walks with these days?<br>Her ${input('1a',true)}`,
 `b) What did she see on the beach once?<br>A ${input('1b-1')} ${input('1b-2')}`
],[
 `a) What did the speaker invent as a child?<br>${input('2a')}`,
 `b) Where does she say she 'grew up'?<br>In the ${input('2b')}`
],[
 `a) When does the speaker go hiking and camping?<br>In the ${input('3a')}`,
 `b) What 'big' things does he say that Americans like?<br>${input('3b-1')} and ${input('3b-2')}`
],[
 `a) What animals does the speaker work with?<br>${input('4a-1')}, ${input('4a-2')} and ${input('4a-3')}`,
 `b) What doesn't he like about living on a farm?<br>Getting ${input('4b-1')} ${input('4b-2')}`
]];
const expected={'1b-1':'dead','1b-2':'whale','2a':'Games','2b':'garden','3a':'summer','3b-1':'spaces','3b-2':'skies','4a-1':'chickens','4a-2':'cows','4a-3':'pigs','4b-1':'up','4b-2':'early'};
function fixture(reverse=false){return `<!doctype html><meta charset="utf-8"><h2>9.2 | Listening</h2><h3>Exercise 4B</h3><p>Listen and answer the questions. Do not use more than three words for each answer.</p><style>input{width:60px}li{margin:15px}</style><ol>${questions.map((parts,i)=>`<li class="item" value="${i+1}"><div class="itemContent fillin"><div class="itemNumber">${i+1}</div>${(reverse&&i!==1?[...parts].reverse():parts).join('<br>')}</div></li>`).join('')}</ol><button>Save</button><button>Submit</button><script>window.model={};window.saved=0;document.querySelectorAll('input').forEach(el=>el.onchange=()=>model[el.dataset.test]=el.value);document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);</script>`;}
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-subquestions-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  let html;await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();let app;
  const open=async(reverse=false)=>{html=fixture(reverse);await p.goto('https://myenglishlab.pearson-intl.com/activities/unseen-subquestions/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);};
  const solve=onlyN=>app.evaluate(({id,onlyN})=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id,onlyN}),{id,onlyN});
  for(const reverse of [false,true]){await open(reverse);if(reverse)await p.locator('ol').evaluate(el=>el.prepend(el.lastElementChild));const r=await solve();assert.equal(r.done,12,JSON.stringify(r));assert.deepEqual(await p.evaluate(()=>model),expected);assert.equal(await p.locator('[readonly]').inputValue(),'dog');assert.equal(await p.evaluate(()=>saved),0);}
  await open();let r=await solve('1b-2');assert.equal(r.done,1);assert.deepEqual(await p.evaluate(()=>model),{'1b-2':'whale'});
  await open();await p.locator('[data-test="1b-2"]').evaluate(el=>el.remove());r=await solve();assert(!('1b-1' in await p.evaluate(()=>model)));assert(r.unresolved.some(x=>x.n==='1b-1'));
  await open();await p.locator('li').last().evaluate(el=>el.after(el.cloneNode(true)));r=await solve();assert(!(Object.keys(await p.evaluate(()=>model)).some(n=>n.startsWith('4'))));
  await open();await p.locator('li').first().evaluate(el=>{el.innerHTML=el.innerHTML.replace('b) What did she see','c) What did she see');});r=await solve();assert(!('1b-1' in await p.evaluate(()=>model)));
  await open();await p.locator('li').last().evaluate(el=>{el.innerHTML=el.innerHTML.replace('Getting','Leaving');});r=await solve();assert(!('4b-1' in await p.evaluate(()=>model)));
  const stored=await worker.evaluate(()=>chrome.storage.local.get('melAnswerDataV11'));assert.deepEqual(stored.melAnswerDataV11,seed);
  console.log('PASS twelve fields including adjacent dead/whale and up/early, exact case, dog example; reordered groups/subquestions, onlyN, missing slot/duplicate group/changed label/template refused; no Save/Submit or source mutation');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-subquestions-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
