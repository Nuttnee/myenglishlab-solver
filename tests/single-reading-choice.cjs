const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=path.resolve(__dirname,'..'),seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8'));
const id='ta2-u8-x-exx-d',lesson=seed.lessons.find(l=>l.id===id),c=vm.createContext({});
for(const f of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',f+'.js'),'utf8'),c);
const header={origin:'https://myenglishlab.pearson-intl.com',section:'8.1',skill:'reading',exercise:'6A',activityId:'2520696070'};
assert.equal(c.MEL.match(seed.lessons,[header]).lesson.id,id);
assert.equal(c.MEL.match(seed.lessons,[{...header,activityId:''}]).lesson.id,id);
for(const change of [{section:'8.2'},{exercise:'6B'},{skill:'grammar'}])assert.notEqual(c.MEL.match(seed.lessons,[{...header,...change}])?.lesson.id,id);
assert.equal(c.MEL.match(seed.lessons,[{choiceGroups:[['sports','music','food','films']],questionText:'sports music food films'}]),null,'single short option set is not sufficient identity');
const enriched=c.MEL.enrichCatalog([lesson])[0];assert.deepEqual(enriched.items,lesson.items);assert.equal(lesson.section,'');assert.equal(c.MEL.match([enriched,{...enriched,id:'duplicate'}],[header]),null);
console.log('PASS verified identity by header or activity; changed part/section/skill and duplicate refused; options alone insufficient; seed unchanged');
const html=`<!doctype html><meta charset="utf-8"><table><tr><td>8.1</td><td>Reading</td></tr></table><h3>Exercise 6A</h3><p>Read the text. Which of these industries is not mentioned?</p><div style="height:120px">[Article rendered as an image: no readable article text]</div><div class="question">${['sports','music','food','films'].map((s,i)=>`<input type="radio" name="question" value="${i+17}"><span>${s}</span><br>`).join('')}</div><button id="save">Save</button><button id="submit">Submit</button><script>window.ops=0;window.saved=0;document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);document.addEventListener('change',()=>ops++);</script>`;
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-single-reading-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();await p.goto(header.origin+'/activities/unseen-single-choice/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();const app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);
  const solve=()=>app.evaluate(id=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id}),id);
  await p.locator('input').first().check();const r=await solve();assert.equal(r.done,1,JSON.stringify(r));assert(!r.error);assert.equal(await p.locator('input:checked').evaluate(el=>el.nextElementSibling.textContent),'food');assert.equal(await p.evaluate(()=>saved),0);
  const ops=await p.evaluate(()=>ops);await solve();assert.equal(await p.evaluate(()=>ops),ops);
  const stored=await worker.evaluate(()=>chrome.storage.local.get('melAnswerDataV11'));assert.equal(stored.melAnswerDataV11.lessons.find(l=>l.id===id).section,'');
  await p.locator('h3').evaluate(el=>el.textContent='Exercise 6B');assert.equal((await solve()).ok,false);
  console.log('PASS MV3 cached library: detects 6A without readable article or activity link, selects food, replaces sports, idempotent/no Save/Submit, leaves stored seed untouched, refuses 6B');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-single-reading-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
