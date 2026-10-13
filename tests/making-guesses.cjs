// Screenshot sentences and fixed example; native change handler simulated.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.MEL_TEST_EXTENSION?path.resolve(process.env.MEL_TEST_EXTENSION):path.resolve(__dirname,'..');
const seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8')),id='ta2-u9-x-exx-certainty-correction',lesson=seed.lessons.find(l=>l.id===id),c=vm.createContext({});
for(const file of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',file+'.js'),'utf8'),c);
const header={origin:'https://myenglishlab.pearson-intl.com',section:'9.3',skill:'function',sectionTitle:'Function: making guesses',exercise:'2',activityId:'unseen-guesses'};
assert.equal(c.MEL.match(seed.lessons,[header]).lesson.id,id);
for(const change of [{section:'9.2'},{exercise:'1'},{skill:'listening',sectionTitle:'Listening'}])assert.notEqual(c.MEL.match(seed.lessons,[{...header,...change}])?.lesson.id,id);
const enriched=c.MEL.enrichCatalog([lesson])[0];assert.equal(enriched.skill,'grammar');assert.equal(c.MEL.headerSkill(enriched),'function');assert.deepEqual(enriched.items,lesson.items);
const prompts=["Maybe that's a glacier in the photo.","The waterfall don't can be here – it's too dry.","That bird can't be an eagle – it's too small.","Perhaps that the people scared all the animals away.","The mountain range in the picture could to be the Himalayas.","Those might be a bear's footprints on the ground.","That's definitely no a mosquito bite – it's too big."];
const answers=['correct',"The waterfall can't be here - it's too dry",'correct','Perhaps the people scared all the animals away','The mountain range in the picture could be the Himalayas','correct',"That's definitely not a mosquito bite - it's too big"];
const expected=Object.fromEntries(answers.map((a,i)=>[String(i+2),a]));
const example='That animal might be a chimpanzee or a monkey';
const html=`<!doctype html><meta charset="utf-8"><h2>9.3 | Function: making guesses</h2><h3>Exercise 2</h3><p>There are mistakes in five of the sentences. Find the mistakes and rewrite the sentences correctly. If there are no mistakes, write 'correct'.</p><style>li{margin:15px}input{width:260px}</style><ol><li value="1">That animal might to be a chimpanzee or a monkey.<br><input readonly value="${example}">.</li>${prompts.map((p,i)=>`<li value="${i+2}">${p}<br><input data-test="${i+2}" type="text">.</li>`).join('')}</ol><button>Save</button><button>Submit</button><script>window.model={};window.saved=0;document.querySelectorAll('[data-test]').forEach(el=>el.onchange=()=>model[el.dataset.test]=el.value);document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);</script>`;
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-guesses-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();let app;
  const open=async()=>{await p.goto(header.origin+'/activities/unseen-guesses/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);};
  const solve=onlyN=>app.evaluate(({id,onlyN})=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id,onlyN}),{id,onlyN});
  await open();let r=await solve();assert.equal(r.done,7,JSON.stringify(r));assert.equal(r.unresolved.length,0);assert.deepEqual(await p.evaluate(()=>model),expected);assert.equal(await p.locator('[readonly]').inputValue(),example);assert.equal(await p.evaluate(()=>saved),0);
  await open();await p.locator('ol').evaluate(el=>el.prepend(el.lastElementChild));r=await solve();assert.equal(r.done,7);assert.deepEqual(await p.evaluate(()=>model),expected);
  await open();r=await solve('7');assert.equal(r.done,1);assert.deepEqual(await p.evaluate(()=>model),{'7':'correct'});
  await open();await p.locator('li[value="3"]').evaluate(el=>el.after(el.cloneNode(true)));r=await solve();assert(!('3' in await p.evaluate(()=>model)));
  await open();await p.locator('h3').evaluate(el=>el.textContent='Exercise 1');r=await solve();assert.equal(r.ok,false);assert.deepEqual(await p.evaluate(()=>model),{});
  assert.deepEqual((await worker.evaluate(()=>chrome.storage.local.get('melAnswerDataV11'))).melAnswerDataV11,seed);
  console.log('PASS Function header with grammar source skill retained; seven answers/three lowercase correct; fixed example absent from seed retained; reordered rows, onlyN, duplicates/header conflicts refused; no Save/Submit/source mutation');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-guesses-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
