const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=path.resolve(__dirname,'..'),seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8'));
const id='ta2-u7-x-exx-i233',lesson=seed.lessons.find(l=>l.id===id);
const options=i=>i.prompt.slice(1,-1).split(' / '),esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
// No catalog, activity ID or exercise number: recognition must use whole option groups.
const c=vm.createContext({});for(const f of ['rules','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',f+'.js'),'utf8'),c);
const page={choiceGroups:lesson.items.map(options),questionText:lesson.items.map(i=>options(i).join(' ')).join(' ')};
assert.equal(c.MEL.match(seed.lessons,[page])?.lesson.id,id);
assert.equal(c.MEL.match([lesson,{...lesson,id:'duplicate'}],[page]),null);
assert.equal(c.MEL.match(seed.lessons,[{choiceGroups:lesson.items.map(i=>[i.answer[0]])}]),null);
assert.equal(c.MEL.match(seed.lessons,[{choiceGroups:page.choiceGroups.slice(0,2)}]),null);
assert.equal(c.MEL.match(seed.lessons,[{choiceGroups:page.choiceGroups.map((g,i)=>[g[0],page.choiceGroups[(i+1)%6][1]])}]),null);
assert.equal(c.MEL.match(seed.lessons,[{choiceGroups:page.choiceGroups.map(g=>[...g,'Some unrelated alternative.'])}]),null);
assert.equal(c.MEL.match(seed.lessons,[{choiceGroups:page.choiceGroups.map(g=>g.map(s=>s.replace(/'/g,'’')))}])?.lesson.id,id);
const unrelated={...lesson,id:'generic-options',exercise:'',items:lesson.items.map(i=>({...i,prompt:i.prompt.replace(/She/g,'Alex').replace(/she/g,'Alex'),answer:i.answer.map(a=>a.replace(/She/g,'Alex').replace(/she/g,'Alex'))}))};
assert.equal(c.MEL.match([unrelated],[{choiceGroups:unrelated.items.map(options)}])?.lesson.id,unrelated.id);
console.log('PASS option-set recognition without catalog/ID, generic lesson, duplicate candidates and insufficient evidence refused');
function fixture(){return `<!doctype html><meta charset="utf-8"><table><tr><td>7</td><td>Changes</td></tr></table><h3>Exercise 3</h3><p>Look at the people below and read the sentences about them. Then watch the video and select the correct sentence for each person.</p>
 <style>.question{margin:20px}label{display:block}</style>${lesson.items.map(i=>`<div class="question ${i.isExample?'example':''}" data-n="${i.n}">${i.isExample?'Example: ':''}<b>${i.n}</b>${options(i).map((s,j)=>`<label><input type="radio" name="q${i.n}" value="${j+23}" ${i.isExample?'disabled '+(s===i.answer[0]?'checked':''):''}>${esc(s)}</label>`).join('')}</div>`).join('')}<button id="save">Save</button><button id="submit">Submit</button><script>window.saves=0;window.submits=0;window.changes=0;document.querySelector('#save').onclick=()=>saves++;document.querySelector('#submit').onclick=()=>submits++;document.addEventListener('change',()=>changes++);</script>`;}
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-video-choices-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:fixture()}));const p=await ctx.newPage();await p.goto('https://myenglishlab.pearson-intl.com/activities/unseen-video/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();const app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));
  assert.equal(await app.evaluate(()=>state.lessonId),id);assert.match(await app.locator('#lesson h2').innerText(),/Ex 3.*Changes/);
  const solve=()=>app.evaluate(id=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id}),id);
  const result=await solve();assert.equal(result.done,5,JSON.stringify(result));assert(!result.error);
  for(const i of lesson.items)assert.equal(await p.locator(`[data-n="${i.n}"] input:checked`).evaluate(el=>el.parentElement.textContent.trim()),i.answer[0]);assert.equal(await p.evaluate(()=>saves+submits),0);
  await p.locator('.question:not(.example)').evaluateAll(els=>els.forEach(el=>{el.querySelector('b').remove();el.querySelectorAll('input').forEach(x=>x.checked=false);el.prepend(el.lastElementChild);el.parentElement.prepend(el);}));
  const reordered=await solve();assert.equal(reordered.done,5,JSON.stringify(reordered));for(const i of lesson.items)assert.equal(await p.locator(`[data-n="${i.n}"] input:checked`).evaluate(el=>el.parentElement.textContent.trim()),i.answer[0]);
  console.log('PASS MV3 cached seed and unseen activity: recognized six option groups, five radio answers, fixed example, no Save/Submit; reordered questions/options without numbers');
  await p.locator('h3').evaluate(el=>el.textContent='Exercise 4');const refused=await solve();assert.equal(refused.ok,false);
  console.log('PASS changed exercise refuses previous answers');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-video-choices-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
