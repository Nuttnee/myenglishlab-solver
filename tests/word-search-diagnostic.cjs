// Grid from screenshot, synthetic DOM. The supplied diagnostic had no grid nodes.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.MEL_TEST_EXTENSION?path.resolve(process.env.MEL_TEST_EXTENSION):path.resolve(__dirname,'..');
const seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8')),id='ta2-u9-9.2-ex1a';
const grid=['FEATURESC','NDERFSGCO','AIROYZAER','TSTPARKNU','UDEIFCXER','RSFCOPLRA','ADNAMEWYL','LWILDLIFE'];
const html=`<!doctype html><meta charset="utf-8"><h2>9.2 | Vocabulary: the outdoors</h2><h3>Exercise 1A</h3><nav>SECRET_NAV</nav><p>Find eight words connected with the outdoors in the word square.</p><style>.letters{display:grid;grid-template-columns:repeat(9,22px)}.cell{width:22px;height:22px}.picked{background:orange}</style><section class="widget"><div class="letters">${grid.flatMap((row,r)=>[...row].map((letter,c)=>`<span class="cell ${r===0&&c<8?'example':''}" role="button" data-row="${r}" data-col="${c}"><b>${letter}</b></span>`)).join('')}</div><div class="results">features</div><input value="SECRET_VALUE"><input type="password" value="SECRET_PASSWORD"><span hidden>SECRET_HIDDEN</span><a href="https://invalid.example/?SECRET_URL" onclick="'SECRET_HANDLER'"></a></section><footer>SECRET_FOOTER</footer><button>Save</button><button>Submit</button><script>window.ops=0;window.saved=0;document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);document.querySelectorAll('.cell').forEach(el=>el.onclick=()=>{ops++;el.classList.add('picked');});</script>`;
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-word-search-diag-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();await p.goto('https://myenglishlab.pearson-intl.com/activities/word-search-fixture/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();const app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));
  assert.equal(await app.evaluate(()=>state.lessonId),id);assert.equal(await app.getByRole('button',{name:'Chưa nhận được bảng chữ',exact:true}).isDisabled(),true);assert.equal(await app.getByRole('button',{name:'Bấm ô lần lượt',exact:true}).count(),0);
  const report=async()=>{const r=await app.evaluate(id=>chrome.runtime.sendMessage({type:'MEL_DRAG_DIAGNOSTIC',lessonId:id}),id);assert(r.ok);return r.report.frames.find(f=>f.controls?.wordSearch?.regions.length)?.controls.wordSearch;};
  let d=await report();assert(d);assert.equal(d.regions.length,1);assert.equal(d.regions[0].glyphs,72);assert.equal(d.truncated,false);
  const nodes=d.regions[0].nodes,cells=nodes.filter(n=>n.classes?.split(' ').includes('cell'));assert.equal(cells.length,72);assert.equal(cells[0].attributes['data-row'],'0');assert.equal(cells[71].attributes['data-col'],'8');assert(cells[71].rect.y>cells[0].rect.y);assert(nodes.some(n=>n.text==='features'));assert.equal(nodes.filter(n=>n.tag==='#text'&&/^[A-Z]$/.test(n.text)).length,72);
  assert(!JSON.stringify(d).includes('SECRET_'));assert.equal(await p.evaluate(()=>ops),0);
  await p.locator('.cell').nth(30).click();d=await report();assert(d.regions[0].nodes.some(n=>n.classes?.includes('picked')));assert.equal(await p.evaluate(()=>ops),1);
  const result=await app.evaluate(id=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id}),id);assert.equal(result.kind,'word-search-unresolved');assert.equal(result.fallback,false);assert.equal(await p.evaluate(()=>ops),1);assert.equal(await p.evaluate(()=>saved),0);
  await worker.evaluate(id=>chrome.storage.local.get('melAnswerDataV11').then(async s=>{s.melAnswerDataV11.lessons.find(l=>l.id===id).instruction='Other exercise';await chrome.storage.local.set(s);}),id);
  const r=await app.evaluate(id=>chrome.runtime.sendMessage({type:'MEL_DRAG_DIAGNOSTIC',lessonId:id}),id);assert(r.report.frames.every(f=>!f.controls?.wordSearch?.regions.length));
  console.log('PASS 72 nested glyphs, coordinates/attributes/result list/selected style exported through MV3; values/URLs/handlers/navigation omitted; no auto clicks or Save/Submit; non-word-search gated; UI marks unsupported adapter');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-word-search-diag-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
