importScripts('lib/rules.js','lib/catalog.js','lib/data.js');
const DATA = 'melAnswerDataV11', LINKS = 'melAnswerLinksV11';
let queue = Promise.resolve();
let pickerQueue = Promise.resolve();
const serial = fn => { const next = queue.then(fn,fn); queue = next.catch(() => {}); return next; };
async function loadData() {
  const stored = await chrome.storage.local.get([DATA,'melData','melStudyData']);
  if (stored[DATA]) return {...stored[DATA],lessons:MEL.enrichCatalog(stored[DATA].lessons)};
  const response = await fetch(chrome.runtime.getURL('data/seed.json'));
  if (!response.ok) throw new Error('Không đọc được kho đáp án đi kèm.');
  const seed = await response.json();
  let lessons = MEL.normalize(seed);
  const legacy = stored.melData || stored.melStudyData;
  if (legacy) { try { lessons = MEL.merge(lessons,MEL.normalize(legacy)); } catch {} }
  const data = {schema:'mel-study/v2',meta:seed.meta,lessons};
  await chrome.storage.local.set({[DATA]:data}); return {...data,lessons:MEL.enrichCatalog(data.lessons)};
}
async function currentTab(sender) {
  const tab = sender.tab?.id != null ? await chrome.tabs.get(sender.tab.id) : (await chrome.tabs.query({active:true,currentWindow:true}))[0];
  if (!tab?.id || !MEL.allowedURL(tab.url)) throw new Error('Hãy mở một bài trên MyEnglishLab / Pearson rồi thử lại.');
  return tab;
}
async function frames(tabId) {
  const list = await chrome.webNavigation.getAllFrames({tabId});
  return (list || []).filter(x => MEL.allowedURL(x.url) || (x.frameId !== 0 && /^about:(blank|srcdoc)$/.test(x.url)));
}
async function ensure(tabId) {
  const list = await frames(tabId);
  const results = await Promise.allSettled(list.map(f => chrome.scripting.executeScript({target:{tabId,frameIds:[f.frameId]},files:['lib/rules.js','lib/context.js','lib/letters.js','lib/crossword.js','lib/insert-word.js','lib/page.js','content.js']})));
  const ready = list.filter((_,i) => results[i].status === 'fulfilled');
  if (!ready.length) throw new Error('Không truy cập được nội dung bài. Tải lại trang MyEnglishLab sau khi cài extension.');
  return ready;
}
async function run(tabId,frameId,method,args = []) {
  const results = await chrome.scripting.executeScript({target:{tabId,frameIds:[frameId]},func:async (method,args) => {
    try { if (!globalThis.MELPage) throw new Error('Nội dung chưa sẵn sàng.'); return {ok:true,value:await globalThis.MELPage[method](...args)}; }
    catch (e) { return {ok:false,error:e.message}; }
  },args:[method,args]});
  const r = results[0]?.result;
  if (!r?.ok) throw new Error(r?.error || 'Khung bài đã đóng.');
  return r.value;
}
async function stopPicks(tabId) {
  await chrome.storage.session.remove([`sequence:${tabId}`,`pick:${tabId}`]);
  const list = await frames(tabId);
  await Promise.allSettled(list.map(f => run(tabId,f.frameId,'stopPick')));
}
async function dragRun(tabId,frameId,method,args=[]) {
  const result=await chrome.scripting.executeScript({target:{tabId,frameIds:[frameId]},world:'MAIN',func:async(method,args)=>{
    try {
      if(method==='cancel'){globalThis.MELConnections?.cancel();globalThis.MELOrdering?.cancel();globalThis.MELAutoDrag?.cancel();return {ok:true,value:{}};}
      const connections=Boolean(globalThis.MELConnections?.analyze(args[0]).targets);
      const ordering=args[0]?.type==='ordering' && Boolean(globalThis.MELOrdering?.analyze(args[0]).targets);
      if(method==='diagnostic')return {ok:true,value:{...await globalThis.MELAutoDrag.diagnostic(...args),ordering:globalThis.MELOrdering?.diagnostic(...args),connections:globalThis.MELConnections?.diagnostic(...args)}};
      return {ok:true,value:await (connections?globalThis.MELConnections:ordering?globalThis.MELOrdering:globalThis.MELAutoDrag)[method](...args)};
    }
    catch(error){return {ok:false,error:error.message};}
  },args:[method,args]});
  const r=result[0]?.result;if(!r?.ok)throw new Error(r?.error || 'Khung bài kéo thả đã đóng.');return r.value;
}
async function dragFrames(tabId,list) {
  const checked=await Promise.allSettled(list.map(async f=>{
    await chrome.scripting.executeScript({target:{tabId,frameIds:[f.frameId]},world:'MAIN',files:['lib/rules.js','lib/context.js','lib/drag.js','lib/ordering.js','lib/connections.js']});return f;
  }));return checked.filter(r=>r.status==='fulfilled').map(r=>r.value);
}
async function handle(msg,sender) {
  if (msg.type === 'MEL_DATA') return serial(async () => ({data:await loadData(),...(await chrome.storage.local.get(LINKS))}));
  if (msg.type === 'MEL_IMPORT') return serial(async () => {
    const lessons = MEL.normalize(msg.data); const old = await loadData();
    if (!lessons.length) throw new Error('File không có bài; kho hiện tại được giữ nguyên.');
    const data = {...old,lessons:msg.replace ? lessons : MEL.merge(old.lessons,lessons),updatedAt:new Date().toISOString()};
    // Keep one recoverable local backup for every import, including merge updates.
    await chrome.storage.local.set({melAnswerBackupV11:old,[DATA]:data});
    return {count:lessons.length,data};
  });
  if (msg.type === 'MEL_LINK') return serial(async () => {
    const tab = await currentTab(sender); const list = await ensure(tab.id);
    const pages = await Promise.all(list.map(f => run(tab.id,f.frameId,'pageInfo')));
    const page = pages.find(p => p.activityId);
    if (!page) throw new Error('Trang chưa có Activity ID để ghi nhớ.');
    const data = await loadData(); if (!data.lessons.some(l => l.id === msg.lessonId)) throw new Error('Không có bài này trong kho.');
    const saved = await chrome.storage.local.get(LINKS), links = saved[LINKS] || {};
    links[`${page.origin}:${page.activityId}`] = msg.lessonId;
    await chrome.storage.local.set({[LINKS]:links}); return {links};
  });
  if (msg.type === 'MEL_PICK_RESULT') {
    if (!sender.tab || !MEL.allowedURL(sender.tab.url)) throw new Error('Không đúng tab bài tập.');
    const key = `pick:${sender.tab.id}`, saved = await chrome.storage.session.get(key);
    if (saved[key] !== msg.requestId) return {};
    await chrome.storage.session.remove(key); await stopPicks(sender.tab.id);
    await chrome.storage.local.set({melAnswerLastResult:{tabId:sender.tab.id,time:Date.now(),ok:msg.ok,message:msg.message}});
    return {};
  }
  if(msg.type==='MEL_SEQUENCE_STEP') {
    const tab=await currentTab(sender),key=`sequence:${tab.id}`,s=(await chrome.storage.session.get(key))[key];
    if(!s || s.requestId!==msg.requestId || sender.frameId==null)throw new Error('Chế độ điền lần lượt đã dừng.');
    const result=await run(tab.id,sender.frameId,'sequenceFill',[s.requestId,msg.ref,s.answers[s.index]]);
    if(result.done)s.index++;
    const complete=s.index>=s.answers.length;
    if(result.fatal || complete)await stopPicks(tab.id);
    else await chrome.storage.session.set({[key]:s});
    const message=complete?'Đã điền xong danh sách đáp án. Kiểm tra trên trang trước khi tự nộp.':`${result.error ? result.error+' ' : ''}Đáp án ${s.index+1}/${s.answers.length} · Câu ${s.answers[s.index].n}: ${s.answers[s.index].value}`;
    if(!complete&&!result.fatal)await Promise.allSettled((await frames(tab.id)).map(f=>run(tab.id,f.frameId,'sequenceStatus',[message])));
    await chrome.storage.local.set({melAnswerLastResult:{tabId:tab.id,time:Date.now(),ok:!result.error,message}});
    return {done:result.done || 0};
  }
  const tab = await currentTab(sender);
  if (msg.type === 'MEL_CONTEXT') return {tabId:tab.id,url:tab.url};
  const list = await ensure(tab.id);
  if (msg.type === 'MEL_PANEL') {
    await chrome.tabs.sendMessage(tab.id,{type:'MEL_SHOW_PANEL',toggle:Boolean(msg.toggle)},{frameId:0}); return {tabId:tab.id};
  }
  if (msg.type === 'MEL_SCAN' || msg.type === 'MEL_DETECT') {
    const result = await Promise.allSettled(list.map(async f => ({frameId:f.frameId,...(msg.type === 'MEL_SCAN' ? await run(tab.id,f.frameId,'scan') : {page:await run(tab.id,f.frameId,'pageInfo')})})));
    const ready = result.filter(r => r.status === 'fulfilled').map(r => r.value);
    return {tabId:tab.id,frames:ready,skipped:result.length-ready.length};
  }
  if (msg.type === 'MEL_APPLY') {
    if (tab.id !== msg.tabId) throw new Error('Bạn đã đổi tab. Quét lại bài đang mở.');
    await stopPicks(tab.id);
    let done = 0;
    for (const batch of msg.batches || []) {
      if (!list.some(f => f.frameId === batch.frameId)) return {done,error:'Một khung bài đã đổi. Quét lại trang.'};
      try { const r = await run(tab.id,batch.frameId,'apply',[batch.token,batch.rows]); done += r.done; if (r.error) return {done,error:r.error}; }
      catch (error) { return {done,error:error.message}; }
    }
    return {done};
  }
  if(msg.type==='MEL_AUTO_SOLVE') {
    const data=await serial(loadData),original=data.lessons.find(l=>l.id===msg.lessonId);
    if(!original)throw new Error('Chọn bài trong kho đáp án trước.');
    const lesson={...original,items:original.items.map((item,i)=>({...item,answer:[item.answer[Number(msg.choices?.[i])||0]||item.answer[0]].filter(Boolean)}))};
    await stopPicks(tab.id);
    const scanned=await Promise.allSettled(list.map(async f=>({frameId:f.frameId,...await run(tab.id,f.frameId,'scan')})));
    const framesReady=scanned.filter(r=>r.status==='fulfilled').map(r=>r.value);
    const links=(await chrome.storage.local.get(LINKS))[LINKS]||{};
    const matching=framesReady.filter(f=>{
      if(f.page.identityConflict)return false;
      const resolved=MEL.match(data.lessons,[f.page],links);
      if(resolved)return resolved.lesson.id===lesson.id;
      const selected=msg.manualFrames?.find(p=>p.frameId===f.frameId && p.url===f.page.url && p.section===f.page.section && p.exercise===f.page.exercise);
      return Boolean(selected && (!lesson.section||!f.page.section||lesson.section===f.page.section) && (!lesson.exercise||!f.page.exercise||MEL.norm(lesson.exercise)===MEL.norm(f.page.exercise)));
    });
    const insertions=matching.filter(f=>f.page.insertWords);
    if(insertions.length){
      if(insertions.length!==1)throw new Error('Có nhiều khung bài chèn từ cùng khớp. Chỉ để một bài đang mở.');
      const result=await run(tab.id,insertions[0].frameId,'insertWordFill',[lesson,msg.onlyN||'']);
      return {tabId:tab.id,fallback:false,...result,message:`Đã chèn ${result.done} từ; ${result.skipped} từ đã đúng. ${result.error||'Đã kiểm tra vị trí và nội dung ô; chưa xác nhận Pearson đã lưu.'}`};
    }
    const crosswords=matching.filter(f=>f.page.crossword);
    if(crosswords.length){
      if(crosswords.length!==1)throw new Error('Có nhiều lưới crossword cùng khớp. Chỉ để một bài đang mở.');
      const result=await run(tab.id,crosswords[0].frameId,'crosswordFill',[lesson,msg.onlyN||'']);
      return {tabId:tab.id,fallback:false,...result,message:`Đã điền ${result.done} từ crossword (${result.writtenCells||0} ô chữ); ${result.skipped||0} từ đã đúng. ${result.error||'Đã kiểm tra các ô giao nhau; chưa xác nhận Pearson đã lưu.'}`};
    }
    const candidates=matching.map(f=>({...f,plan:MEL.nativePlan(lesson,f.fields,msg.onlyN)})).filter(f=>f.plan.actions.length);
    if(candidates.length>1)throw new Error('Có nhiều khung cùng khớp. Chỉ để một bài đang mở.');
    if(candidates.length===1){
      const f=candidates[0],result=await run(tab.id,f.frameId,'apply',[f.token,f.plan.actions]);
      return {tabId:tab.id,kind:'native',...result,unresolved:f.plan.unresolved,message:`Đã ghi/chọn ${result.done} ô trên trang. ${f.plan.unresolved.length?'Chưa ghép câu '+f.plan.unresolved.map(r=>r.n).join(', ')+'. ':''}${result.error||'Chưa xác nhận Pearson đã lưu; kiểm tra trước khi tự nộp.'}`};
    }
    if(!matching.length)throw new Error('Bài đang mở chưa khớp chắc chắn với đáp án đã chọn. Bấm Nhận bài đang mở.');
    const capable=await dragFrames(tab.id,matching);
    const drops=await Promise.allSettled(capable.map(async f=>({frameId:f.frameId,...await dragRun(tab.id,f.frameId,'analyze',[lesson])})));
    const usable=drops.filter(r=>r.status==='fulfilled').map(r=>r.value).filter(f=>f.ready||f.skipped).sort((a,b)=>(b.ready+b.skipped)-(a.ready+a.skipped));
    if(usable.length && (!usable[1]||usable[0].ready+usable[0].skipped>usable[1].ready+usable[1].skipped)){
      const result=await dragRun(tab.id,usable[0].frameId,'execute',[lesson,msg.onlyN||'']);
      return {tabId:tab.id,kind:'drag',...result,message:result.kind==='connections'?`Đã nối ${result.done} cặp; ${result.skipped} cặp đã đúng. ${result.error||'Đã kiểm tra đường nối trên trang; chưa xác nhận Pearson đã lưu.'}`:result.kind==='ordering'?`Đã sắp xếp ${result.done} câu (${result.moved} từ); ${result.skipped} câu đã đúng. ${result.error||'Đã kiểm tra thứ tự trên trang; chưa xác nhận Pearson đã lưu.'}`:`Đã tự kéo thả ${result.done} ô; ${result.skipped} ô đã đúng. ${result.error||'Đã thấy đáp án ở ô; chưa xác nhận Pearson đã lưu.'}`};
    }
    const hasDrops=drops.some(r=>r.status==='fulfilled'&&(r.value.targets>0||r.value.sources>0));
    const canPick=matching.some(f=>f.fields.some(field=>['text','select','radio','letters'].includes(field.kind)));
    if(!hasDrops&&!canPick&&/select\b.*\bmistakes\b/i.test(lesson.instruction||''))return {tabId:tab.id,kind:'unresolved',fallback:false,message:'Đã nhận bài chọn nhiều từ sai trong đoạn văn. Chưa xác định được điều khiển và trạng thái chọn. Bấm thử một từ sai trên trang rồi Xuất chẩn đoán; bản này đã bổ sung thu cấu trúc cả đoạn văn.'};
    if(!hasDrops&&!canPick&&/click.*(?:alternative|word)/i.test(lesson.instruction||''))return {tabId:tab.id,kind:'unresolved',fallback:false,message:'Bài dùng từ bấm trực tiếp trong câu; chưa xác định được trạng thái chọn. Bấm một đáp án trên trang rồi Xuất chẩn đoán để thu cấu trúc và trạng thái từ đã chọn.'};
    if(lesson.type==='matching'&&!hasDrops&&!canPick)return {tabId:tab.id,kind:'unresolved',fallback:false,message:'Đã nhận bài nối cặp nhưng chưa hỗ trợ điều khiển nối trên trang này. Bấm Xuất chẩn đoán ở đầu bảng; bản này thu thêm cấu trúc hai cột và đường nối.'};
    return {tabId:tab.id,kind:hasDrops?'drag-unrecognised':'unresolved',fallback:!hasDrops&&canPick,message:hasDrops?'Đã nhận dạng kéo thả nhưng chưa ghép chắc chắn nguồn/đích. Xuất chẩn đoán để xem quy tắc còn thiếu.':canPick?'Chưa ghép chắc chắn toàn bộ ô. Có thể dùng Bấm ô lần lượt hoặc Xem / đổi ghép ô.':'Chưa nhận diện được điều khiển có thể tự làm. Xuất chẩn đoán để bổ sung cơ chế phù hợp.'};
  }
  if(msg.type==='MEL_AUTO_DRAG' || msg.type==='MEL_DRAG_DIAGNOSTIC') {
    const data=await serial(loadData),original=data.lessons.find(l=>l.id===msg.lessonId) || (msg.type==='MEL_DRAG_DIAGNOSTIC'?{id:'',items:[]}:null);
    if(!original)throw new Error('Chọn bài có trong kho đáp án trước.');
    const lesson={...original,items:original.items.map((item,i)=>({...item,answer:[item.answer[Number(msg.choices?.[i]) || 0] || item.answer[0]].filter(Boolean)}))};
    await stopPicks(tab.id);
    const capable=await dragFrames(tab.id,list);
    if(msg.type==='MEL_DRAG_DIAGNOSTIC') {
      const results=await Promise.allSettled(list.map(async f=>{
        const controls=await run(tab.id,f.frameId,'diagnostic',[lesson]);
        let drag;
        try{drag=await dragRun(tab.id,f.frameId,'diagnostic',[lesson]);}catch(error){drag={dragError:error.message};}
        return {frameId:f.frameId,frameURL:f.url.replace(/[?#].*$/,'').replace(/(\/activit(?:y|ies)\/)[^/]+/i,'$1[activity]'),...drag,controls,ruleVersion:MELRules.version,nativePlan:MEL.nativePlan(lesson,controls.fields)};
      }));
      return {report:{version:chrome.runtime.getManifest().version,lessonId:lesson.id,frames:results.map(r=>r.status==='fulfilled'?r.value:{error:String(r.reason?.message || r.reason)})}};
    }
    const checked=await Promise.allSettled(capable.map(async f=>({frameId:f.frameId,page:await run(tab.id,f.frameId,'pageInfo'),...await dragRun(tab.id,f.frameId,'analyze',[lesson])})));
    const candidates=checked.filter(r=>r.status==='fulfilled').map(r=>r.value).filter(r=>r.matched && (!r.page.section || !lesson.section || r.page.section===lesson.section) && (!r.page.exercise || !lesson.exercise || MEL.norm(r.page.exercise)===MEL.norm(lesson.exercise))).sort((a,b)=>b.matched-a.matched);
    if(!candidates.length)throw new Error('Chưa ghép được ô kéo thả với bài đã chọn. Bấm “Xuất chẩn đoán kéo thả” để kiểm tra widget; không cần chỉ vị trí thủ công.');
    if(candidates.length>1 && candidates[0].matched===candidates[1].matched)throw new Error('Có nhiều khung bài giống nhau. Chỉ để một bài đang mở rồi thử lại.');
    const result=await dragRun(tab.id,candidates[0].frameId,'execute',[lesson,msg.onlyN || '']);
    const message=`Đã tự kéo thả ${result.done} ô; ${result.skipped} ô đã đúng được giữ nguyên. ${result.error || 'Đã hoàn tất các ô nhận diện được. Kiểm tra bài trước khi tự nộp.'}`;
    await chrome.storage.local.set({melAnswerLastResult:{tabId:tab.id,time:Date.now(),ok:!result.error,message}});
    return {tabId:tab.id,...result,message};
  }
  if (msg.type === 'MEL_PICK') {
    if (!['fill','drag','pair'].includes(msg.mode)) throw new Error('Thao tác không hợp lệ.');
    await stopPicks(tab.id);
    const requestId = crypto.randomUUID(); await chrome.storage.session.set({[`pick:${tab.id}`]:requestId});
    const results = await Promise.allSettled(list.map(f => run(tab.id,f.frameId,'pick',[{mode:msg.mode,value:String(msg.value || ''),requestId}])));
    if (!results.some(r => r.status === 'fulfilled')) throw new Error('Không thể chọn vị trí trên trang này.');
    return {tabId:tab.id};
  }
  if(msg.type==='MEL_SEQUENCE') {
    const data=await serial(loadData),lesson=data.lessons.find(l=>l.id===msg.lessonId);
    if(!lesson)throw new Error('Chọn bài có trong kho trước.');
    await stopPicks(tab.id);
    const scans=await Promise.allSettled(list.map(f=>run(tab.id,f.frameId,'scan')));
    if(scans.some(r=>r.status==='fulfilled'&&r.value.page.crossword))throw new Error('Crossword cần điền theo từ ngang/dọc. Dùng Tự điền ô chữ, không dùng bấm ô lần lượt.');
    if(!scans.some(r=>r.status==='fulfilled'&&r.value.fields.some(f=>['text','select','radio','letters'].includes(f.kind))))throw new Error('Trang không có ô nhập/chọn phù hợp. Bấm ô lần lượt không kéo được thẻ từ. Hãy xuất chẩn đoán bài này.');
    const answers=MEL.flatten({...lesson,items:lesson.items.map((item,i)=>({...item,answer:[item.answer[Number(msg.choices?.[i]) || 0] || item.answer[0]].filter(Boolean)}))});
    const index=Number(msg.start || 0);
    if(!Number.isInteger(index)||!answers[index])throw new Error('Không có đáp án tại vị trí bắt đầu.');
    await stopPicks(tab.id);await chrome.storage.session.remove(`pick:${tab.id}`);
    const requestId=crypto.randomUUID(),message=`Đáp án ${index+1}/${answers.length} · Câu ${answers[index].n}: ${answers[index].value}`;
    await chrome.storage.session.set({[`sequence:${tab.id}`]:{requestId,answers,index}});
    const results=await Promise.allSettled(list.map(f=>run(tab.id,f.frameId,'startSequence',[{requestId,message}])));
    if(!results.some(r=>r.status==='fulfilled')){await stopPicks(tab.id);throw new Error('Không bật được chế độ bấm ô.');}
    return {tabId:tab.id,message};
  }
  if (msg.type === 'MEL_CANCEL') { await chrome.storage.session.remove(`pick:${tab.id}`); await stopPicks(tab.id);await Promise.allSettled(list.map(f=>dragRun(tab.id,f.frameId,'cancel')));return {}; }
  throw new Error('Yêu cầu không được hỗ trợ.');
}
chrome.runtime.onMessage.addListener((msg,sender,reply) => {
  if (sender.id !== chrome.runtime.id || !msg?.type?.startsWith('MEL_') || msg.type === 'MEL_SHOW_PANEL') return;
  let task;
  if (['MEL_PICK','MEL_PICK_RESULT','MEL_SEQUENCE','MEL_SEQUENCE_STEP','MEL_CANCEL'].includes(msg.type)) { task = pickerQueue.then(() => handle(msg,sender)); pickerQueue = task.catch(() => {}); }
  else task = handle(msg,sender);
  task.then(value => reply({ok:true,...value})).catch(error => reply({ok:false,error:error.message})); return true;
});
chrome.runtime.onInstalled.addListener(() => { serial(loadData).catch(console.error); });
chrome.commands.onCommand.addListener(async command => {
  if (command !== 'toggle-panel') return;
  try { await handle({type:'MEL_PANEL',toggle:true},{}); } catch (error) { console.info(error.message); }
});
