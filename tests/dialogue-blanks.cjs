const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=path.resolve(__dirname,'..'),seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8'));
const id='ta2-u7-7.3-exx-i229',lesson=seed.lessons.find(l=>l.id===id),answers=Object.fromEntries(lesson.items.map(i=>[i.n,i.answer[0]]));
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const remaining=['1.2','2.5','3.3','3.7'];
function fixture(opts={}){
 const gap=n=>`<span class="drop" id="slot-${n.replace('.','-')}">${opts.partial&&!remaining.includes(n)?esc(answers[n]):'DRAG ITEM HERE'}</span>`;
 const groups=[[
  'A: Excuse me, can you tell me where the library is?', 'B: The <span class="drop example">library</span>?', "A: Yes, that's right.",
  `B: It's next to the main ${gap('1.1')}.`,`A: ${gap('1.2')} you.`, 'B: I can take you there if you like.',`A: That's very ${gap('1.3')}.`
 ],[
  `A: Do you ${gap('2.1')} if the cafeteria is open?`,`B: ${gap('2.2')}?`,`A: Is the ${gap('2.3')} open now?`,`B: Yes. I think it ${gap('2.4')} at 8.30 a.m.`,`A: ${gap('2.5')} you.`
 ],[
  `A: Excuse me. Could you ${gap('3.1')} me?`,'B: Yes.',`A: Can you ${gap('3.2')} me where my classroom is?`,'B: Have you got your registration form?',`A: ${gap('3.3')}?`,`B: Your registration form. ${gap('3.4')} I have your registration form?`,`A: Yes, ${gap('3.5')} it is.`,`B: Your ${gap('3.6')} is room 401. It's over there, near the bookshop.`,`A: ${gap('3.7')} you.`
 ]];
 return `<!doctype html><meta charset="utf-8"><h2>7.3 | Function: finding out information</h2><h3>Exercise 2</h3><p>Complete the conversations with the words below.</p>
 <style>.drop,.drag{display:inline-block;padding:5px;border:1px solid}.drop{min-width:70px;min-height:20px}.dialogue{margin:18px}p{margin:8px}</style>
 <div class="wordpoolWrapper">${lesson.items.filter(i=>!opts.partial||remaining.includes(i.n)).reverse().map((i,n)=>`<span class="drag" draggable="true" data-id="token-${n+51}">${esc(i.answer[0])}</span>`).join('')}<span class="drag" aria-disabled="true">library</span></div>
 <div class="droppableWrapper">${groups.map((lines,i)=>`<div class="dialogue"><b>Conversation ${i+1}</b>${opts.br?'<div>'+lines.join('<br>')+'</div>':lines.map(l=>'<p>'+l+'</p>').join('')}</div>`).join('')}</div><button id="submit">Submit</button>
 <script>window.ops=0;window.submits=0;document.querySelector('#submit').onclick=()=>submits++;
 document.addEventListener('dragstart',e=>{if(e.target.draggable)e.dataTransfer.setData('token',e.target.dataset.id);});document.addEventListener('dragover',e=>e.preventDefault());document.addEventListener('drop',e=>{e.preventDefault();const t=e.target.closest('.drop'),s=[...document.querySelectorAll('.wordpoolWrapper [draggable=true]')].find(el=>el.dataset.id===e.dataTransfer.getData('token'));if(t&&s){t.replaceChildren(s);ops++;}});</script>`;
}
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-dialogue-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});let html,app;
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();
  async function open(opts={}){html=fixture(opts);await p.goto('https://myenglishlab.pearson-intl.com/activities/2520690521/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);}
  const solve=()=>app.evaluate(id=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id}),id);
  async function check(){for(const [n,a] of Object.entries(answers))assert.equal(await p.locator('#slot-'+n.replace('.','-')).innerText(),a,n);assert.equal(await p.locator('.drop.example').innerText(),'library');assert.equal(await p.evaluate(()=>submits),0);}
  await open({partial:true});let r=await solve();assert.equal(r.done,4,JSON.stringify(r));assert.equal(r.skipped,11);await check();r=await solve();assert.equal(r.done,0);assert.equal(r.skipped,15);
  console.log('PASS screenshot partial state: three Thank and one Sorry completed, eleven answers retained, library example unchanged, idempotence/no Submit');
  for(const br of [false,true]){await open({br});await p.locator('.droppableWrapper').evaluate(el=>el.prepend(el.lastElementChild));r=await solve();assert.equal(r.done,15,JSON.stringify(r));await check();}
  console.log('PASS all fifteen source answers, reordered conversations, separate P and shared BR layouts');
  const varied=JSON.parse(JSON.stringify(seed)),variants={'1.2':'Thank','2.5':'See','3.7':'Bless'};
  for(const item of varied.lessons.find(l=>l.id===id).items)if(variants[item.n])item.answer=[variants[item.n]];
  await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),varied);await open({partial:true});
  await p.locator('.wordpoolWrapper .drag[draggable=true]').evaluateAll(els=>{const tokens=els.filter(el=>el.textContent==='Thank');tokens.forEach((el,i)=>el.textContent=['Bless','See','Thank'][i]);});
  await p.locator('.droppableWrapper').evaluate(el=>el.prepend(el.lastElementChild));r=await solve();assert.equal(r.done,4,JSON.stringify(r));
  for(const [n,value] of Object.entries(variants))assert.equal(await p.locator('#slot-'+n.replace('.','-')).innerText(),value);
  await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  console.log('PASS identical short prompts with different answers remain bound to their labelled conversation after DOM reorder');
  await open({partial:true});await p.locator('.dialogue').last().evaluate(el=>el.after(el.cloneNode(true)));r=await solve();assert.equal(await p.locator('[id="slot-3-7"]').first().innerText(),'DRAG ITEM HERE');assert.equal(await p.locator('[id="slot-3-3"]').first().innerText(),'DRAG ITEM HERE');
  await open({partial:true});await p.locator('.dialogue b').evaluateAll(els=>els.forEach(el=>el.remove()));r=await solve();assert.equal(await p.locator('#slot-1-2').innerText(),'DRAG ITEM HERE');assert.equal(await p.locator('#slot-2-5').innerText(),'DRAG ITEM HERE');assert.equal(await p.locator('#slot-3-7').innerText(),'DRAG ITEM HERE');
  console.log('PASS duplicate or missing group evidence does not guess repeated short questions');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-dialogue-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
