'use strict';
const $ = id => document.getElementById(id);
const panelMode = new URLSearchParams(location.search).has('panel');
if (panelMode) document.body.classList.add('panel');
const state = {data:{lessons:[]},course:'all',unit:1,type:'all',lessonId:'',search:'',links:{},tabId:null,choices:{}};
function h(tag,attrs = {},...children) {
  const el = document.createElement(tag);
  for (const [key,value] of Object.entries(attrs)) {
    if (key.startsWith('on')) el.addEventListener(key.slice(2),value);
    else if (key === 'class') el.className=value;
    else if (key in el) el[key]=value;
    else el.setAttribute(key,value);
  }
  el.append(...children.flat().filter(x => x != null)); return el;
}
const button = (text,fn,className = '') => h('button',{type:'button',class:className,onclick:()=>guard(fn)},text);
function status(text,error=false) { $('status').textContent=text; $('status').className=error?'error':''; $('statusRow').hidden=!text; }
async function guard(fn) { try { await fn(); } catch (e) {status(e.message,true);} }
async function send(type,extra={}) { const r = await chrome.runtime.sendMessage({type,...extra}); if (!r?.ok) throw new Error(r?.error || 'Extension chưa sẵn sàng. Tải lại trang và thử lại.'); return r; }
const current = () => {
  const l=state.data.lessons.find(l => l.id === state.lessonId);
  return l && state.pageMatch?.lessonId===l.id ? {...l,section:state.pageMatch.section || l.section,exercise:state.pageMatch.exercise || l.exercise,sectionTitle:state.pageMatch.sectionTitle || l.sectionTitle} : l;
};
const isDragLesson = l => ['drag_word','drag_image','matching','ordering'].includes(l.type);
const inCourse = l => state.course === 'all' || l.course === state.course;
const inType = l => state.type === 'all' || l.type === state.type || l.skill === state.type;
async function persist() { await chrome.storage.local.set({melAnswerUiV11:{course:state.course,unit:state.unit,type:state.type,lessonId:state.lessonId}}); }
function clearPlan() {$('plan').hidden=true;$('plan').replaceChildren();}
async function choose(key,value) {await send('MEL_CANCEL').catch(()=>{});state[key]=value;state.lessonId='';state.choices={};status('');clearPlan();render();await persist();}
function groups(id,values,key,count) {
  $(id).replaceChildren(...values.map(([value,label]) => {
    const b=button(label,()=>choose(key,value),String(state[key])===String(value)?'active':'');
    b.setAttribute('aria-pressed',String(String(state[key])===String(value)));
    if (count) b.append(h('span',{},String(count(value)))); return b;
  }));
}
function render() {
  const selected = current(); $('picker').hidden=Boolean(selected);$('lesson').hidden=!selected;
  $('total').textContent=`${state.data.lessons.length} bài trong kho`;
  if (selected) return renderLesson(selected);
  groups('courseTabs',MEL.courses,'course');
  groups('unitTabs',Array.from({length:10},(_,i)=>[i+1,String(i+1)]),'unit',unit=>state.data.lessons.filter(l=>inCourse(l)&&l.unit===unit).length);
  groups('typeTabs',MEL.types,'type');
  const query=MEL.norm(state.search);
  const list=state.data.lessons.filter(l=>inCourse(l)&&l.unit===state.unit&&inType(l)&&(!query || MEL.norm([MEL.title(l),l.instruction,...l.items.map(x=>x.prompt)].join(' ')).includes(query)));
  $('lessonList').replaceChildren(...list.map(l=>{
    const b=button('',()=>openLesson(l.id),'card');
    b.append(h('div',{class:'card-title'},MEL.title(l)),h('div',{class:'meta'},h('span',{class:'tag'},l.course.toUpperCase()),h('span',{class:'tag type'},MEL.isCrossword(l)?'Ô chữ':MEL.label(l.type)),h('span',{class:'tag'},`${l.items.filter(x=>!x.isExample).length} câu`),MEL.needsReview(l)?h('span',{class:'tag warn'},'Cần đối chiếu'):null),h('p',{class:'preview'},l.instruction || l.items.find(x=>!x.isExample)?.prompt || l.title));return b;
  }));
  if (!list.length) $('lessonList').append(h('div',{class:'empty'},'Chưa có đáp án cho bộ lọc này. Chọn “Tất cả” hoặc nhập thêm file đáp án.'));
}
async function openLesson(id,detected=null) {await send('MEL_CANCEL').catch(()=>{});state.lessonId=id;state.pageMatch=detected;state.manualFrames=null;state.controlInfo=null;if(!detected){try{const r=await send('MEL_DETECT');state.manualFrames=r.frames.map(f=>({frameId:f.frameId,url:f.page.url,section:f.page.section,exercise:f.page.exercise}));}catch{}}state.choices={};const l=current();if(l){state.course=l.course;state.unit=l.unit;state.type='all';if(isDragLesson(l)){try{const r=await send('MEL_SCAN');state.controlInfo={lessonId:id,hasNative:r.frames.some(f=>f.fields.some(x=>['text','select','radio','letters'].includes(x.kind))),lineMatching:r.frames.some(f=>f.page.lineMatching),sentenceOrdering:r.frames.some(f=>f.page.sentenceOrdering),hasWordBanks:r.frames.some(f=>f.page.orderingGroups?.some(g=>g.length>=3&&g.every(t=>t.trim().split(/\s+/).length===1)))};}catch{}}}status('');clearPlan();render();await persist();window.scrollTo(0,0);}
function answerFor(item,index) {return item.answer[state.choices[index] || 0] || '';}
function flatAnswers(l) {return MEL.flatten({...l,items:l.items.map((item,index)=>({...item,answer:[answerFor(item,index)].filter(Boolean)}))});}
async function copy(text) {
  try {await navigator.clipboard.writeText(text);}
  catch { const area=h('textarea',{value:text});document.body.append(area);area.select();const ok=document.execCommand('copy');area.remove();if(!ok)throw new Error('Không copy được. Hãy chọn văn bản đáp án và copy thủ công.'); }
  status('Đã copy đáp án.');
}
async function startPick(mode,value) {
  await persist();
  if (!panelMode) await send('MEL_PANEL');
  const r=await send('MEL_PICK',{mode,value});state.tabId=r.tabId;
  status(mode==='drag'?'Bấm nguồn kéo, rồi bấm vị trí thả trên trang. Esc để hủy.':mode==='pair'?'Bấm hai lựa chọn cần nối trên trang. Esc để hủy.':'Bấm đúng ô hoặc lựa chọn trên trang. Esc để hủy.');
  if (!panelMode) window.close();
}
let dragging=false;
async function autoDrag(l,onlyN='') {
  if(dragging)return;
  dragging=true;clearPlan();status('Đang tự tìm từ/hình, ghép với câu và kéo vào ô…');
  document.querySelectorAll('[data-auto-drag]').forEach(b=>b.disabled=true);
  try {
    const r=await send('MEL_AUTO_DRAG',{lessonId:l.id,choices:state.choices,onlyN,manualFrames:state.manualFrames});state.tabId=r.tabId;
    status(r.message,Boolean(r.error));
  } finally {dragging=false;document.querySelectorAll('[data-auto-drag]').forEach(b=>b.disabled=false);}
}
function autoButton(label,l,n='') {const b=button(label,()=>autoDrag(l,n));b.dataset.autoDrag='true';b.disabled=dragging;return b;}
let filling=false;
async function startSequence(l,start=0,reason='') {
  if(current()?.id!==l.id)return;
  await persist();if(!panelMode)await send('MEL_PANEL');
  const r=await send('MEL_SEQUENCE',{lessonId:l.id,choices:state.choices,start});state.tabId=r.tabId;
  status(`${reason}${r.message}. Bấm lần lượt các ô trên trang; đáp án tự chuyển sau mỗi ô.`);
  if(!panelMode)window.close();
}
async function autoFill(l,onlyN='') {
  if(filling)return;filling=true;clearPlan();status('Đang nhận diện dạng điều khiển và ghép câu…');
  document.querySelectorAll('[data-auto-fill]').forEach(b=>b.disabled=true);
  try {
      const r=await send('MEL_AUTO_SOLVE',{lessonId:l.id,choices:state.choices,onlyN,manualFrames:state.manualFrames});state.tabId=r.tabId;
    if(current()?.id!==l.id)return;
    if(r.fallback && !onlyN)await startSequence(l,0,r.message+' Đã bật bấm ô lần lượt. ');
    else status(r.message,Boolean(r.error)||['unresolved','drag-unrecognised','ordering-drag'].includes(r.kind));
  }finally{filling=false;document.querySelectorAll('[data-auto-fill]').forEach(b=>b.disabled=false);}
}
function renderLesson(l) {
  const root=$('lesson'); root.replaceChildren();
  const crossword=MEL.isCrossword(l);
  const controlsKnown=state.controlInfo?.lessonId===l.id,noNative=controlsKnown&&!state.controlInfo.hasNative;
  const unsupportedOrdering=l.type==='ordering'&&noNative&&state.controlInfo.hasWordBanks&&!state.controlInfo.sentenceOrdering;
  root.append(h('div',{class:'crumb'},button('← Chọn bài',async()=>{await send('MEL_CANCEL').catch(()=>{});state.lessonId='';clearPlan();render();await persist();},'ghost'),h('span',{},`${l.course.toUpperCase()} · Unit ${l.unit}`)),h('h2',{},MEL.title(l)),h('div',{class:'meta'},h('span',{class:'tag type'},MEL.isCrossword(l)?'Ô chữ':MEL.label(l.type)),h('span',{class:'tag'},l.skill || 'Đáp án')));
  if (l.instruction) root.append(h('p',{class:'instruction'},l.instruction));
  if (MEL.needsReview(l)) root.append(h('p',{class:'review-note'},l.reviewNote || 'Một phần đáp án hoặc số bài trong nguồn cần đối chiếu. Kiểm tra đúng câu trước khi điền.'));
  if (l.passage) root.append(h('details',{},h('summary',{class:'small'},'Nội dung / hộp từ của bài'),h('p',{class:'passage'},l.passage)));
  const primary=button(crossword?'Tự điền ô chữ':l.type==='matching'&&state.controlInfo?.lineMatching?'Tự nối các cặp':MEL.isSentenceRanking(l)?(state.controlInfo?.hasNative?'Tự điền số thứ tự':'Tự xếp câu theo thứ tự'):unsupportedOrdering?'Chưa hỗ trợ tự sắp xếp':l.type==='ordering'&&state.controlInfo?.sentenceOrdering?'Tự sắp xếp cả bài':isDragLesson(l)?'Tự làm cả bài':l.type==='tick_box'?'Tự tích đáp án cả bài':'Tự điền cả bài',()=>autoFill(l));
  primary.dataset.autoFill='true';primary.disabled=filling||unsupportedOrdering;
  const controls=h('section',{class:'fill-controls','aria-label':'Điền đáp án'},h('div',{class:'actions'},primary,button('Copy cả bài',()=>copy([...l.items.filter(x=>!x.isExample).map(x=>`${x.n}. ${x.answer.join(' / ')}`),l.modelAnswer?.text || ''].filter(Boolean).join('\n')),'ghost')));
  if(crossword)controls.append(h('p',{class:'small'},'Tự ghép từ ngang/dọc, giữ chữ ví dụ và kiểm tra ô giao nhau.'),button('↓ Xuất chẩn đoán bài này',()=>$('diagnosticBtn').click(),'ghost'));
  else if(unsupportedOrdering)controls.append(h('p',{class:'review-note'},'Đã nhận đúng bài. Bản này chưa tự kéo từng từ để dựng câu. Xuất file chẩn đoán để bổ sung cơ chế kéo thả.'),button('↓ Xuất chẩn đoán bài này',()=>$('diagnosticBtn').click()));
  else if(noNative)controls.append(h('p',{class:'small'},l.type==='matching'?(state.controlInfo?.lineMatching?'Tự bấm hai đầu và kiểm tra đường nối. Giữ cặp ví dụ và cặp đã nối với đáp án khác.':'Bài nối cặp: thử tự làm; nếu chưa hỗ trợ đường nối, xuất chẩn đoán để lấy cấu trúc hai cột.'):'Không có ô nhập phù hợp; chế độ bấm ô nhập không áp dụng.'),button('↓ Xuất chẩn đoán bài này',()=>$('diagnosticBtn').click(),'ghost'));
  if(flatAnswers(l).length&&!noNative&&!crossword) {
    const answers=flatAnswers(l),start=h('select',{id:'sequenceStart','aria-label':'Bắt đầu điền từ câu'},answers.map((a,i)=>h('option',{value:String(i)},`${i+1}. Câu ${a.n}: ${a.value}`)));
    controls.append(h('p',{class:'small'},isDragLesson(l)?'Các ô nhập/chọn trên trang có thể dùng chế độ bấm lần lượt. Chế độ này không kéo các thẻ từ.':'Ưu tiên tự làm cả bài. Với cụm ô một chữ: bấm một ô trắng để điền các chữ còn thiếu của cả từ, giữ nguyên chữ gợi ý. Bấm ô lần lượt sẽ chuyển sang từ tiếp theo.'),h('label',{},'Bắt đầu từ',start),h('div',{class:'actions'},button('Bấm ô lần lượt',()=>startSequence(l,Number(start.value))),button('Xem / đổi ghép ô',()=>scan(l),'ghost')));
  }
  root.append(controls);
  root.append(h('div',{class:'actions'},button('Ghi nhớ bài đang mở',async()=>{const r=await send('MEL_LINK',{lessonId:l.id});state.links=r.links;status('Đã liên kết bài này với Activity đang mở.');},'ghost')));
  root.append(h('p',{class:'small'},'Tự nhận dạng điều khiển trên trang rồi ghép theo câu. Ví dụ được giữ nguyên. Với ô nhập/chọn có thể sửa đáp án cũ; kéo thả giữ ô đã có nội dung khác và báo rõ.'));
  const rows=h('div',{class:'answers'});
  l.items.forEach((item,index)=>{
    const row=h('article',{class:`answer-row${item.isExample?' example':''}`},h('div',{class:'qnum'},`Câu ${item.n}${item.isExample?' · Ví dụ có sẵn':''}`),h('p',{class:'prompt'},item.prompt || '(Nguồn không có nội dung câu hỏi)'));
    const answer=answerFor(item,index); row.append(h('div',{class:'answer'},answer || 'Chưa có đáp án trong nguồn'));
    if (item.answer.length>1) {
      const select=h('select',{'aria-label':`Đáp án thay thế câu ${item.n}`,onchange:e=>guard(async()=>{await send('MEL_CANCEL').catch(()=>{});state.choices[index]=Number(e.target.value);clearPlan();renderLesson(l);})});
      item.answer.forEach((a,i)=>select.append(h('option',{value:String(i),selected:i===(state.choices[index]||0)},a)));row.append(select);
    }
    if (!item.isExample && answer) {
      let selected=answer;
      const parts=answer.split('|').map(x=>x.trim()).filter(Boolean);
      if (parts.length>1) {
        const part=h('select',{'aria-label':`Chọn phần đáp án câu ${item.n}`,onchange:e=>selected=e.target.value},h('option',{value:answer},'Cả đáp án: '+answer),parts.map((a,i)=>h('option',{value:a},`Ô ${i+1}: ${a}`)));row.append(part);
      }
      const actions=h('div',{class:'actions'},unsupportedOrdering?null:(crossword||isDragLesson(l))?button('Tự làm câu này',()=>autoFill(l,item.n)):button('Chỉ vị trí → Điền/chọn',()=>startPick('fill',selected)),button('Copy',()=>copy(selected),'ghost'));
      if (l.type==='matching'&&!state.controlInfo?.lineMatching) actions.append(button('Nối 2 vị trí',()=>startPick('pair',selected),'ghost'));
      row.append(actions);
    }
    rows.append(row);
  });
  if (l.modelAnswer?.text) rows.append(h('article',{class:'answer-row'},h('div',{class:'qnum'},'Đáp án bài viết trong nguồn'),h('div',{class:'answer'},l.modelAnswer.text),h('div',{class:'actions'},button('Điền vào vị trí',()=>startPick('fill',l.modelAnswer.text)),button('Copy',()=>copy(l.modelAnswer.text),'ghost'))));
  if (['drag_image','choose_image'].includes(l.type)) root.append(h('p',{class:'review-note'},'Kho hiện chứa mô tả hình. Tự kéo hình cần nhãn hình hoặc số câu trên trang để ghép đúng.'));
  root.append(rows);
}
async function detect() {
  const btn=$('detectBtn');if(btn.disabled)return;
  btn.disabled=true;btn.textContent='Đang nhận bài…';clearPlan();
  try {
    await send('MEL_CANCEL');
    const r=await send('MEL_DETECT');state.tabId=r.tabId;
    const pages=r.frames.map(f=>f.page),suggested=MEL.match(state.data.lessons,pages,state.links);
    const label=pages.find(p=>p.section && p.exercise) || pages.find(p=>p.section || p.exercise) || pages[0];
    $('activity').querySelector('p').textContent=label ? [label.section,label.sectionTitle,label.exercise?`Exercise ${label.exercise}`:'',label.activityId?`Activity ${label.activityId}`:''].filter(Boolean).join(' · ') || 'Chưa đọc được section / exercise của trang.' : 'Chưa thấy khung bài.';
    $('suggestion').replaceChildren();
    if(suggested){
      await openLesson(suggested.lesson.id,suggested.detected);
      $('suggestion').append(h('p',{class:'small'},suggested.reason));
      status(`Đã mở đáp án: ${MEL.title(current())}.`);
    }else{
      Object.assign(state,{lessonId:'',pageMatch:null,choices:{},course:'all',type:'all',search:''});$('search').value='';
      const unit=Number(label?.section?.split('.')[0]);if(unit>=1&&unit<=10)state.unit=unit;
      render();await persist();
      $('suggestion').append(h('p',{class:'small'},'Chưa có bài khớp chắc chắn. Chọn bài trong danh sách rồi bấm “Ghi nhớ bài đang mở”.'));
      status('Chưa xác định được bài đang mở. Đáp án bài cũ đã được đóng để tránh nhầm bài.',true);
    }
  }catch(error){state.lessonId='';state.pageMatch=null;state.choices={};render();await persist();throw error;}
  finally{btn.disabled=false;btn.textContent='Nhận bài đang mở';}
}
async function scan(l) {
  await send('MEL_CANCEL');status('Đang tìm các ô trên trang…');clearPlan();
  const r=await send('MEL_SCAN');state.tabId=r.tabId;
  if (current()?.id!==l.id) return;
  const fields=r.frames.flatMap(f=>(f.fields || []).map(field=>({...field,frameId:f.frameId,token:f.token})));
  if (!fields.length) { status('Chưa tìm được ô nhập chuẩn. Nếu đây là bài kéo thả, chọn đúng bài dạng kéo từ/hình rồi bấm “Tự kéo thả cả bài”.',true);return; }
  const answers=flatAnswers(l), selects=[], root=$('plan');
  if (!answers.length && l.modelAnswer?.text) answers.push({n:'bài viết',value:l.modelAnswer.text,prompt:''});
  root.hidden=false;root.className='plan';
  root.append(h('h3',{},`Ghép ${fields.length} ô với ${answers.length} phần đáp án`),h('p',{class:'small'},fields.length===answers.length?'Đang gợi ý theo thứ tự trên trang. Kiểm tra và đổi từng ô nếu cần; ví dụ có sẵn không được đưa vào đáp án.':'Số ô và đáp án khác nhau. Chọn đáp án cho từng ô; để “Bỏ qua” cho ô không cần điền.'));
  if (r.skipped) root.append(h('p',{class:'review-note'},`${r.skipped} khung chưa đọc được. Chỉ hiển thị các ô đã quét.`));
  fields.forEach((f,i)=>{
    const select=h('select',{'aria-label':`Đáp án cho ô ${i+1}`},h('option',{value:''},'— Bỏ qua ô này —'),answers.map((a,j)=>h('option',{value:String(j)},`Câu ${a.n}: ${a.value}`)));
    if (fields.length===answers.length) select.value=String(i);
    selects.push(select);
    root.append(h('label',{},`${i+1}. ${f.label} (${f.kind==='letters'?'cụm ô chữ':f.kind==='text'?'nhập':f.kind==='select'?'danh sách':'chọn một'})`,f.options.length?h('span',{class:'small'},f.options.map(x=>x.text).join(' / ')):null,h('span',{class:'existing'},`Giá trị hiện tại: ${String(f.current || '(trống)')}`),select));
  });
  const applyBtn=button('Điền/chọn các ô đã ghép',async()=>{
    const batches=new Map();
    fields.forEach((f,i)=>{
      if (selects[i].value==='') return;
      const batch=batches.get(f.frameId) || {frameId:f.frameId,token:f.token,rows:[]};
      batch.rows.push({ref:f.ref,value:answers[Number(selects[i].value)].value});batches.set(f.frameId,batch);
    });
    if (!batches.size) throw new Error('Hãy ghép ít nhất một ô với đáp án.');
    applyBtn.disabled=true;
    try { const result=await send('MEL_APPLY',{tabId:r.tabId,batches:[...batches.values()]}); clearPlan();status(`Đã điền/chọn ${result.done} ô. ${result.error || 'Kiểm tra trên trang trước khi tự nộp.'}`,Boolean(result.error)); }
    catch (error) {clearPlan();throw error;}
  });
  root.append(h('div',{class:'actions'},applyBtn,button('Hủy',clearPlan,'ghost')));
  status('Đã quét xong. Xem bảng ghép ô bên dưới trước khi điền.');root.scrollIntoView({behavior:'smooth',block:'start'});
}
function download(data,name) {
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const a=h('a',{href:url,download:name});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
$('search').addEventListener('input',e=>{state.search=e.target.value;render();});
$('detectBtn').addEventListener('click',()=>guard(detect));
$('dismissStatus').addEventListener('click',()=>status(''));
$('stopBtn').addEventListener('click',()=>guard(async()=>{await send('MEL_CANCEL');status('Đã yêu cầu dừng thao tác.');}));
document.addEventListener('keydown',e=>{if(e.key==='Escape')guard(async()=>{await send('MEL_CANCEL');status('Đã dừng thao tác.');});});
$('diagnosticBtn').addEventListener('click',()=>guard(async()=>{
  const btn=$('diagnosticBtn');btn.disabled=true;btn.textContent='Đang tạo file…';
  try {
    const r=await send('MEL_DRAG_DIAGNOSTIC',{lessonId:current()?.id || '',choices:state.choices});
    download(r.report,'myenglishlab-keo-tha-chan-doan.json');
    status('Đã tạo file myenglishlab-keo-tha-chan-doan.json. Mở mục Tải xuống của trình duyệt và gửi file đó trong cuộc trò chuyện.');
  } finally {btn.disabled=false;btn.textContent='↓ Xuất chẩn đoán';}
}));
$('panelBtn').addEventListener('click',()=>guard(async()=>{await persist();await send('MEL_PANEL');window.close();}));
$('exportBtn').addEventListener('click',()=>guard(async()=>{const r=await send('MEL_DATA');download(r.data,'myenglishlab-dap-an.json');status('Đã xuất kho đáp án.');}));
$('importBtn').addEventListener('click',()=>guard(async()=>{
  const file=$('importFile').files[0];if(!file)throw new Error('Chọn file JSON trước.');
  if (file.size>12*1024*1024) throw new Error('File quá lớn (tối đa 12 MB). Chia file theo Unit rồi nhập lần lượt.');
  const raw=JSON.parse(await file.text());const lessons=MEL.normalize(raw);if(!lessons.length)throw new Error('File không có bài.');
  const replace=$('importMode').value==='replace';
  if (replace && !confirm(`Thay kho hiện tại bằng ${lessons.length} bài? Một bản sao lưu sẽ được lưu trên máy và tải xuống.`)) return;
  if (replace) download((await send('MEL_DATA')).data,'myenglishlab-truoc-khi-thay-the.json');
  const r=await send('MEL_IMPORT',{data:raw,replace});state.data=r.data;state.lessonId='';clearPlan();render();await persist();$('fileStatus').textContent=`Đã nhập ${r.count} bài. Tổng: ${state.data.lessons.length} bài.`;status('Đã cập nhật kho đáp án.');
}));
chrome.storage.onChanged.addListener((changes,area)=>{
  if (area!=='local')return;
  const result=changes.melAnswerLastResult?.newValue;
  if (result && result.tabId===state.tabId)status(result.message,!result.ok);
  if (changes.melAnswerDataV11?.newValue) {state.data=changes.melAnswerDataV11.newValue;clearPlan();render();}
  if (changes.melAnswerLinksV11?.newValue) state.links=changes.melAnswerLinksV11.newValue;
  const ui=changes.melAnswerUiV11?.newValue;
  if (ui && JSON.stringify(ui)!==JSON.stringify({course:state.course,unit:state.unit,type:state.type,lessonId:state.lessonId})) {Object.assign(state,ui);clearPlan();render();}
});
guard(async()=>{
  const [r,saved]=await Promise.all([send('MEL_DATA'),chrome.storage.local.get('melAnswerUiV11')]);
  state.data=r.data;state.links=r.melAnswerLinksV11 || {};
  const ui=saved.melAnswerUiV11 || {};
  if (MEL.courses.some(x=>x[0]===ui.course))state.course=ui.course;
  if (Number.isInteger(ui.unit)&&ui.unit>=1&&ui.unit<=10)state.unit=ui.unit;
  if (MEL.types.some(x=>x[0]===ui.type))state.type=ui.type;
  if (typeof ui.lessonId==='string')state.lessonId=ui.lessonId;
  render();
  try {const ctx=await send('MEL_CONTEXT');state.tabId=ctx.tabId;if(panelMode)await detect();}catch{/* The local answer library works away from Pearson, too. */}
});
