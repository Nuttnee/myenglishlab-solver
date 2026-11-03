// Screenshot phrases and order; drag DOM/events are a supported-widget simulation.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.MEL_TEST_EXTENSION?path.resolve(process.env.MEL_TEST_EXTENSION):path.resolve(__dirname,'..');
const mode=process.argv.includes('--map')?'map':process.argv.includes('--topics')?'topics':'outdoors',map=mode==='map',topics=mode==='topics',numbered=map||topics;
const config={
 map:{section:'5.3',exercise:'3',skill:'function',sectionTitle:'Function: asking for / giving directions',instruction:'Look at the map and listen to the directions. Where is the man trying to go?',id:'ta2-u5-5.3-exx-map-places',answers:['restaurant','bar','university hall','theatre','park','library']},
 topics:{section:'',exercise:'2',skill:'',sectionTitle:'',instruction:'Watch the video from 0:30–3:07. Put the phrases in the boxes in the order you hear them.',id:'ta2-u5-5.4-exx-topics-order',answers:['good experience','different lifestyle','Egypt','beautiful scenery','eating different food','plane journeys','backpacking','missing flights']},
 outdoors:{section:'9.2',exercise:'1B',skill:'vocabulary',sectionTitle:'Vocabulary: the outdoors',instruction:'Complete the phrases with the words below.',id:'ta2-u9-x-exx-g',answers:['features','air','park','scenery','wildlife','tropical','rural','natural']}
}[mode];
const {section,exercise,skill,sectionTitle,instruction,id,answers}=config;
const seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8')),lesson=seed.lessons.find(l=>l.id===id),c=vm.createContext({});
for(const file of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',file+'.js'),'utf8'),c);
const header={origin:'https://myenglishlab.pearson-intl.com',section,skill,sectionTitle,exercise,activityId:'unseen-outdoors'};
const numberedBanks=topics?[{labels:answers.map((_,i)=>String(i+1)),values:[answers[1],answers[5],answers[7],answers[3],answers[2],answers[6],answers[0],answers[4]],fixed:[['1',answers[0]]]}]:[];
if(topics)assert.notEqual(c.MEL.match(seed.lessons,[{...header,questionText:`${instruction} ${answers.join(' ')} 1 2 3 4 5 6 7 8`}])?.lesson.id,'ta1-u1-1.4-exx4');
assert.equal(c.MEL.match(seed.lessons,[{...header,numberedBanks}]).lesson.id,id);
for(const change of [{section:'9.1'},{exercise:'1A'},{sectionTitle:'Grammar: conditionals',skill:'grammar'}])assert.notEqual(c.MEL.match(seed.lessons,[{...header,numberedBanks,...change}])?.lesson.id,id);
assert.deepEqual(c.MEL.enrichCatalog([lesson])[0].items,lesson.items);
const prompts=map?Array.from({length:6},(_,i)=>String(i+1)+' _'):['geographical _','fresh _','national _','beautiful _','_ centre','_ rainforest','_ area','_ beauty'];
const widget=numbered?fs.readFileSync(path.join(__dirname,'fixtures',topics?'travel-topics-numbered-drops.html':'map-numbered-drops.html'),'utf8'):`<div class="wordpoolWrapper"><span class="drag" aria-disabled="true">${answers[0]}</span>${['natural','rural','air','tropical','wildlife','park','scenery'].map((word,i)=>`<span class="drag" draggable="true" data-id="token-${i}">${word}</span>`).join('')}</div><ol class="droppableWrapper">${prompts.map((text,i)=>`<li value="${i+1}">${text.replace('_',`<span class="drop${i===0?' example':''}" id="slot-${i+1}">${i===0?answers[0]:'DRAG ITEM HERE'}</span>`)}</li>`).join('')}</ol>`;
const pageTitle=topics?'Travel':`${section} | ${sectionTitle}`;
const html=`<!doctype html><meta charset="utf-8"><h2>${pageTitle}</h2><h3>Exercise ${exercise}</h3><p>${instruction}</p><style>.drop,.drag{display:inline-block;border:1px solid;padding:5px;min-width:60px;min-height:18px}li{margin:8px}</style>${widget}<button>Save</button><button>Submit</button><script>window.ops=0;window.saved=0;document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);document.addEventListener('dragstart',e=>{if(e.target.draggable)e.dataTransfer.setData('token',e.target.dataset.id);});document.addEventListener('dragover',e=>e.preventDefault());document.addEventListener('drop',e=>{e.preventDefault();const t=e.target.closest('.drop'),s=[...document.querySelectorAll('[draggable=true]')].find(el=>el.dataset.id===e.dataTransfer.getData('token'));if(t&&s&&!t.classList.contains('example')){t.replaceChildren(s);ops++;}});</script>`;
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-outdoors-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();let app;
  const open=async()=>{await p.goto(header.origin+'/activities/unseen-outdoors/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);};
  const solve=onlyN=>app.evaluate(({id,onlyN})=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id,onlyN}),{id,onlyN});
  await open();let r=await solve();assert.equal(r.done,answers.length-1,JSON.stringify(r));assert(!r.error);assert.deepEqual(await p.locator('.drop').allTextContents(),answers);assert.equal(await p.evaluate(()=>saved),0);
  r=await solve();assert.equal(r.done,0);assert.equal(r.skipped,answers.length-1);assert.equal(await p.evaluate(()=>ops),answers.length-1);
  await open();r=await solve('5');assert.equal(r.done,1);assert.equal(await p.locator('.drop').nth(4).innerText(),answers[4]);assert.equal(await p.locator('.drop').nth(1).innerText(),numbered?'':'DRAG ITEM HERE');r=await solve();assert.equal(r.done,answers.length-2);assert.equal(r.skipped,1);
  await open();await p.locator('h3').evaluate(el=>el.textContent='Exercise 1A');r=await solve();assert.equal(r.ok,false);assert.equal(await p.evaluate(()=>ops),0);
  if(map){
    await open();await p.locator('.dndlh b').evaluateAll(labels=>{labels[1].textContent='6';labels[5].textContent='2';});
    r=await solve();assert.equal(r.done,5);assert.deepEqual(await p.locator('.drop').allTextContents(),['restaurant','library','university hall','theatre','park','bar']);
    for(const error of ['duplicate','missing','example','bank']){
      await open();await p.evaluate(error=>{
        if(error==='duplicate')document.querySelectorAll('.dndlh b')[2].textContent='2';
        if(error==='missing')document.querySelectorAll('.dndlh b')[2].remove();
        if(error==='example')document.querySelector('.drop.example').textContent='park';
        if(error==='bank')document.querySelector('.wordpoolWrapper [draggable=true]').remove();
      },error);await solve();assert.equal(await p.evaluate(()=>ops),0,error);
    }
  }else if(topics)for(const error of ['duplicate','missing','example','bank']){
    await open();await p.evaluate(error=>{
      if(error==='duplicate')document.querySelectorAll('.dndlh b')[2].textContent='2';
      if(error==='missing')document.querySelectorAll('.dndlh b')[2].remove();
      if(error==='example')document.querySelector('.drop.example').textContent='different lifestyle';
      if(error==='bank')document.querySelector('.wordpoolWrapper [draggable=true]').remove();
    },error);await solve();assert.equal(await p.evaluate(()=>ops),0,error);
  }
  const stored=await worker.evaluate(()=>chrome.storage.local.get('melAnswerDataV11'));assert.deepEqual(stored.melAnswerDataV11.lessons.find(l=>l.id===id),lesson);
  console.log(`PASS ${section} Ex${exercise}: unseen activity, ${answers.length-1} drops, example, partial fill, rerun, individual question, conflicting header refused`);
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-outdoors-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
