const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=path.resolve(__dirname,'..'),seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8'));
const id='ta2-u7-x-ex5a',source=seed.lessons.find(l=>l.id===id),c=vm.createContext({});
for(const f of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',f+'.js'),'utf8'),c);
const header={origin:'https://myenglishlab.pearson-intl.com',section:'7.1',sectionTitle:'Grammar: used to',exercise:'5A',skill:'grammar',activityId:'2520684075'};
assert.equal(c.MEL.match(seed.lessons,[header]).lesson.id,id);
assert.equal(c.MEL.match(seed.lessons,[{...header,activityId:''}]).lesson.id,id);
const enriched=c.MEL.enrichCatalog([source])[0];assert.equal(enriched.skill,'listening');assert.equal(enriched.sectionTitle,'Grammar: used to');assert(!enriched.guessed.includes('exercise'));assert.deepEqual(enriched.items,source.items);assert.equal(source.section,'');assert(source.guessed.includes('exercise'));
for(const change of [{exercise:'5B'},{section:'7.2'},{skill:'vocabulary'}])assert.notEqual(c.MEL.match(seed.lessons,[{...header,...change}])?.lesson.id,id);
const savedLink={[header.origin+':'+header.activityId]:id};assert.notEqual(c.MEL.match(seed.lessons,[{...header,exercise:'5B'}],savedLink)?.lesson.id,id);
const conflict={...source,sectionTitle:'Vocabulary: something else'};assert.equal(c.MEL.enrichCatalog([conflict])[0].section,'');assert.notEqual(c.MEL.match([conflict],[header])?.lesson.id,id);
assert.equal(c.MEL.match([enriched,{...enriched,id:'duplicate'}],[header]),null);
const generic={...source,id:'not-in-catalog',section:'8.2',exercise:'9',sectionTitle:'Grammar: another topic',skill:'listening'};
assert.equal(c.MEL.match([generic],[{...header,section:'8.2',exercise:'9',activityId:''}]).lesson.id,generic.id);
assert.equal(c.MEL.match([generic],[{...header,section:'8.2',exercise:'9',activityId:'',skill:'reading'}]),null);
console.log('PASS verified 7.1 Ex5A metadata, unchanged answers/source, header category independent of activity skill, conflicts/duplicate lessons/5B with same activity ID refused');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const body=`<!doctype html><meta charset="utf-8"><table><tr><td>7.1</td><td>Grammar: used to</td></tr></table><div>1 of 2</div><h2>Exercise 5A</h2><p>Listen and complete the sentences.</p><style>.question{margin:20px}input{width:160px}</style>${source.items.map(i=>`<div class="question"><b>${i.n}</b> ${esc(i.prompt.split('___')[0])}<input type="text" id="answer-${i.n}" ${i.isExample?'readonly value="used to be"':''}>${esc(i.prompt.split('___')[1])}</div>`).join('')}<button id="save">Save</button><button id="next">Next</button><script>window.saves=0;window.nexts=0;window.changes={};document.querySelector('#save').onclick=()=>saves++;document.querySelector('#next').onclick=()=>nexts++;document.addEventListener('change',e=>{if(e.target.matches('input'))changes[e.target.id]=e.target.value;});</script>`;
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-header-skill-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body}));const p=await ctx.newPage();await p.goto(header.origin+'/activities/'+header.activityId+'/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();const app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));
  assert.equal(await app.evaluate(()=>state.lessonId),id);assert.match(await app.locator('#lesson h2').innerText(),/7.1.*Ex 5A.*Grammar: used to/);assert(!(await app.locator('#lesson h2').innerText()).includes('?'));
  const result=await app.evaluate(id=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id}),id);assert.equal(result.done,5,JSON.stringify(result));assert(!result.error);
  for(const item of source.items)assert.equal(await p.locator('#answer-'+item.n).inputValue(),item.answer[0]);assert.equal(await p.evaluate(()=>saves+nexts),0);assert.equal(Object.keys(await p.evaluate(()=>changes)).length,5);
  assert.equal((await worker.evaluate(()=>chrome.storage.local.get('melAnswerDataV11'))).melAnswerDataV11.lessons.find(l=>l.id===id).section,'');
  // Same activity, changed exercise on the next page: do not reuse 5A's answers.
  await p.evaluate(()=>{document.querySelector('h2').textContent='Exercise 5B';document.querySelectorAll('input:not([readonly])').forEach(el=>el.value='');});
  const refused=await app.evaluate(id=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id}),id);assert.equal(refused.ok,false);assert((await p.locator('input:not([readonly])').evaluateAll(els=>els.every(el=>el.value===''))));
  console.log('PASS MV3 cached library: automatic 5A selection, five native answers and change events, fixed example, no Save/Next; same-ID 5B refuses 5A answers');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-header-skill-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
