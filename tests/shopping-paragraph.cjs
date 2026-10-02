// Screenshot paragraph, native fields and handler simulated in an MV3 browser test.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=path.resolve(__dirname,'..'),seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8'));
const id='ta2-u8-x-exx-n',lesson=seed.lessons.find(l=>l.id===id),c=vm.createContext({});
for(const f of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',f+'.js'),'utf8'),c);
const header={origin:'https://myenglishlab.pearson-intl.com',section:'8.3',skill:'function',exercise:'3',activityId:'2520704313'};
assert.equal(c.MEL.match(seed.lessons,[header]).lesson.id,id);assert.equal(c.MEL.match(seed.lessons,[{...header,activityId:''}]).lesson.id,id);
for(const change of [{section:'8.2'},{exercise:'2'},{skill:'grammar'}])assert.notEqual(c.MEL.match(seed.lessons,[{...header,...change}])?.lesson.id,id);
const enriched=c.MEL.enrichCatalog([lesson])[0];assert.equal(enriched.skill,'vocabulary');assert.equal(c.MEL.headerSkill(enriched),'function');assert.deepEqual(enriched.items,lesson.items);
const input=n=>`<input type="text" data-test="${n}">`;
const html=`<!doctype html><meta charset="utf-8"><h2>8.3 | Function: buying things</h2><h3>Exercise 3</h3><p>Complete the text with one word in each gap.</p><style>.itemContent{width:560px;line-height:2}input{width:65px}</style><div class="itemContent">When I started in 1968, everything was different. Most people paid by <input type="text" readonly value="cash"> because credit cards weren't very common. Now you have to ask them to enter their ${input(1)} or ${input(2)} their name. Shops were much smaller in those days too. If a customer was looking for something in ${input(3)}, like a dress in a special colour, or if the shoes didn't ${input(4)} and they needed a smaller ${input(5)}, we found it for them. And you knew most of your customers. These days, the first thing you say is '${input(6)} I help you?' In those days it was, 'Hello, John. How are you?'</div><button>Save</button><button>Submit</button><script>window.model={};window.saved=0;document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);document.querySelectorAll('[data-test]').forEach(el=>el.onchange=()=>model[el.dataset.test]=el.value);</script>`;
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-shopping-paragraph-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});let app;
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();
  async function open(){await p.goto(header.origin+'/activities/unseen-shopping-paragraph/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);}
  const solve=(onlyN='')=>app.evaluate(({id,onlyN})=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id,onlyN}),{id,onlyN});
  await open();let r=await solve();assert.equal(r.done,6,JSON.stringify(r));assert(!r.error);assert.equal(r.unresolved.length,0);assert.deepEqual(await p.evaluate(()=>model),{'1':'PIN','2':'sign','3':'particular','4':'fit','5':'size','6':'Can'});assert.equal(await p.locator('[readonly]').inputValue(),'cash');assert.equal(await p.evaluate(()=>saved),0);
  await open();r=await solve('2');assert.equal(r.done,1,JSON.stringify(r));assert.deepEqual(await p.evaluate(()=>model),{'2':'sign'});
  await open();await p.locator('.itemContent').evaluate(el=>el.after(el.cloneNode(true)));await solve();assert.deepEqual(await p.locator('[data-test]').evaluateAll(els=>els.map(el=>el.value)),Array(12).fill(''));
  await p.locator('h3').evaluate(el=>el.textContent='Exercise 4');assert.equal((await solve()).ok,false);
  const stored=await worker.evaluate(()=>chrome.storage.local.get('melAnswerDataV11'));assert.equal(stored.melAnswerDataV11.lessons.find(l=>l.id===id).section,'');assert.equal(stored.melAnswerDataV11.lessons.find(l=>l.id===id).skill,'vocabulary');
  console.log('PASS Function header with preserved vocabulary skill, six adjacent paragraph gaps including short or/sign context, PIN/Can case, cash example, onlyN, no Save/Submit/storage mutation and changed exercise refused');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-shopping-paragraph-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
