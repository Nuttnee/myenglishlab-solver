const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=path.resolve(process.env.MEL_TEST_EXTENSION||path.join(__dirname,'..')),seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8'));
const holiday=process.argv.includes('--holiday');
const exercise=holiday?'5B':'3B',other=holiday?'5A':'3A',section=holiday?'5.2':'8.2';
const title=holiday?'Writing: using sequencers':'Writing: adding emphasis';
const prompt=holiday?'Write about a time when you went on holiday or had a good night out. Write 50–100 words. Use the sequencers below.':'Write a product description of one of these products in 50–100 words.';
const cues=holiday?'First   Then   After that / After a while   Finally':'[Product illustrations]';
const id=holiday?'ta2-u5-x-model1':'ta2-u8-x-model1',lesson=seed.lessons.find(l=>l.id===id),c=vm.createContext({});
for(const f of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',f+'.js'),'utf8'),c);
const header={origin:'https://myenglishlab.pearson-intl.com',section,skill:'writing',sectionTitle:title,exercise,activityId:holiday?'unseen-holiday':'2520699278'};
assert.equal(c.MEL.match(seed.lessons,[header]).lesson.id,id);
assert.equal(c.MEL.match(seed.lessons,[{...header,activityId:''}]).lesson.id,id);
for(const change of [{section:holiday?'5.1':'8.1'},{exercise:other},{skill:'grammar'}])assert.notEqual(c.MEL.match(seed.lessons,[{...header,...change}])?.lesson.id,id);
const enriched=c.MEL.enrichCatalog([lesson])[0];assert.deepEqual(enriched.modelAnswer,lesson.modelAnswer);assert.equal(lesson.section,'');assert.equal(enriched.sectionTitle,lesson.sectionTitle);assert.equal(c.MEL.match([enriched,{...enriched,id:'duplicate'}],[header]),null);
const count=lesson.modelAnswer.text.split(/\s+/).filter(w=>/[\p{L}\p{N}]/u.test(w)).length;assert(count>=50&&count<=100);
if(holiday)for(const cue of ['first','then','after a while','finally'])assert(lesson.modelAnswer.text.toLowerCase().includes(cue));
console.log(`PASS ${section} ${exercise} recognition and original ${count}-word model`);
const html=`<!doctype html><meta charset="utf-8"><table><tr><td>${section}</td><td>${title}</td></tr></table><h3>Exercise ${exercise}</h3><p>${prompt}</p><div style="height:100px">${cues}</div><textarea rows="8" cols="70"></textarea><button id="save">Save</button><button id="submit">Submit</button><script>window.model='';window.saved=0;document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);document.querySelector('textarea').addEventListener('change',e=>model=e.target.value);</script>`;
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
  await p.locator('h3').evaluate((el,value)=>el.textContent='Exercise '+value,other);assert.equal((await solve()).ok,false);
  console.log('PASS MV3: detect without saved activity, fill exact model through change event, no Save/Submit or storage mutation, refuse two textareas and the adjacent exercise');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-writing-advert-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
