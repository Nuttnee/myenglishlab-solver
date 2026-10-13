// Screenshot layout with simulated Pearson crossword classes and handlers.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.MEL_TEST_EXTENSION?path.resolve(process.env.MEL_TEST_EXTENSION):path.resolve(__dirname,'..'),seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8'));
const id='ta2-u9-x-exx-animals-crossword',lesson=seed.lessons.find(l=>l.id===id),c=vm.createContext({});
for(const f of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',f+'.js'),'utf8'),c);
const header={origin:'https://myenglishlab.pearson-intl.com',section:'9.3',skill:'vocabulary',exercise:'1',activityId:'unseen-animals'};
assert.equal(c.MEL.match(seed.lessons,[header]).lesson.id,id);assert.equal(c.MEL.match(seed.lessons,[{...header,activityId:''}]).lesson.id,id);
for(const change of [{section:'9.2'},{exercise:'2'},{skill:'grammar'}])assert.notEqual(c.MEL.match(seed.lessons,[{...header,...change}])?.lesson.id,id);
assert.deepEqual(c.MEL.enrichCatalog([lesson])[0].items,lesson.items);assert.equal(lesson.section,'');
const pictured=['CAMEL','BEAR','OSTRICH','COW','PIGEON','SPIDER','LION','EAGLE','BUTTERFLY'];
assert.deepEqual(lesson.items.map(i=>i.answer[0]),pictured);
const pictureRows=pictured.map((answer,i)=>({n:String(i+1),answer:[answer],isExample:i===0}));
const html=`<!doctype html><meta charset="utf-8"><h2>9.3 | Vocabulary: animals</h2><h3>Exercise 1</h3><p>Look at the pictures and complete the puzzle.</p><style>.crossword{position:relative;width:400px;height:270px}input.cw{position:absolute;width:22px;height:22px;box-sizing:border-box;padding:0;text-align:center}</style><div class="crossword">${pictureRows.map((row,i)=>[...row.answer[0]].map((letter,j)=>`<input type="text" class="cw response-RESPONSE_${row.n}" maxlength="1" data-letter="${j}" style="left:${([4,1,4,4,0,1,3,1,0][i]+j)*24}px;top:${i*24}px" ${row.isExample?`readonly value="${letter}"`:''}>`).reverse().join('')).join('')}</div><p>Pictures: camel, bear, ostrich, cow, pigeon, spider, lion, eagle, butterfly.</p><button>Save</button><button>Submit</button><script>window.ops=0;window.saved=0;window.model={};document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);document.querySelectorAll('input').forEach(el=>el.addEventListener('keyup',()=>{ops++;model[el.className+':'+el.dataset.letter]=el.value;}));</script>`;
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-animals-crossword-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});let app;
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();
  async function open(){await p.goto(header.origin+'/activities/unseen-animals/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);}
  const solve=(onlyN='')=>app.evaluate(({id,onlyN})=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id,onlyN}),{id,onlyN});
  await open();assert.equal(await app.getByRole('button',{name:'Tự điền ô chữ',exact:true}).count(),1);let r=await solve();assert.equal(r.done,8,JSON.stringify(r));assert.equal(r.writtenCells,44);assert(!r.error);
  for(const row of lesson.items)assert.equal(await p.locator('.response-RESPONSE_'+row.n).evaluateAll(els=>els.sort((a,b)=>a.getBoundingClientRect().left-b.getBoundingClientRect().left).map(el=>el.value).join('')),row.answer[0]);
  assert.equal(await p.evaluate(()=>ops),44);assert.equal(await p.evaluate(()=>Object.keys(model).length),44);assert.equal(await p.evaluate(()=>saved),0);r=await solve();assert.equal(r.skipped,8);assert.equal(r.writtenCells,0);assert.equal(await p.evaluate(()=>ops),44);
  console.log('PASS all-across grid: reversed DOM cell order, eight words/44 letters, CAMEL preserved, keyup model, idempotence, no Save/Submit');
  await open();r=await solve('3');assert.equal(r.done,1);assert.equal(r.writtenCells,7);assert.equal(await p.locator('.response-RESPONSE_2').first().inputValue(),'');
  await open();await p.locator('.response-RESPONSE_2').first().evaluate(el=>el.remove());r=await solve();assert.equal(r.done,0);assert(r.error);assert.equal(await p.evaluate(()=>ops),0);
  await open();await p.locator('.response-RESPONSE_1').first().evaluate(el=>el.value='X');r=await solve();assert.equal(r.done,0);assert(r.error);assert.equal(await p.evaluate(()=>ops),0);
  await open();await p.locator('h3').evaluate(el=>el.textContent='Exercise 2');r=await solve();assert.equal(r.ok,false);
  const stored=await worker.evaluate(()=>chrome.storage.local.get('melAnswerDataV11'));assert.equal(stored.melAnswerDataV11.lessons.find(l=>l.id===id).section,'');
  console.log('PASS verified identity without saved activity, single row, wrong length/fixed clue and changed exercise refused, stored seed unchanged');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-animals-crossword-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
