// Screenshot labels reconstructed as native checkboxes; no live Pearson session.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.MEL_TEST_EXTENSION?path.resolve(process.env.MEL_TEST_EXTENSION):path.resolve(__dirname,'..'),seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8'));
const id='ta2-u9-x-exx-d',lesson=seed.lessons.find(l=>l.id===id),c=vm.createContext({});
for(const f of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',f+'.js'),'utf8'),c);
const labels=["'It's a good way to relax.'","'The food tastes better when you grow it yourself.'","'It's cheaper than buying food in the supermarket.'","'It's a good way to earn some extra money.'"];
const fields=labels.map((text,i)=>({ref:String(i),kind:'checkbox',options:[{text,value:'on'}]}));
const planned=c.MEL.nativePlan(lesson,fields);
assert.equal(planned.complete,true);assert.deepEqual(Array.from(planned.actions,a=>a.checked),[true,true,false,true]);
assert.equal(c.MEL.nativePlan(lesson,fields.slice(0,3)).actions.length,0);
assert.equal(c.MEL.nativePlan(lesson,[...fields,{...fields[0],ref:'duplicate'}]).actions.length,0);
assert.equal(c.MEL.nativePlan(lesson,fields.map(f=>({...f,kind:'radio'}))).actions.length,0);
assert.equal(c.MEL.nativePlan(lesson,fields,'3').actions[0].checked,false);
const html=`<!doctype html><meta charset="utf-8"><h2>9.1 | Reading</h2><h3>Exercise 5</h3><p>Look at the reasons for growing your own vegetables. Then read the text. Which reasons are mentioned?</p><div>[Reading article image]</div><div class="question">${labels.map((s,i)=>`<input type="checkbox" data-test="${i}" ${i===2?'checked':''}><span>${s}</span><br>`).join('')}</div><label><input type="checkbox" id="unrelated" checked>Unrelated choice</label><button>Save</button><button>Submit</button><script>window.ops=0;window.saved=0;document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);document.addEventListener('change',()=>ops++);</script>`;
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-checkbox-states-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});let app;
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();
  async function open(){await p.goto('https://myenglishlab.pearson-intl.com/activities/unseen-checkbox-states/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);}
  const solve=(onlyN='')=>app.evaluate(({id,onlyN})=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id,onlyN}),{id,onlyN});
  await open();let r=await solve();assert.equal(r.done,4,JSON.stringify(r));assert(!r.error);assert.deepEqual(await p.locator('[data-test]').evaluateAll(els=>els.map(el=>el.checked)),[true,true,false,true]);assert.equal(await p.locator('#unrelated').isChecked(),true);assert.equal(await p.evaluate(()=>saved),0);
  const ops=await p.evaluate(()=>ops);await solve();assert.equal(await p.evaluate(()=>ops),ops);
  await open();r=await solve('3');assert.equal(r.done,1);assert.deepEqual(await p.locator('[data-test]').evaluateAll(els=>els.map(el=>el.checked)),[false,false,false,false]);
  await open();await p.locator('.question').evaluate(el=>{for(const input of [...el.querySelectorAll('input')].reverse()){const text=input.nextElementSibling,br=text.nextElementSibling;el.append(input,text,br);}});r=await solve();assert.equal(r.done,4);assert.equal(await p.locator('[data-test="2"]').isChecked(),false);assert.equal(await p.locator('[data-test="0"]').isChecked(),true);
  for(const change of ['missing','duplicate','ignored']){
   await open();await p.evaluate(change=>{const q=document.querySelector('.question');if(change==='missing')q.querySelector('input').remove();if(change==='duplicate')q.after(q.cloneNode(true));if(change==='ignored')document.querySelector('[data-test="0"]').onclick=e=>e.preventDefault();},change);
   r=await solve();assert.equal(r.done||0,0,JSON.stringify(r));assert.equal(await p.locator('[data-test="2"]').first().isChecked(),true);
  }
  await p.locator('h3').evaluate(el=>el.textContent='Exercise 6');assert.equal((await solve()).ok,false);
  assert.deepEqual((await worker.evaluate(()=>chrome.storage.local.get('melAnswerDataV11'))).melAnswerDataV11.lessons.find(l=>l.id===id),lesson);
  console.log('PASS selected/not selected map to exact checkbox labels; checks 1/2/4, unchecks 3, unrelated preserved, onlyN, reordered options, idempotence, missing/duplicate/ignored controls refused; no Save/Submit or stored source changes');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-checkbox-states-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
