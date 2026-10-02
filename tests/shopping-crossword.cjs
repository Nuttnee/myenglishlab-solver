// Screenshot layout with simulated Pearson crossword classes and handlers.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=path.resolve(__dirname,'..'),seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8'));
const id='ta2-u8-x-exx-l',lesson=seed.lessons.find(l=>l.id===id),c=vm.createContext({});
for(const f of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',f+'.js'),'utf8'),c);
const header={origin:'https://myenglishlab.pearson-intl.com',section:'8.3',skill:'vocabulary',exercise:'1',activityId:'2520702898'};
assert.equal(c.MEL.match(seed.lessons,[header]).lesson.id,id);assert.equal(c.MEL.match(seed.lessons,[{...header,activityId:''}]).lesson.id,id);
for(const change of [{section:'8.2'},{exercise:'2'},{skill:'grammar'}])assert.notEqual(c.MEL.match(seed.lessons,[{...header,...change}])?.lesson.id,id);
assert.deepEqual(c.MEL.enrichCatalog([lesson])[0].items,lesson.items);assert.equal(lesson.section,'');
const html=`<!doctype html><meta charset="utf-8"><h2>8.3 | Vocabulary: shopping</h2><h3>Exercise 1</h3><p>Read the clues and complete the puzzle.</p><style>.crossword{position:relative;width:400px;height:220px}input.cw{position:absolute;width:22px;height:22px;box-sizing:border-box;padding:0;text-align:center}</style><div class="crossword">${lesson.items.map((row,i)=>[...row.answer[0]].map((letter,j)=>`<input type="text" class="cw response-RESPONSE_${row.n}" maxlength="1" data-letter="${j}" style="left:${([2,1,2,2,0,0][i]+j)*24}px;top:${i*24}px" ${row.isExample?`readonly value="${letter}"`:''}>`).reverse().join('')).join('')}</div><p>Across: a department store; product name; shops sell more cheaply than usual; how much you pay; opposite of cheap; buy and sell outside.</p><button>Save</button><button>Submit</button><script>window.ops=0;window.saved=0;window.model={};document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);document.querySelectorAll('input').forEach(el=>el.addEventListener('keyup',()=>{ops++;model[el.className+':'+el.dataset.letter]=el.value;}));</script>`;
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-shopping-crossword-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});let app;
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();
  async function open(){await p.goto(header.origin+'/activities/unseen-shopping/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);}
  const solve=(onlyN='')=>app.evaluate(({id,onlyN})=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id,onlyN}),{id,onlyN});
  await open();assert.equal(await app.getByRole('button',{name:'Tự điền ô chữ',exact:true}).count(),1);let r=await solve();assert.equal(r.done,5,JSON.stringify(r));assert.equal(r.writtenCells,29);assert(!r.error);
  for(const row of lesson.items)assert.equal(await p.locator('.response-RESPONSE_'+row.n).evaluateAll(els=>els.sort((a,b)=>a.getBoundingClientRect().left-b.getBoundingClientRect().left).map(el=>el.value).join('')),row.answer[0]);
  assert.equal(await p.evaluate(()=>ops),29);assert.equal(await p.evaluate(()=>Object.keys(model).length),29);assert.equal(await p.evaluate(()=>saved),0);r=await solve();assert.equal(r.skipped,5);assert.equal(r.writtenCells,0);assert.equal(await p.evaluate(()=>ops),29);
  console.log('PASS all-across grid: reversed DOM cell order, five words/29 letters, STORE preserved, keyup model, idempotence, no Save/Submit');
  await open();r=await solve('3');assert.equal(r.done,1);assert.equal(r.writtenCells,4);assert.equal(await p.locator('.response-RESPONSE_2').first().inputValue(),'');
  await open();await p.locator('.response-RESPONSE_2').first().evaluate(el=>el.remove());r=await solve();assert.equal(r.done,0);assert(r.error);assert.equal(await p.evaluate(()=>ops),0);
  await open();await p.locator('.response-RESPONSE_1').first().evaluate(el=>el.value='X');r=await solve();assert.equal(r.done,0);assert(r.error);assert.equal(await p.evaluate(()=>ops),0);
  await open();await p.locator('h3').evaluate(el=>el.textContent='Exercise 2');r=await solve();assert.equal(r.ok,false);
  const stored=await worker.evaluate(()=>chrome.storage.local.get('melAnswerDataV11'));assert.equal(stored.melAnswerDataV11.lessons.find(l=>l.id===id).section,'');
  console.log('PASS verified identity without saved activity, single row, wrong length/fixed clue and changed exercise refused, stored seed unchanged');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-shopping-crossword-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
