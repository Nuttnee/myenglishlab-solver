const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=path.resolve(__dirname,'..'),seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8'));
const id='ta2-u7-x-exx-i219',lesson=seed.lessons.find(l=>l.id===id),c=vm.createContext({});
for(const f of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',f+'.js'),'utf8'),c);
const header={section:'7.1',exercise:'8',skill:'writing',origin:'https://myenglishlab.pearson-intl.com',activityId:'2520685373'};
assert.equal(c.MEL.match(seed.lessons,[header]).lesson.id,id);assert.equal(c.MEL.match(seed.lessons,[{...header,activityId:''}]).lesson.id,id);
for(const delta of [{exercise:'9'},{section:'7.2'},{skill:'grammar'}])assert.notEqual(c.MEL.match(seed.lessons,[{...header,...delta}])?.lesson.id,id);
const enriched=c.MEL.enrichCatalog([lesson])[0];assert.equal(enriched.skill,'reading');assert.deepEqual(enriched.items,lesson.items);assert.equal(lesson.section,'');assert.equal(c.MEL.match([enriched,{...enriched,id:'duplicate'}],[header]),null);
const sentences=['What exactly do you want to change in your life?','Writing down your goals is the first step towards achieving them.','Decide on some new goals to help you achieve this change and write them down.','Try not doing something for a while – like not watching television for one week.','This will give you time to try doing something different.','Do you spend a lot of your time doing the same things every day?','If you try to focus on the present, things will seem easier.',"And don’t worry about things which haven’t happened yet.","Don’t spend too much time thinking about the past and worrying about decisions you have already made."];
const expected=['1','3','2','2','3','1','3','2','1'],groups=['Set new goals','Do something different','Think about now'];
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
function control(i,type){return type==='select'?`<select id="rank-${i}"><option></option><option>3</option><option>1</option><option>2</option></select>`:`<input id="rank-${i}" type="${type}" ${type==='text'?'maxlength="1" size="1"':'min="1" max="3"'}>`;}
function fixture(type='text'){return `<!doctype html><meta charset="utf-8"><table><tr><td>7.1</td><td>Writing: paragraphs</td></tr></table><h2>Exercise 8</h2><p>Read the article and number the sentences in each paragraph in the correct order.</p><p>1 introduces the main idea</p><p>2 supports the idea</p><p>3 finishes or concludes the paragraph</p><h3>REACH FOR THE SKY!</h3><div class="example"><p><input readonly value="2" maxlength="1">Or do you dream about living the life you really want to live?</p><p><input disabled value="3" maxlength="1">Here are some tips.</p><p><span class="fixed">1</span>Do you wake up in the morning excited about what the day will bring?</p></div>
 <style>input{width:20px}p{margin:8px}.example{background:#eee}.fixed{display:inline-block;width:20px}</style>
 ${groups.map((g,n)=>`<section data-group="${n}"><h4>${g}</h4>${sentences.slice(n*3,n*3+3).map((s,j)=>`<p data-row="${n*3+j}">${control(n*3+j,type)} ${esc(s)}</p>`).join('')}</section>`).join('')}
 <button id="save">Save</button><button id="submit">Submit</button><script>window.writes={};window.saved=0;window.submitted=0;document.addEventListener('change',e=>{if(e.target.id.startsWith('rank-'))writes[e.target.id]=e.target.value;});document.querySelector('#save').onclick=()=>saved++;document.querySelector('#submit').onclick=()=>submitted++;</script>`;}
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-paragraph-ranks-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});let html,app;
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();
  async function open(type='text'){html=fixture(type);await p.goto(header.origin+'/activities/'+header.activityId+'/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);}
  const send=(type,extra={})=>app.evaluate(({type,extra})=>chrome.runtime.sendMessage({type,...extra}),{type,extra});
  const solve=(extra={})=>send('MEL_AUTO_SOLVE',{lessonId:id,...extra});
  async function verify(){for(let i=0;i<9;i++)assert.equal(await p.locator('#rank-'+i).inputValue(),expected[i]);assert.equal(await p.locator('.example input[readonly]').inputValue(),'2');assert.equal(await p.locator('.example input[disabled]').inputValue(),'3');assert.equal(await p.locator('.example .fixed').innerText(),'1');assert.equal(await p.evaluate(()=>saved+submitted),0);}
  await open();assert.equal(await app.getByRole('button',{name:'Tự điền số thứ tự',exact:true}).count(),1);
  const scan=await send('MEL_SCAN');assert.equal(scan.frames[0].fields.length,9);assert(scan.frames[0].fields.every(f=>f.kind==='text'));
  let r=await solve();assert.equal(r.kind,'native');assert.equal(r.done,9,JSON.stringify(r));assert(!r.error);await verify();assert.equal(Object.keys(await p.evaluate(()=>writes)).length,9);
  console.log('PASS actual MV3 and cached seed: Writing Ex8 recognized, nine rank inputs (not letter groups), 1/3/2;2/3/1;3/2/1, fixed examples untouched, no Save/Submit');
  await open();await p.evaluate(()=>{document.querySelectorAll('section').forEach(s=>s.append(s.querySelector('p')));const g=document.querySelector('section');g.parentElement.append(g);});r=await solve();assert.equal(r.done,9,JSON.stringify(r));await verify();
  for(const type of ['number','select']){await open(type);r=await solve();assert.equal(r.done,9,JSON.stringify(r));await verify();}
  console.log('PASS reordered sentences/groups, cropped source text and smart quotes; number inputs and dropdown variants');
  await open();r=await solve({onlyN:'Think about now-b'});assert.equal(r.done,1);assert.equal(await p.locator('#rank-7').inputValue(),'2');assert.equal(Object.keys(await p.evaluate(()=>writes)).length,1);
  await open();await p.locator('[data-row="2"]').evaluate(el=>el.after(el.cloneNode(true)));r=await solve();assert(!('rank-2' in await p.evaluate(()=>writes)));assert(r.unresolved.some(i=>i.n==='Set new goals-c'));
  await open();await p.locator('h2').evaluate(el=>el.textContent='Exercise 9');r=await solve();assert.equal(r.ok,false);assert.equal(Object.keys(await p.evaluate(()=>writes)).length,0);
  console.log('PASS per-row action; duplicate question remains unresolved; changed exercise refuses all writes');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-paragraph-ranks-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
