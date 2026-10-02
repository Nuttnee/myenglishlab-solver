const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=path.resolve(__dirname,'..'),seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8'));
const id='ta2-u8-x-model1',lesson=seed.lessons.find(l=>l.id===id),c=vm.createContext({});
for(const f of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',f+'.js'),'utf8'),c);
const header={origin:'https://myenglishlab.pearson-intl.com',section:'8.2',skill:'writing',exercise:'3B',activityId:'2520699278'};
assert.equal(c.MEL.match(seed.lessons,[header]).lesson.id,id);
assert.equal(c.MEL.match(seed.lessons,[{...header,activityId:''}]).lesson.id,id);
for(const change of [{section:'8.1'},{exercise:'3A'},{skill:'grammar'}])assert.notEqual(c.MEL.match(seed.lessons,[{...header,...change}])?.lesson.id,id);
const enriched=c.MEL.enrichCatalog([lesson])[0];assert.deepEqual(enriched.modelAnswer,lesson.modelAnswer);assert.equal(lesson.section,'');assert.equal(enriched.sectionTitle,lesson.sectionTitle);assert.equal(c.MEL.match([enriched,{...enriched,id:'duplicate'}],[header]),null);
const count=lesson.modelAnswer.text.split(/\s+/).filter(w=>/[\p{L}\p{N}]/u.test(w)).length;assert(count>=50&&count<=100);
console.log(`PASS verified 3B identity separated from 3A; original camera model preserved (${count} words by whitespace, bullet markers excluded)`);
const html=`<!doctype html><meta charset="utf-8"><table><tr><td>8.2</td><td>Writing: adding emphasis</td></tr></table><h3>Exercise 3B</h3><p>Write a product description of one of these products in 50–100 words.</p><div style="height:100px">[Product illustrations]</div><textarea rows="8" cols="70"></textarea><button id="save">Save</button><button id="submit">Submit</button><script>window.model='';window.saved=0;document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);document.querySelector('textarea').addEventListener('change',e=>model=e.target.value);</script>`;
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-writing-advert-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();await p.goto(header.origin+'/activities/unseen-writing/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();const app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);
  const solve=()=>app.evaluate(id=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id}),id);
  const r=await solve();assert.equal(r.done,1,JSON.stringify(r));assert(!r.error);assert.equal(await p.locator('textarea').inputValue(),lesson.modelAnswer.text);assert.equal(await p.evaluate(()=>model),lesson.modelAnswer.text);assert.equal(await p.evaluate(()=>saved),0);
  const stored=await worker.evaluate(()=>chrome.storage.local.get('melAnswerDataV11'));assert.equal(stored.melAnswerDataV11.lessons.find(l=>l.id===id).section,'');
  await p.locator('textarea').evaluate(el=>{el.value='';el.after(el.cloneNode());});await solve();assert.deepEqual(await p.locator('textarea').evaluateAll(els=>els.map(el=>el.value)),['','']);
  await p.locator('h3').evaluate(el=>el.textContent='Exercise 3A');assert.equal((await solve()).ok,false);
  console.log('PASS MV3: detect without saved activity, fill exact model including bullets/newlines through change event, no Save/Submit or storage mutation, refuse two textareas and 3A');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-writing-advert-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
