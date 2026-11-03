// Input structure/initial values from diagnostic; change handler simulated.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.MEL_TEST_EXTENSION?path.resolve(process.env.MEL_TEST_EXTENSION):path.resolve(__dirname,'..');
const seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8')),id='ta2-u5-5.1-ex1a',lesson=seed.lessons.find(l=>l.id===id),c=vm.createContext({});
for(const file of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',file+'.js'),'utf8'),c);
const observed=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/transport-prefix-fields.json'),'utf8'));
assert.equal(c.MEL.nativePlan(lesson,observed.fields).actions.length,0);
const groups=[];for(const f of observed.fields){if(f.slot===0)groups.push([]);groups.at(-1).push(f.current);}
const expected=[['speedboat'],['ship'],['helicopter'],['motor','bike'],['coach'],['tram'],['ferry'],['moped'],['minibus'],['aeroplane'],['underground'],['lorry'],['hot','air','balloon']];
const html=`<!doctype html><meta charset="utf-8"><h2>5.1 | Vocabulary: transport</h2><h3>Exercise 1A</h3><p>Find fourteen types of transport in the word snake.</p><style>ul{display:grid;grid-template-columns:300px 300px}li{list-style:none;margin:15px}input{width:65px;margin:4px}</style><ul><li class="item example"><input readonly value="taxi"></li>${groups.map((g,i)=>`<li class="item"><div class="itemContent firstLetterFillin">${g.map((v,j)=>`<input type="text" class="normalWidth" name="response[i_${i+2}][RESPONSE_${j+1}]" data-test="${i}-${j}" value="${v}">`).join('')}</div></li>`).join('')}</ul><button>Save</button><button>Submit</button><script>window.model={};window.saved=0;document.querySelectorAll('[data-test]').forEach(el=>el.onchange=()=>model[el.dataset.test]=el.value);document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);</script>`;
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-transport-prefixes-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();let app;
  const open=async()=>{await p.goto('https://myenglishlab.pearson-intl.com/activities/unseen-transport/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);};
  const solve=onlyN=>app.evaluate(({id,onlyN})=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id,onlyN}),{id,onlyN});
  const model=Object.fromEntries(expected.flatMap((a,i)=>a.map((v,j)=>[`${i}-${j}`,v])));
  await open();let r=await solve();assert.equal(r.done,16,JSON.stringify(r));assert.deepEqual(await p.evaluate(()=>model),model);assert.equal(await p.locator('[readonly]').inputValue(),'taxi');assert.equal(await p.evaluate(()=>saved),0);
  r=await solve();assert.equal(r.done,16);assert.deepEqual(await p.evaluate(()=>model),model);
  await open();await p.locator('ul').evaluate(el=>el.prepend(el.lastElementChild));r=await solve('14');assert.equal(r.done,3);assert.deepEqual(await p.evaluate(()=>model),{'12-0':'hot','12-1':'air','12-2':'balloon'});r=await solve();assert.equal(r.done,16);assert.deepEqual(await p.evaluate(()=>model),model);
  for(const change of ['ambiguous','blank','wrong','missing','duplicate','unmarked','too-short']){
    await open();await p.evaluate(change=>{const inputs=[...document.querySelectorAll('[data-test]')];if(change==='ambiguous')inputs.find(x=>x.value==='mi').value='m';if(change==='blank')inputs[0].value='';if(change==='wrong')inputs[0].value='spaceship';if(change==='missing')inputs[0].remove();if(change==='duplicate')inputs[0].after(inputs[0].cloneNode());if(change==='unmarked')document.querySelector('.firstLetterFillin').classList.remove('firstLetterFillin');if(change==='too-short')inputs[0].maxLength=3;},change);
    r=await solve();assert.equal(r.done||0,0,change+JSON.stringify(r));assert.deepEqual(await p.evaluate(()=>model),{});
  }
  await open();await p.locator('h3').evaluate(el=>el.textContent='Exercise 1B');r=await solve();assert.equal(r.ok,false);assert.deepEqual(await p.evaluate(()=>model),{});
  assert.deepEqual((await worker.evaluate(()=>chrome.storage.local.get('melAnswerDataV11'))).melAnswerDataV11,seed);
  console.log('PASS 16 fields/13 groups by initials and group lengths, interleaved/reordered DOM, compound onlyN, partial/rerun, lowercase and taxi preserved; ambiguous/empty/wrong prefixes, missing/duplicate/unmarked fields, maxlength/header conflicts refused; no Save/Submit/source mutation');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-transport-prefixes-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
