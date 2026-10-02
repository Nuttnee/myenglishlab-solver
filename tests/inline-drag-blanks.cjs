// Screenshot-based inline paragraphs, with simulated native HTML5 drop handlers.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=path.resolve(__dirname,'..'),seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8'));
const id='ta2-u7-x-exx-i223',lesson=seed.lessons.find(l=>l.id===id);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
function fixture(opts={}){return `<!doctype html><meta charset="utf-8"><table><tr><td>7.2</td><td>Grammar: purpose, cause and result</td></tr></table><h2>Exercise 4</h2><p>Complete the texts with to, so or because.</p>
 <style>.drag,.drop{display:inline-block;padding:5px;border:1px solid}.drop{min-width:80px;min-height:20px}li{margin:20px;max-width:580px}.wordpoolWrapper{padding:10px}</style>
 <div class="wordpoolWrapper">${[2,7,3,1,6,5,4,0].map((i,n)=>`<span class="drag" data-id="token-${n+30}" ${lesson.items[i].isExample?'aria-disabled="true"':'draggable="true"'}>${esc(lesson.items[i].answer[0])}</span>`).join('')}</div>
 <ol class="droppableWrapper">${[0,2,4,6].map(start=>`<li>${lesson.items.slice(start,start+2).map((item,j)=>esc(item.prompt).replace('___',`<span class="drop ${item.isExample?'example':''}" id="response-${start+j}">${item.isExample?esc(item.answer[0]):'DRAG ITEM HERE'}</span>`)).join(' ')}</li>`).join('')}</ol><button id="submit">Submit</button>
 <script>window.ops=0;window.submits=0;window.model={};
 document.querySelector('#submit').onclick=()=>submits++;
 document.addEventListener('dragstart',e=>{if(e.target.draggable)e.dataTransfer.setData('token',e.target.dataset.id);});
 document.addEventListener('dragover',e=>e.preventDefault());document.addEventListener('drop',e=>{e.preventDefault();if(${Boolean(opts.ignore)})return;const t=e.target.closest('.drop'),s=[...document.querySelectorAll('.wordpoolWrapper [draggable=true]')].find(s=>s.dataset.id===e.dataTransfer.getData('token'));if(t&&s){t.replaceChildren(s);model[t.id]=s.textContent;ops++;if(${Boolean(opts.rerender)})t.replaceWith(t.cloneNode(true));}});
 </script>`;}
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-inline-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});let html,app;
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();
  async function open(opts={}){html=fixture(opts);await p.goto('https://myenglishlab.pearson-intl.com/activities/2520688428/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);}
  const solve=()=>app.evaluate(id=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id}),id);
  await open();let r=await solve();assert.equal(r.done,7,JSON.stringify(r));assert(!r.error);
  for(let i=0;i<8;i++)assert.equal(await p.locator('#response-'+i).innerText(),lesson.items[i].answer[0]);
  assert.equal(await p.evaluate(()=>submits),0);r=await solve();assert.equal(r.done,0);assert.equal(r.skipped,7);assert.equal(await p.evaluate(()=>ops),7);
  assert.equal(await app.getByRole('button',{name:'Bấm ô lần lượt',exact:true}).count(),0);
  assert.equal(await app.getByRole('button',{name:'Tự kéo thả cả bài',exact:true}).count(),1);
  console.log('PASS seven case-correct tokens consumed once; repeated so, fixed because, idempotence, no Submit and correct UI');
  await open({rerender:true});await p.locator('ol').evaluate(el=>el.prepend(el.lastElementChild));r=await solve();assert.equal(r.done,7,JSON.stringify(r));
  for(let i=0;i<8;i++)assert.equal(await p.locator('#response-'+i).innerText(),lesson.items[i].answer[0]);
  console.log('PASS reordered paragraphs and replaced drop nodes, independent of question/blank numbering');
  await open();await p.locator('#response-3').evaluate(el=>el.textContent='so');r=await solve();assert.equal(r.done,6);assert.equal(await p.locator('#response-3').innerText(),'so');assert(r.remaining>0,'wrong case must remain unresolved');
  await open();await p.locator('.wordpoolWrapper [draggable=true]').evaluateAll(els=>els.filter(el=>el.textContent==='To').forEach(el=>el.remove()));r=await solve();assert.equal(r.done,6);assert.equal(await p.locator('#response-4').innerText(),'DRAG ITEM HERE','must not substitute lowercase to');
  console.log('PASS occupied wrong-case slot preserved/reported and missing uppercase token not replaced with lowercase');
  await open();await p.locator('.wordpoolWrapper').evaluate(el=>el.after(el.cloneNode(true)));r=await solve();assert.equal(await p.evaluate(()=>ops),0,'identical tokens in separate banks are ambiguous');
  await open();await p.locator('ol li').nth(1).evaluate(el=>el.after(el.cloneNode(true)));r=await solve();assert.equal(await p.evaluate(()=>model['response-2']),undefined,'duplicate question contexts must not be guessed');assert.equal(await p.evaluate(()=>model['response-3']),undefined);
  console.log('PASS duplicate banks and duplicate question contexts are not resolved by arbitrary first match');
  await open({ignore:true});r=await solve();assert.equal(r.done,0);assert(r.error);assert.equal(await p.evaluate(()=>ops),0);
  console.log('PASS ignored drop handlers do not report success');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-inline-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
