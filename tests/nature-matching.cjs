// Screenshot text and layout; supported matching widget and SVG handler reconstructed.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.MEL_TEST_EXTENSION?path.resolve(process.env.MEL_TEST_EXTENSION):path.resolve(__dirname,'..');
const seed=JSON.parse(fs.readFileSync(path.join(base,'data/seed.json'),'utf8')),id='ta2-u9-x-exx-video-vocab-matching',lesson=seed.lessons.find(l=>l.id===id),c=vm.createContext({});
for(const file of ['rules','catalog','data'])vm.runInContext(fs.readFileSync(path.join(base,'lib',file+'.js'),'utf8'),c);
const left=['living beings','graceful','treated with respect','exotic','telly'];
const right=['strange or unusual, often from a foreign country','things which are living/alive','to behave in a respectful way to something/someone','something/someone that moves beautifully','television'];
const expected=[[0,1],[1,3],[2,2],[3,0],[4,4]];
const header={origin:'https://myenglishlab.pearson-intl.com',exercise:'4',questionText:[...left,...right].join(' '),activityId:'unseen-nature-matching'};
assert.equal(c.MEL.match(seed.lessons,[header]).lesson.id,id);
for(const questionText of [left.join(' '),right.join(' '),[...left.slice(1),...right.slice(0,1),...right.slice(2)].join(' ')])assert.notEqual(c.MEL.match(seed.lessons,[{...header,questionText}])?.lesson.id,id);
assert.notEqual(c.MEL.match(seed.lessons,[{...header,exercise:'2'}])?.lesson.id,id);
assert.equal(c.MEL.match([lesson,{...lesson,id:'duplicate'}],[header]),null);
assert.deepEqual(c.MEL.enrichCatalog([lesson])[0].items,lesson.items);
function fixture(mode='normal'){return `<!doctype html><meta charset="utf-8"><h2>9 | Nature</h2><h3>Exercise 4</h3><p>Watch the video from 1:21–2:12 and listen for the words and phrases listed below. Then match each of them to its definition on the right.</p><style>.matching{position:relative;width:670px;height:340px}.matchingGroup{position:absolute;top:0;width:250px}.left{left:0}.right{right:0}.matchingElement{box-sizing:border-box;border:1px solid gray;height:56px;margin:7px 0;padding:4px}.matchingLines{position:absolute;inset:0;pointer-events:none}svg{width:670px;height:340px}.matched{background:#ddd}</style><div class="matching"><div class="matchingLines"><svg></svg></div>${[left,right].map((labels,s)=>`<div class="matchingGroup ${s?'right':'left'}">${labels.map((label,i)=>`<div role="button" tabindex="0" class="matchingElement ${(!s&&i===0)||(s&&i===1)?'example':''}" data-index="${i}">${label}</div>`).join('')}</div>`).join('')}</div><button>Save</button><button>Submit</button><script>
window.ops=0;window.saved=0;window.model=[];let pending=null;
const a=[...document.querySelectorAll('.left .matchingElement')],b=[...document.querySelectorAll('.right .matchingElement')];
function connect(i,j){const root=document.querySelector('.matching').getBoundingClientRect(),l=a[i].getBoundingClientRect(),r=b[j].getBoundingClientRect();const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M '+(l.right-root.left)+' '+(l.top+l.height/2-root.top)+' L '+(r.left-root.left)+' '+(r.top+r.height/2-root.top));path.setAttribute('stroke','black');document.querySelector('svg').append(path);a[i].classList.add('matched');b[j].classList.add('matched');model.push([i,j]);}
connect(0,1);
a.forEach((el,i)=>el.onclick=()=>{ops++;if(!el.classList.contains('example'))pending=i;});
b.forEach((el,j)=>el.onclick=()=>{ops++;if('${mode}'==='ignore')return;if(pending!==null&&!el.classList.contains('example')){connect(pending,j);pending=null;}});
document.querySelectorAll('button').forEach(el=>el.onclick=()=>saved++);
</script>`;}
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mel-nature-matching-'));
 const ctx=await chromium.launchPersistentContext(profile,{headless:true,...(process.env.MEL_TEST_BROWSER?{executablePath:process.env.MEL_TEST_BROWSER}:{}),args:[`--disable-extensions-except=${base}`,`--load-extension=${base}`]});let html,app;
 try{
  const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');await worker.evaluate(data=>chrome.storage.local.set({melAnswerDataV11:data}),seed);
  await ctx.route('https://**/*',r=>r.fulfill({contentType:'text/html',body:html}));const p=await ctx.newPage();
  const open=async(mode='normal')=>{html=fixture(mode);await p.goto(header.origin+'/activities/unseen-nature-matching/0/solve');await p.locator('mel-answer-root .bubble').click();await p.frameLocator('mel-answer-root iframe').locator('#lesson h2').waitFor();app=p.frames().find(f=>f.url().includes('popup.html?panel=1'));assert.equal(await app.evaluate(()=>state.lessonId),id);};
  const solve=onlyN=>app.evaluate(({id,onlyN})=>chrome.runtime.sendMessage({type:'MEL_AUTO_SOLVE',lessonId:id,onlyN}),{id,onlyN});
  await open();let r=await solve();assert.equal(r.done,4,JSON.stringify(r));assert.deepEqual(await p.evaluate(()=>model),expected);assert.equal(await p.evaluate(()=>ops),8);assert.equal(await p.evaluate(()=>saved),0);
  r=await solve();assert.equal(r.done,0);assert.equal(r.skipped,4);assert.equal(await p.evaluate(()=>ops),8);
  await open();r=await solve('4');assert.equal(r.done,1);assert.deepEqual(await p.evaluate(()=>model),[[0,1],[3,0]]);
  await open('ignore');r=await solve();assert.equal(r.done,0);assert(r.error);assert.equal(await p.evaluate(()=>ops),2);
  for(const mode of ['missing','duplicate','wrong-example','no-svg']){await open();await p.evaluate(mode=>{const r=document.querySelector('.right');if(mode==='missing')r.lastElementChild.remove();if(mode==='duplicate')r.children[4].textContent=r.children[0].textContent;if(mode==='wrong-example')document.querySelector('svg path').setAttribute('d','M 250 35 L 420 35');if(mode==='no-svg')document.querySelector('svg').remove();},mode);r=await solve();assert.equal(r.done||0,0,JSON.stringify(r));assert.equal(await p.evaluate(()=>ops),0);}
  await open();await p.locator('h3').evaluate(el=>el.textContent='Exercise 2');r=await solve();assert.equal(r.ok,false);assert.equal(await p.evaluate(()=>ops),0);
  assert.deepEqual((await worker.evaluate(()=>chrome.storage.local.get('melAnswerDataV11'))).melAnswerDataV11,seed);
  console.log('PASS complete two-column recognition with unseen ID; four SVG-confirmed pairs, example retained, repeat/onlyN; missing/duplicate labels, wrong example topology, absent SVG, ignored click and changed header refused; no Save/Submit/source mutation');
 }finally{await ctx.close();const relative=path.relative(os.tmpdir(),profile);assert(relative.startsWith('mel-nature-matching-')&&!relative.includes(path.sep));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
