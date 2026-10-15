// Screenshot labels; diagnostic contains no token DOM. Known multiple-word widget and handlers reconstructed conditionally.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.MEL_TEST_EXTENSION?path.resolve(process.env.MEL_TEST_EXTENSION):path.resolve(__dirname,'..');
const seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8')),id='ta2-u9-x-exx-video-animals-mentioned',lesson=seed.lessons.find(l=>l.id===id);
const labels=['sharks','cows','big cats','spiders','whales','dog','horses','monkeys','guinea pig','scorpions','birds','snakes','foxes'];
const expected=['sharks','big cats','spiders','whales','dog','horses','guinea pig','scorpions','snakes','foxes'];
const c=vm.createContext({});for(const f of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',f+'.js'),'utf8'),c);
const header={exercise:'2',origin:'https://myenglishlab.pearson-intl.com'};
assert.deepEqual(c.MEL.enrichCatalog([lesson])[0].items,lesson.items);
const contentPage={...header,activityId:'unseen',questionText:['wildlife',...labels].join(' ')};
assert.equal(c.MEL.match(seed.lessons,[contentPage]).lesson.id,id);
for(const questionText of [labels.join(' '),['wildlife',...labels.slice(0,-1)].join(' '),contentPage.questionText.replace('sharks','cows'),labels.map(x=>'We have '+x+' today.').join(' ')])assert.notEqual(c.MEL.match(seed.lessons,[{...contentPage,questionText}])?.lesson.id,id);
assert.notEqual(c.MEL.match(seed.lessons,[{...contentPage,exercise:'5'}])?.lesson.id,id);
assert.equal(c.MEL.match([lesson,{...lesson,id:'duplicate-list'}],[contentPage]),null);
for(const mutate of [l=>l.items[1].answer[0]+=' | dragon',l=>l.items[1].answer[0]+=' | sharks',l=>l.items[1].prompt+=', sharks',l=>l.items[0].answer=['example mismatch'],l=>l.items[1].prompt=l.items[1].prompt.replace('Select the words','Look at animals')]){
 const altered=JSON.parse(JSON.stringify(lesson));mutate(altered);assert.equal(c.MELRules.selectionList(altered),null);
}

function fixture(mode='normal'){return `<!doctype html><meta charset="utf-8"><h2>9 | Nature</h2><h3>Exercise 2</h3><p>Watch the video from 1:21–3:10 and select the animal words you hear. There are three extra words.</p><div class="itemContent"><span class="example">wildlife</span> / <span class="underlineGroup multiple">${labels.map(x=>`<span class="underlineElement" role="button" aria-pressed="false">${x}</span>`).join(' ')}</span></div><button>Save</button><button>Submit</button><script>window.ops=0;window.saved=0;window.model=[];document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);document.querySelectorAll('[aria-pressed]').forEach(el=>el.onclick=()=>{ops++;if('${mode}'==='ignore')return;if('${mode}'==='single')el.parentElement.querySelectorAll('[aria-pressed]').forEach(x=>x.setAttribute('aria-pressed','false'));el.setAttribute('aria-pressed',el.getAttribute('aria-pressed')==='true'?'false':'true');if('${mode}'==='navigate')document.querySelector('h3').textContent='Exercise 5';model=[...document.querySelectorAll('[aria-pressed=true]')].map(x=>x.textContent);});</script>`;}
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-nature-list-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});let html,app;
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();
  async function open(mode='normal',activity='unseen-nature-word-list'){html=fixture(mode);if(mode==='plain')html=html.replace(/role="button" aria-pressed="false"/g,'');await p.goto(header.origin+'/activities/'+activity+'/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);}
  const solve=(onlyN='')=>app.evaluate(({id,onlyN})=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id,onlyN}),{id,onlyN});
  await open();let r=await solve();assert.equal(r.done,10,JSON.stringify(r));assert.equal(r.skipped,3);assert(!r.error);assert.deepEqual(await p.evaluate(()=>model),expected);assert.equal(await p.locator('.example').textContent(),'wildlife');assert.equal(await p.evaluate(()=>saved),0);
  r=await solve();assert.equal(r.done,0);assert.equal(r.skipped,13);assert.equal(await p.evaluate(()=>ops),10);
  await open('normal','another-unseen-id');r=await solve();assert.equal(r.done,10,JSON.stringify(r));
  await open('plain');r=await solve();assert.equal(r.done||0,0);assert.equal(await p.evaluate(()=>ops),0);
  const report=await app.evaluate(id=>chrome.runtime.sendMessage({type:'MEL_DRAG_DIAGNOSTIC',lessonId:id}),id);assert(report.ok);const widgets=report.report.frames.find(f=>f.controls?.questionWidgets?.regions.length)?.controls.questionWidgets;assert(widgets);assert(widgets.regions.some(r=>labels.every(l=>r.context.includes(l))));assert.equal(await p.evaluate(()=>ops),0);
  await open();r=await solve('1.5');assert.equal(r.done,1);assert.deepEqual(await p.evaluate(()=>model),['dog']);
  await open();r=await solve('unknown');assert.equal(r.done,0);assert.equal(r.skipped,0);assert.equal(await p.evaluate(()=>ops),0);
  for(const mode of ['ignore','single','navigate']){await open(mode);r=await solve();assert(r.error,mode);assert((await p.evaluate(()=>ops))<=2);}
  for(const change of ['extra-selection','missing','duplicate','wrong-example','no-state']){
   await open();await p.evaluate(change=>{
    const group=document.querySelector('.underlineGroup');
    if(change==='extra-selection')group.children[1].setAttribute('aria-pressed','true');
    if(change==='missing')group.lastElementChild.remove();
    if(change==='duplicate'){const scope=group.closest('.itemContent');scope.after(scope.cloneNode(true));}
    if(change==='wrong-example')document.querySelector('.example').textContent='magazine';
    if(change==='no-state')group.children[0].removeAttribute('aria-pressed');
   },change);r=await solve();assert.equal(r.done||0,0,change+JSON.stringify(r));assert.equal(await p.evaluate(()=>ops),0);
  }
  assert.deepEqual((await worker.evaluate(()=>chrome.storage.local.get('melAnswerDataV11'))).melAnswerDataV11.lessons.find(l=>l.id===id),lesson);
  console.log('PASS Nature Ex2 new/unseen ID recognized by complete list, unknown controls not clicked, 10 selected / 3 unselected, wildlife example, multiword animal labels, onlyN, idempotence; missing/duplicate/mismatched labels and unknown state refused; wrong existing selection preserved, ignored/exclusive/navigation clicks stopped; no Save/Submit/source changes');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-nature-list-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
