// Screenshot phrases and order; drag DOM/events are a supported-widget simulation.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.MEL_TEST_EXTENSION?path.resolve(process.env.MEL_TEST_EXTENSION):path.resolve(__dirname,'..');
const seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8')),id='ta2-u9-x-exx-g',lesson=seed.lessons.find(l=>l.id===id),c=vm.createContext({});
for(const file of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',file+'.js'),'utf8'),c);
const header={origin:'https://myenglishlab.pearson-intl.com',section:'9.2',skill:'vocabulary',sectionTitle:'Vocabulary: the outdoors',exercise:'1B',activityId:'unseen-outdoors'};
assert.equal(c.MEL.match(seed.lessons,[header]).lesson.id,id);
for(const change of [{section:'9.1'},{exercise:'1A'},{exercise:'2'},{sectionTitle:'Grammar: conditionals',skill:'grammar'}])assert.notEqual(c.MEL.match(seed.lessons,[{...header,...change}])?.lesson.id,id);
assert.deepEqual(c.MEL.enrichCatalog([lesson])[0].items,lesson.items);
const prompts=['geographical _','fresh _','national _','beautiful _','_ centre','_ rainforest','_ area','_ beauty'];
const answers=['features','air','park','scenery','wildlife','tropical','rural','natural'];
const html=`<!doctype html><meta charset="utf-8"><h2>9.2 | Vocabulary: the outdoors</h2><h3>Exercise 1B</h3><p>Complete the phrases with the words below.</p><style>.drop,.drag{display:inline-block;border:1px solid;padding:5px;min-width:60px;min-height:18px}li{margin:8px}</style><div class="wordpoolWrapper"><span class="drag" aria-disabled="true">features</span>${['natural','rural','air','tropical','wildlife','park','scenery'].map((word,i)=>`<span class="drag" draggable="true" data-id="token-${i}">${word}</span>`).join('')}</div><ol class="droppableWrapper">${prompts.map((text,i)=>`<li value="${i+1}">${text.replace('_',`<span class="drop${i===0?' example':''}" id="slot-${i+1}">${i===0?'features':'DRAG ITEM HERE'}</span>`)}</li>`).join('')}</ol><button>Save</button><button>Submit</button><script>window.ops=0;window.saved=0;document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);document.addEventListener('dragstart',e=>{if(e.target.draggable)e.dataTransfer.setData('token',e.target.dataset.id);});document.addEventListener('dragover',e=>e.preventDefault());document.addEventListener('drop',e=>{e.preventDefault();const t=e.target.closest('.drop'),s=[...document.querySelectorAll('[draggable=true]')].find(el=>el.dataset.id===e.dataTransfer.getData('token'));if(t&&s&&!t.classList.contains('example')){t.replaceChildren(s);ops++;}});</script>`;
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-outdoors-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();let app;
  const open=async()=>{await p.goto(header.origin+'/activities/unseen-outdoors/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);};
  const solve=onlyN=>app.evaluate(({id,onlyN})=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id,onlyN}),{id,onlyN});
  await open();let r=await solve();assert.equal(r.done,7,JSON.stringify(r));assert(!r.error);assert.deepEqual(await p.locator('.drop').allTextContents(),answers);assert.equal(await p.evaluate(()=>saved),0);
  r=await solve();assert.equal(r.done,0);assert.equal(r.skipped,7);assert.equal(await p.evaluate(()=>ops),7);
  await open();r=await solve('5');assert.equal(r.done,1);assert.equal(await p.locator('#slot-5').innerText(),'wildlife');assert.equal(await p.locator('#slot-2').innerText(),'DRAG ITEM HERE');r=await solve();assert.equal(r.done,6);assert.equal(r.skipped,1);
  await open();await p.locator('h3').evaluate(el=>el.textContent='Exercise 1A');r=await solve();assert.equal(r.ok,false);assert.equal(await p.evaluate(()=>ops),0);
  const stored=await worker.evaluate(()=>chrome.storage.local.get('melAnswerDataV11'));assert.deepEqual(stored.melAnswerDataV11.lessons.find(l=>l.id===id),lesson);
  console.log('PASS 9.2 Ex1B header on unseen activity; Ex1A/other headers refused; seven phrase drops including blanks before/after text; example/partial/rerun/onlyN preserved; no Save/Submit or stored-source mutation');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-outdoors-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
