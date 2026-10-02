// Synthetic Pearson response-series fixture; no external diagnostic file needed.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=path.resolve(__dirname,'..'),seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8'));
const id='ta2-u8-x-exx-p',lesson=seed.lessons.find(l=>l.id===id),c=vm.createContext({});
for(const file of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',file+'.js'),'utf8'),c);
const page={section:'8.3',exercise:'5A',skill:'listening',origin:'https://myenglishlab.pearson-intl.com',activityId:'2520707414'};
assert.equal(c.MEL.match(seed.lessons,[page]).lesson.id,id);assert.equal(c.MEL.match(seed.lessons,[{...page,activityId:''}]).lesson.id,id);
for(const change of [{section:'8.2'},{exercise:'5B'},{skill:'grammar'}])assert.notEqual(c.MEL.match(seed.lessons,[{...page,...change}])?.lesson.id,id);
const enriched=c.MEL.enrichCatalog([lesson])[0];assert.deepEqual(enriched.items,lesson.items);assert.equal(lesson.exercise,'');assert.equal(c.MEL.match([enriched,{...enriched,id:'ambiguous'}],[page]),null);
const edited={...lesson,exercise:'9'};assert.equal(c.MEL.enrichCatalog([edited])[0].section,'');assert.equal(c.MEL.match([edited],[page]),null);
const altered={...lesson,items:lesson.items.map((i,n)=>n===1?{...i,answer:['Conversation 9']}:i)};assert.equal(c.MEL.enrichCatalog([altered])[0].pictureLayout,undefined);
console.log('PASS 8.3 Listening Ex5A recognized by ID or header, conflicts and duplicates refused, imported edits and seed preserved');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
function fixture(opts={}){return `<!doctype html><meta charset="utf-8"><table><tr><td>8.3</td><td>Listening</td></tr></table><h2>Exercise 5A</h2><p>Listen and match the conversations with the pictures.</p>
 <style>.wordpoolWrapper{padding:10px}.drag{display:inline-block;padding:5px;border:1px solid #aaa}.droppableWrapper{display:grid;grid-template-columns:repeat(2,200px);gap:20px}.art{height:60px;background:#ddd}.drop{display:inline-block;min-width:110px;min-height:24px;border:1px solid #abc}</style>
 <div class="wordpoolWrapper" id="wordpoolWrapperi_1" role="listbox">${[3,2,1,0].map((index,n)=>{const item=lesson.items[index];return `<div class="drag ${item.isExample?'example disabled':''}" data-id="i_1--drag_and_drop--${n+51}" ${item.isExample?'aria-disabled="true"':'draggable="true" role="option" tabindex="0"'}>${esc(item.answer[0])}</div>`;}).join('')}</div>
 <div class="droppableWrapper">${[2,3,0,1].map((index,i)=>{const item=lesson.items[index];return `<div class="blockElement"><div class="art" aria-hidden="true"></div><div class="drop ${item.isExample?'example':''}" id="i_1RESPONSE_${i+1}" ${item.isExample?'':'role="region" aria-label="Drop items here"'}>${item.isExample?`<div class="drag example disabled">${esc(item.answer[0])}</div>`:''}</div></div>`;}).join('')}</div><p></p><button id="submit">Submit</button>
 <script>const opts=${JSON.stringify(opts)};window.ops=0;window.submits=0;window.model={};let selected=null;
 function accept(t,s){if(!t||!s||opts.ignore)return;t.replaceChildren(s.cloneNode(true));model[t.id]=s.textContent;ops++;if(opts.rerender)t.replaceWith(t.cloneNode(true));}
 document.addEventListener('dragstart',e=>{if(e.target.matches('[draggable=true]'))e.dataTransfer.setData('token',e.target.dataset.id);});document.addEventListener('dragover',e=>e.preventDefault());document.addEventListener('drop',e=>{e.preventDefault();if(opts.keyboard)return;accept(e.target.closest('.drop'),[...document.querySelectorAll('.wordpoolWrapper .drag')].find(s=>s.dataset.id===e.dataTransfer.getData('token')));});
 document.addEventListener('keydown',e=>{if(!opts.keyboard||e.key!==' ')return;if(e.target.matches('.wordpoolWrapper [role=option]'))selected=e.target;else if(e.target.matches('.drop')){accept(e.target,selected);selected=null;}});
 document.querySelector('#submit').onclick=()=>submits++;</script>`;}
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-pictures-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});let html,app;
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();
  async function open(opts={}){html=fixture(opts);await p.goto(page.origin+'/activities/'+page.activityId+'/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);}
  const solve=()=>app.evaluate(id=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id}),id);
  await open();assert.match(await app.locator('#lesson h2').innerText(),/8.3.*Ex 5A.*Listening/);let r=await solve();assert.equal(r.done,3,JSON.stringify(r));assert(!r.error);
  const expected=['Conversation 3','Conversation 4','Conversation 1','Conversation 2'];for(let i=0;i<4;i++)assert.equal(await p.locator('#i_1RESPONSE_'+(i+1)).innerText(),expected[i]);
  assert.equal(await p.evaluate(()=>submits),0);r=await solve();assert.equal(r.done,0);assert.equal(r.skipped,3);assert.equal(await p.evaluate(()=>ops),3);
  console.log('PASS MV3 cached library: correct top left/right and bottom right, fixed bottom left example, no Submit, idempotent');
  await open({rerender:true});r=await solve();assert.equal(r.done,3);for(let i=0;i<4;i++)assert.equal(await p.locator('#i_1RESPONSE_'+(i+1)).innerText(),expected[i]);
  await open({keyboard:true});r=await solve();assert.equal(r.done,3,JSON.stringify(r));assert.equal(await p.locator('.drop[tabindex]').count(),0);
  console.log('PASS verified 2x2 layout, rerendered targets, shuffled token IDs, keyboard fallback with bottom-left example');
  for(const variant of ['wrong-example','missing-target','missing-token','duplicate-target','wrong-bank','wrong-layout']){
   await open();await p.evaluate(variant=>{if(variant==='wrong-example')document.querySelector('.drop.example').textContent='Conversation 3';if(variant==='missing-target')document.getElementById('i_1RESPONSE_4').remove();if(variant==='missing-token')document.querySelector('.wordpoolWrapper [draggable=true]').remove();if(variant==='duplicate-target')document.getElementById('i_1RESPONSE_4').id='i_1RESPONSE_3';if(variant==='wrong-layout')document.querySelector('.droppableWrapper').style.gridTemplateColumns='repeat(4,120px)';if(variant==='wrong-bank')document.querySelector('.wordpoolWrapper').id='wrong';},variant);r=await solve();assert.equal(await p.evaluate(()=>ops),0,variant);assert(!r.fallback);
  }
  await open({ignore:true});r=await solve();assert.equal(r.done,0);assert(r.error);
  console.log('PASS mismatched examples, incomplete/duplicate targets, missing tokens, unrelated bank and ignored events do not report success');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-pictures-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
