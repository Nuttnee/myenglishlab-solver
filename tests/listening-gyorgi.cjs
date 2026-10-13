// Screenshot phrases and order; drag DOM/events are a supported-widget simulation.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.MEL_TEST_EXTENSION?path.resolve(process.env.MEL_TEST_EXTENSION):path.resolve(__dirname,'..');
const seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8')),id='ta2-u9-x-exx-listening-vocab-text',lesson=seed.lessons.find(l=>l.id===id),c=vm.createContext({});
for(const file of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',file+'.js'),'utf8'),c);
const header={origin:'https://myenglishlab.pearson-intl.com',section:'9.2',skill:'listening',sectionTitle:'Listening',exercise:'4D',activityId:'unseen-gyorgi'};
assert.equal(c.MEL.match(seed.lessons,[header]).lesson.id,id);
for(const change of [{section:'9.1'},{exercise:'4C'},{exercise:'1B'},{sectionTitle:'Grammar: conditionals',skill:'grammar'}])assert.notEqual(c.MEL.match(seed.lessons,[{...header,...change}])?.lesson.id,id);
assert.deepEqual(c.MEL.enrichCatalog([lesson])[0].items,lesson.items);
assert.equal(c.MEL.enrichCatalog([lesson])[0].skill,'vocabulary');
assert.equal(c.MEL.headerSkill(c.MEL.enrichCatalog([lesson])[0]),'listening');
const answers=['completely normal','be outside','fun','all kinds of','hiking','tree house','feeding','enormous'];
const gap=i=>`<span class="drop${i===0?' example':''}" id="slot-${i+1}">${i===0?answers[0]:'DRAG ITEM HERE'}</span>`;
const html=`<!doctype html><meta charset="utf-8"><h2>9.2 | Listening</h2><h3>Exercise 4D</h3><p>Read what Gyorgi says about his experiences in nature. Complete the text with the words and phrases below.</p><style>.drop,.drag{display:inline-block;border:1px solid;padding:5px;min-width:65px;min-height:18px}.itemContent{width:620px;line-height:2}</style><div class="wordpoolWrapper">${[3,6,2,0,4,5,1,7].map(i=>`<span class="drag" ${i===0?'aria-disabled="true"':'draggable="true"'} data-id="word-${i}">${answers[i]}</span>`).join('')}</div><div class="droppableWrapper"><div class="itemContent">'When I was younger, I lived in a very cold part of Russia. It was ${gap(0)} for the temperature to be minus twenty degrees and in the winter, you might not ${gap(1)} for many weeks. We spent a lot of time at home, playing games and singing in front of the fire. To be honest, it wasn't much ${gap(2)} in winter, but in the summer we did ${gap(3)} enjoyable activities. Where I lived, there were some mountains and forests and we sometimes went ${gap(4)} in the mountains with my parents. And I remember we once built a ${gap(5)} in my garden. My brother loved birds and he spent hours ${gap(6)} them different types of fruit and nuts while he was sitting in it. As a child, I always thought our garden was ${gap(7)}, but when I went back there a few years ago, I saw that it was quite small.'</div></div><button>Save</button><button>Submit</button><script>window.ops=0;window.saved=0;window.ignore=false;document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);document.addEventListener('dragstart',e=>{if(e.target.draggable)e.dataTransfer.setData('token',e.target.dataset.id);});document.addEventListener('dragover',e=>e.preventDefault());document.addEventListener('drop',e=>{e.preventDefault();if(ignore)return;const t=e.target.closest('.drop'),s=[...document.querySelectorAll('[draggable=true]')].find(el=>el.dataset.id===e.dataTransfer.getData('token'));if(t&&s&&!t.classList.contains('example')){t.replaceChildren(s);ops++;}});</script>`;
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-gyorgi-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();let app;
  const open=async()=>{await p.goto(header.origin+'/activities/unseen-gyorgi/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);};
  const solve=onlyN=>app.evaluate(({id,onlyN})=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id,onlyN}),{id,onlyN});
  await open();let r=await solve();assert.equal(r.done,7,JSON.stringify(r));assert(!r.error);assert.deepEqual(await p.locator('.drop').allTextContents(),answers);assert.equal(await p.evaluate(()=>saved),0);
  r=await solve();assert.equal(r.done,0);assert.equal(r.skipped,7);assert.equal(await p.evaluate(()=>ops),7);
  await open();r=await solve('5');assert.equal(r.done,1);assert.equal(await p.locator('#slot-5').innerText(),answers[4]);assert.equal(await p.locator('#slot-2').innerText(),'DRAG ITEM HERE');r=await solve();assert.equal(r.done,6);assert.equal(r.skipped,1);
  await open();await p.locator('h3').evaluate(el=>el.textContent='Exercise 4C');r=await solve();assert.equal(r.ok,false);assert.equal(await p.evaluate(()=>ops),0);
  await open();await p.evaluate(()=>window.ignore=true);r=await solve();assert.equal(r.done,0);assert(r.error);assert.equal(await p.evaluate(()=>ops),0);
  const stored=await worker.evaluate(()=>chrome.storage.local.get('melAnswerDataV11'));assert.deepEqual(stored.melAnswerDataV11.lessons.find(l=>l.id===id),lesson);
  console.log('PASS 9.2 Listening Ex4D recognized with vocabulary source skill retained; seven inline paragraph gaps; fixed example, partial/rerun/onlyN, ignored drops and wrong header refused; no Save/Submit or stored-source mutation');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-gyorgi-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
