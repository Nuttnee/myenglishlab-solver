// Widget classes/roles and labels from sanitized diagnostic; HTML5 handler simulated.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.MEL_TEST_EXTENSION?path.resolve(process.env.MEL_TEST_EXTENSION):path.resolve(__dirname,'..');
const seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8')),id='ta2-u5-5.2-exx-sequencers-stories';
const observed=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/story-sequencers.json'),'utf8'));
const [bank,layout]=observed;
const element=(node,body='')=>`<${node.tag} class="${node.cls}" id="${node.id}" ${Object.entries(node.attrs).map(([key,value])=>`${key}="${value}"`).join(' ')}>${body}</${node.tag}>`;
const expected=["We had a great night out.","First, we met in a bar in town.","Then we went out for a pizza.","After the meal, we went dancing.","The holiday was a disaster.","First, the flight was cancelled.","We waited, and after a while we had to fly to a different airport.","Then, our taxi broke down on the way to the hotel.","Finally, when we arrived, the hotel didn't have our reservation."];
function fixture(){
 const story=layout.children.filter(n=>n.parent==='dndlh').map(n=>n.tag==='BR'?'<br>':element(n,n.cls==='drop example'?element(layout.children.find(c=>c.parent==='drop example'&&c.text===n.text),n.text):n.text)).join('');
 return `<!doctype html><h2>5.2 | Writing: using sequencers</h2><h3>Exercise 5A</h3><p>Look at the pictures of two stories. Put the sentences in the correct order to tell the stories.</p><style>.drop,.drag{display:inline-block;border:1px solid;padding:2px;min-width:85px;min-height:15px}</style><div class="wordpoolWrapper ui-draggable" id="${bank.id}">${bank.children.map(n=>element(n,n.text)).join('')}</div><div class="droppableWrapper"><div class="dndlh">${story}</div></div><button>Save</button><button>Submit</button><script>window.moves=[];window.saves=0;document.querySelectorAll('button').forEach(b=>b.onclick=()=>saves++);document.ondragstart=e=>e.dataTransfer.setData('token',e.target.dataset.id);document.ondragover=e=>e.preventDefault();document.ondrop=e=>{e.preventDefault();const t=e.target.closest('.drop:not(.example)'),s=[...document.querySelectorAll('.wordpoolWrapper .drag')].find(n=>n.dataset.id===e.dataTransfer.getData('token'));if(t&&s){moves.push(t.id);t.append(s);}};</script>`;
}
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-story-sequencers-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});let html,app;
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();
  const open=async(mode='normal')=>{html=fixture(mode);await p.goto('https://myenglishlab.pearson-intl.com/activities/unseen-category-boxes/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);};
  const solve=onlyN=>app.evaluate(({id,onlyN})=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id,onlyN}),{id,onlyN});
  await open();let r=await solve('2');assert.equal(r.done,4,JSON.stringify(r));assert.deepEqual(await p.evaluate(()=>moves),[6,7,8,9].map(i=>'i_1RESPONSE_'+i));
  r=await solve();assert.equal(r.done,3,JSON.stringify(r));assert.deepEqual(await p.locator('.drop').allTextContents(),expected);
  r=await solve();assert.equal(r.done,0);assert.equal(r.skipped,7);assert.equal(await p.evaluate(()=>saves),0);
  for(const variant of ['heading','opening','gap','bank','duplicate']){
   await open();await p.evaluate(v=>{
    if(v==='heading')document.querySelector('b').textContent='Story 2';
    if(v==='opening')document.querySelector('.drop.example .drag').textContent='Different opening';
    if(v==='gap')document.querySelectorAll('.drop')[2].remove();
    if(v==='bank')document.querySelector('.wordpoolWrapper .drag').remove();
    if(v==='duplicate')document.querySelectorAll('.drop')[2].id='i_1RESPONSE_2';
   },variant);r=await solve();assert.equal(r.done||0,0,variant);assert.equal(await p.evaluate(()=>moves.length),0);
  }
  console.log('PASS observed two-story widget: four then three verified drops; fixed openings, shuffled bank, idempotence, invalid group/opening/slot/bank/ID refusal, no Save or Submit');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-story-sequencers-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
