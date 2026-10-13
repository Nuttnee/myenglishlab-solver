// Observed DOM fixture; page click behavior below is a mock, not Pearson code.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const source=path.resolve(__dirname,'..'),base=process.env.MEL_TEST_EXTENSION?path.resolve(process.env.MEL_TEST_EXTENSION):source;
const seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8')),id='ta2-u9-9.2-ex1a';
const fixture=fs.readFileSync(path.join(__dirname,'fixtures/word-search-grid.html'),'utf8');
const html=`<!doctype html><meta charset="utf-8"><h2>9.2 | Vocabulary: the outdoors</h2><h3>Exercise 1A</h3><p>Find eight words connected with the outdoors in the word square.</p><style>.wordsearchGrid{width:270px}.wordsearchGridRow{height:30px;display:flex}.wordsearchItem{display:block;width:28px;height:28px;margin:1px}.active{background:#333;color:white}.wordsearchAnswersList{list-style:none}</style><ul>${fixture}</ul><button id="save">Save</button><button id="submit">Submit</button><script>
window.ops=[];window.saved=0;window.mode='normal';window.pending=null;
// Endpoints independently transcribed from the screenshot; index = row*9+column.
window.paths={FEATURES:[0,7],PARK:[30,33],NATURAL:[9,63],AIR:[18,20],TROPICAL:[3,66],WILDLIFE:[64,71],SCENERY:[7,61],RURAL:[26,62]};
window.addWord=value=>{const [start,end]=paths[value],dr=Math.sign(Math.floor(end/9)-Math.floor(start/9)),dc=Math.sign(end%9-start%9);let i=start;for(;;){document.querySelectorAll('.wordsearchItem')[i].classList.add('active');if(i===end)break;i+=dr*9+dc;}const li=document.createElement('li');li.append(value.toLowerCase());const b=document.createElement('button');b.textContent='Delete';li.append(b);document.querySelector('.wordsearchAnswersList').append(li);};
document.querySelectorAll('.wordsearchItem').forEach((el,index)=>el.onclick=()=>{ops.push(index);if(pending===null){pending=index;return;}const first=pending;pending=null;if(mode==='ignore')return;const entry=Object.entries(paths).find(([word,ends])=>ends[0]===first&&ends[1]===index);if(entry)addWord(mode==='wrong'?'AIR':entry[0]);});
document.getElementById('save').onclick=document.getElementById('submit').onclick=()=>saved++;
</script>`;
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-word-search-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();let app;
  const reset=async()=>{await p.goto('https://myenglishlab.pearson-intl.com/activities/word-search-test/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);};
  const solve=onlyN=>app.evaluate(({id,onlyN})=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id,onlyN}),{id,onlyN});
  await reset();assert.equal(await app.getByRole('button',{name:'Tự tìm từ cả bài',exact:true}).isEnabled(),true);
  await p.evaluate(()=>addWord('PARK'));let r=await solve();assert.equal(r.error,undefined,r.error);assert.equal(r.done,6);assert.equal(r.skipped,1);assert.equal(await p.evaluate(()=>ops.length),12);assert.equal(await p.locator('.wordsearchAnswersList li').count(),8);assert.equal(await p.evaluate(()=>saved),0);
  r=await solve();assert.equal(r.done,0);assert.equal(r.skipped,7);assert.equal(await p.evaluate(()=>ops.length),12);
  await reset();r=await solve('2');assert.equal(r.done,1);assert.deepEqual(await p.evaluate(()=>ops),[30,33]);
  for(const mode of ['ignore','wrong']){await reset();await p.evaluate(mode=>window.mode=mode,mode);r=await solve();assert(r.error);assert.equal(r.done,0);assert.equal(await p.evaluate(()=>ops.length),2);assert.equal(r.fallback,false);}
  await reset();await p.evaluate(()=>{document.querySelector('.wordsearchAnswersList').append(Object.assign(document.createElement('li'),{textContent:'UNKNOWN'}));});r=await solve();assert(r.error);assert.equal(await p.evaluate(()=>ops.length),0);
  await reset();await p.evaluate(()=>document.querySelectorAll('.wordsearchItem')[30].classList.add('active'));r=await solve();assert(r.error);assert.equal(await p.evaluate(()=>ops.length),0);
  await reset();await p.evaluate(()=>document.querySelectorAll('.wordsearchItem')[71].textContent='Z');r=await solve();assert(r.error);assert.equal(await p.evaluate(()=>ops.length),0);
  await reset();await p.evaluate(()=>{document.querySelector('.wordsearch').append(document.querySelector('.wordsearchGrid').cloneNode(true));});r=await solve();assert(r.error);assert.equal(await p.evaluate(()=>ops.length),0);
  // Ambiguous AIR also across row 2, without disturbing another answer.
  await reset();await p.evaluate(()=>['A','I','R'].forEach((v,i)=>document.querySelectorAll('.wordsearchItem')[13+i].textContent=v));r=await solve();assert(r.error);assert.equal(await p.evaluate(()=>ops.length),0);
  await reset();const running=solve();await p.waitForFunction(()=>ops.length===1);await app.evaluate(()=>chrome.runtime.sendMessage({type:'MEL_CANCEL'}));r=await running;assert(r.error);assert.equal(await p.evaluate(()=>ops.length),1);assert.equal(await p.evaluate(()=>saved),0);
  await reset();const changed=solve();await p.waitForFunction(()=>ops.length===1);await p.evaluate(()=>document.querySelectorAll('.wordsearchItem')[33].replaceWith(document.querySelectorAll('.wordsearchItem')[33].cloneNode(true)));r=await changed;assert(r.error);assert.equal(await p.evaluate(()=>ops.length),1);
  console.log('PASS observed wordsearch DOM: endpoint selection, overlaps, existing words, rerun, one word; no result/wrong result/extra word/pending state/missing word/duplicate grid/ambiguity/cancel/replaced endpoint stop; no Save/Submit');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-word-search-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
