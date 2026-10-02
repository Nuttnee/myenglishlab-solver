/* Page adapters: native controls, open shadow roots, explicit targeting and HTML5 drag/drop. */
(() => {
  if (globalThis.MELPage) return;
  const norm = v => String(v ?? '').normalize('NFKC').trim().toLowerCase().replace(/[‘’]/g,"'").replace(/\s+/g,' ');
  const all = (selector, root = document) => {
    const found = [...root.querySelectorAll(selector)];
    for (const node of root.querySelectorAll('*')) if (node.shadowRoot && node.tagName !== 'MEL-ANSWER-ROOT') found.push(...all(selector,node.shadowRoot));
    return found;
  };
  const visible = el => Boolean(el?.isConnected && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none');
  const enabled = el => !el.disabled && !el.matches(':disabled') && !el.readOnly && el.getAttribute('aria-disabled') !== 'true' && !el.closest('[inert]');
  const controlVisible = el => visible(el) || ((el.type === 'radio' || el.type === 'checkbox') && [...(el.labels || [])].some(visible));
  const labelText = el => { const copy = el.cloneNode(true); copy.querySelectorAll('input,select,textarea,script,style').forEach(x => x.remove()); return copy.textContent; };
  const label = el => {
    const ids = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
    const root = el.getRootNode();
    return (el.getAttribute('aria-label') || ids.map(id => root.getElementById?.(id)?.textContent || '').join(' ') || [...(el.labels || [])].map(labelText).join(' ') || el.getAttribute('placeholder') || el.getAttribute('alt') || el.textContent || el.name || '').trim().slice(0,240);
  };
  const valueOf = el => el.isContentEditable ? el.textContent : (el.type === 'radio' || el.type === 'checkbox') ? el.checked : el.value;
  const field = el => el.matches('textarea,select,input:not([type]),input[type=text],input[type=number],input[type=url],[contenteditable="true"],[contenteditable="plaintext-only"]') && !/user.?name|password|login|search|email/i.test([el.name,el.id,el.autocomplete].join(' '));
  const radioSelector='input[type=radio],[role=radio]';
  const checked = el => el.checked === true || el.getAttribute('aria-checked') === 'true';
  function optionLabel(el) {
    if(el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby') || el.labels?.length || el.textContent?.trim())return label(el);
    // Older exercises put plain text or a span beside each radio without <label>.
    let text='';
    for(let node=el.nextSibling;node;node=node.nextSibling){
      if(node.nodeType===1 && (node.matches('br,input,select,textarea,[role=radio]') || node.querySelector('input,select,textarea,[role=radio]')))break;
      text+=node.textContent || '';
    }
    return text.trim().slice(0,240) || label(el);
  }
  function radioGroup(el) {
    if(!el?.matches(radioSelector))return null;
    const explicit=el.closest('[role=radiogroup]');
    let group;
    if(explicit)group=[...explicit.querySelectorAll(radioSelector)];
    else if(el.type==='radio' && el.name)group=all('input[type=radio]',el.getRootNode()).filter(x=>x.name===el.name && x.form===el.form);
    else {
      for(let parent=el.parentElement;parent && !parent.matches('body,main,form,html');parent=parent.parentElement){
        const options=[...parent.querySelectorAll(radioSelector)];
        if(options.length>=2){group=options;break;}
      }
    }
    return group?.filter(x=>controlVisible(x) && enabled(x)) || null;
  }
  function radioFrom(el) {
    const direct=el.closest(radioSelector) || el.closest('label')?.control;
    if(direct?.matches(radioSelector))return direct;
    if(el.closest('button,a,input,select,textarea,[role=button]'))return null;
    for(let node=el;node && !node.matches('body,main,form,html');node=node.parentElement){
      const options=[...node.querySelectorAll(radioSelector)];
      if(!options.length)continue;
      const group=radioGroup(options[0]);
      if(group && options.every(x=>group.includes(x)))return options[0];
      return null;
    }
    return null;
  }
  function questionInfo(group) {
    let context='',region=null;
    for(let node=group[0]?.parentElement;node && !node.matches('body,html,main,form');node=node.parentElement){
      const radios=[...node.querySelectorAll(radioSelector)];
      if(radios.some(el=>!group.includes(el)))break;
      if(!group.every(el=>node.contains(el)))continue;
      const text=MELContext.text(node);
      if(text.length>1600)break;
      if(text){context=text;region=node;}
    }
    const isExample=/^\s*example\s*:/i.test(context);
    const questionNumber=MELContext.number(region);
    return {context,questionNumber,isExample};
  }
  function pageInfo() {
    const out = {url:location.href,origin:location.origin,title:document.title,activityId:location.pathname.match(/\/activit(?:y|ies)\/([\w-]+)/i)?.[1] || '',section:'',sectionTitle:'',skill:'',exercise:'',questionText:''};
    const texts = all('h1,h2,h3,h4,[role=heading],header,nav,[class*=title],[class*=Title],[class*=header],[class*=Header]').filter(visible).map(x => x.innerText || x.textContent).filter(x => x && x.length < 700);
    const text = texts.join('\n');
    const exercises = [...new Set([...text.matchAll(/\bExercise\s+(\d{1,2}[a-z]?)\b/gi)].map(m => m[1]))];
    out.exercise = exercises.length ? exercises.join(' / ') : document.title.match(/\bExercise\s+(\d{1,2}[a-z]?)\b/i)?.[1] || '';
    const sectionCode=value=>value.trim().replace(/^Review\s*/i,'R').replace(/\s+/g,'').toUpperCase();
    const sectionPattern='(?:\\d{1,2}\\.\\d{1,2}|R\\s*\\d{1,2}|Review\\s+\\d{1,2})';
    const sectionMatch=text.match(new RegExp('\\b('+sectionPattern+')\\s*(?:[|·:–-]|Vocabulary|Grammar|Reading|Listening|Writing|Speaking|Pronunciation|Functions?)','i'));
    out.section = sectionMatch?sectionCode(sectionMatch[1]):'';
    // Pearson can render section and topic in separate table cells without semantic headings.
    const leafTexts=[];
    if(document.body){
      const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node,count=0;
      while((node=walker.nextNode()) && count++<12000){
        const parent=node.parentElement,t=node.nodeValue.trim();
        if(!t || t.length>200 || !parent || parent.closest('script,style,noscript,mel-answer-root') || !visible(parent))continue;
        leafTexts.push(t);
      }
    }
    const exactExercises=[...new Set(leafTexts.map(t=>t.match(/^Exercise\s+(\d{1,2}[a-z]?)$/i)?.[1]).filter(Boolean))];
    if(exactExercises.length)out.exercise=exactExercises.join(' / ');
    const topic=/^(Vocabulary|Grammar|Reading|Listening|Writing|Speaking|Pronunciation|Functions?)(?:\s*[:：]|\s*$)/i;
    const pairs=[];
    leafTexts.forEach((t,i)=>{
      if(!new RegExp('^'+sectionPattern+'$','i').test(t))return;
      const title=leafTexts.slice(i+1,i+5).find(t=>topic.test(t));
      if(title)pairs.push({section:sectionCode(t),title,skill:title.match(topic)[1].toLowerCase().replace(/^functions$/,'function')});
    });
    const sections=[...new Set(pairs.map(p=>p.section))];
    out.identityConflict=sections.length>1;
    if(sections.length===1){out.section=sections[0];out.sectionTitle=pairs[0].title;out.skill=pairs[0].skill;}
    else if(!pairs.length){
      const titles=[...new Set(leafTexts.filter(t=>topic.test(t)))];
      if(titles.length===1){out.sectionTitle=titles[0];out.skill=titles[0].match(topic)[1].toLowerCase().replace(/^functions$/,'function');}
    }
    out.lineMatching=all('.matching').filter(visible).some(r=>r.querySelector('.matchingGroup.left .matchingElement')&&r.querySelector('.matchingGroup.right .matchingElement')&&r.querySelector('.matchingLines svg'));
    out.crossword=Boolean(globalThis.MELCrossword?.present());
    out.questionText=MELContext.text(document.body).slice(0,40000);
    // Keep alternatives grouped, including disabled example options. Recognition
    // must not confuse isolated answer words elsewhere on the page with a question.
    const seenChoices=new Set();out.choiceGroups=[];
    for(const el of all(radioSelector).filter(visible)){
      if(seenChoices.has(el))continue;
      const group=radioGroup(el);if(!group)continue;group.forEach(x=>seenChoices.add(x));
      const labels=group.filter(visible).map(optionLabel).filter(Boolean);
      if(labels.length>=2)out.choiceGroups.push(labels);
    }
    // Read each word bank independently; repeated words count and separate questions never merge.
    const tokenSelector='[draggable=true],[role=option],.ui-draggable';
    const banks=all('.wordpoolWrapper,.word-bank,.wordBank,.wordbank,[data-word-bank],[role=listbox]');
    out.dragBlanks=banks.some(visible)&&all('.drop,.droppable,.ui-droppable,[data-drop-target],[data-drop-zone]').some(el=>visible(el)&&!banks.some(bank=>bank===el||bank.contains(el)));
    for(const token of all(tokenSelector).filter(visible)){
      const parent=token.parentElement;
      if(parent&&!parent.matches('body,main,html,form')&&parent.querySelectorAll(tokenSelector).length>=3)banks.push(parent);
    }
    const groups=[...new Set(banks)].filter(visible).map(bank=>{
      const tokens=[...bank.querySelectorAll(tokenSelector)].filter(visible).filter(el=>!el.querySelector(tokenSelector));
      return {bank,tokens:tokens.map(el=>MELContext.text(el).trim()).filter(Boolean)};
    }).filter(g=>g.tokens.length>=3&&g.tokens.length<=35&&g.tokens.every(t=>t.length<=100));
    out.orderingGroups=groups.filter(g=>!groups.some(other=>other!==g&&g.bank.contains(other.bank))).slice(0,50).map(g=>g.tokens);
    out.sentenceOrdering=all('.draggableJumbledWords').filter(visible).some(root=>root.querySelectorAll('.wordpoolWrapper').length===1&&root.querySelectorAll('.droppableWrapper').length===1);
    // Include placed words too so recognition survives a partially completed sentence.
    if(out.sentenceOrdering){
      out.orderingGroups=all('.draggableJumbledWords').filter(visible).map(root=>[...root.querySelectorAll('.wordpoolWrapper > .drag,.droppableWrapper > .drag')].filter(el=>visible(el)&&!el.matches('.example,.ui-sortable-helper,.ui-sortable-placeholder')).map(el=>MELContext.text(el).trim())).filter(g=>g.length>=3);
    }
    return out;
  }
  let snapshot = null, cancelPicker = null, operation = 0, sequence = null;
  const signature = () => { const p = pageInfo(); return `${p.url}|${p.section}|${p.exercise}`; };
  function scan() {
    const refs = new Map(), fields = [], seenRadio = new Set(),seenLetters=new Set();
    const peers=all('input,textarea,select,[contenteditable="true"],[contenteditable="plaintext-only"]').filter(el=>controlVisible(el)&&enabled(el)&&field(el)&&!el.closest('.crossword'));
    const letterGroups=globalThis.MELLetters?.groups(peers)||[],byCell=new Map();
    for(const group of letterGroups)for(const cell of group.cells)byCell.set(cell.el,group);
    const wordPeers=peers.filter(el=>!byCell.has(el)||byCell.get(el).cells.find(c=>c.editable)?.el===el);
    for (const el of all('input,textarea,select,[contenteditable="true"],[contenteditable="plaintext-only"],[role=radio],[role=checkbox]')) {
      if (!controlVisible(el) || !enabled(el) || el.closest('mel-answer-root,.crossword')) continue;
      const letters=byCell.get(el);
      if(letters){
        if(seenLetters.has(letters))continue;seenLetters.add(letters);
        const ref=String(fields.length),current=MELLetters.state(letters),question=MELLetters.describe(letters,wordPeers);
        refs.set(ref,{el,kind:'letters',letters,current,question:JSON.stringify(question)});
        fields.push({ref,kind:'letters',label:'Từ: '+question.letterPattern.map(c=>c===null?'□':c).join(''),current:current.join(''),options:[],...question});continue;
      }
      let kind = '', group = null;
      if (field(el)) { if (el.isContentEditable && el.parentElement?.isContentEditable) continue; kind = el.tagName === 'SELECT' ? 'select' : 'text'; if (el.multiple) continue; }
      else if (el.matches(radioSelector)) {
        group = radioGroup(el);
        if(!group?.length)continue;
        if (group.some(x => seenRadio.has(x))) continue;
        group.forEach(x => seenRadio.add(x)); kind = 'radio';
      }
      else if(el.matches('input[type=checkbox],[role=checkbox]')){group=[el];kind='checkbox';}
      else continue;
      if (group && !group.length) continue;
      const ref = String(fields.length);
      const current = group ? group.map(x => x.checked ?? x.getAttribute('aria-checked')).join('|') : valueOf(el);
      const options = kind === 'select' ? [...el.options].filter(x => !x.disabled && !x.hidden).map(x => ({text:x.text,value:x.value})) : group ? group.map(x => ({text:optionLabel(x),value:x.value || ''})) : [];
      const name = group ? label(el.closest('[role=radiogroup]') || el.closest('fieldset')?.querySelector('legend') || el) : label(el);
      const checkboxRegion=kind==='checkbox'?MELContext.checkboxScope(el):null;
      const question=kind==='checkbox' ? {...MELContext.describe(el,all('input[type=checkbox],[role=checkbox]'),checkboxRegion),groupKey:MELContext.groupKey(checkboxRegion)} : group ? questionInfo(group) : MELContext.describe(el,peers);
      refs.set(ref,{el,kind,group,current,label:name,options:JSON.stringify(options),question:JSON.stringify(question)});
      fields.push({ref,kind,label:name || `Ô ${fields.length + 1}`,current,options,maxLength:globalThis.MELLetters?.candidate(el)?1:el.maxLength,...question});
    }
    const token = crypto.randomUUID(); snapshot = {token,refs,signature:signature()};
    return {token,page:pageInfo(),fields};
  }
  function diagnostic(lesson={}){
    const result=scan(),page=result.page;
    const roots=[...new Set([...snapshot.refs.values()].map(item=>item.letters?.root||(item.kind==='checkbox'?MELContext.checkboxScope(item.el):MELContext.scope(item.el,[...snapshot.refs.values()].map(x=>x.el)))))].filter(Boolean);
    const fields=result.fields.map(({before,after,...f})=>f);
    return {page:{origin:page.origin,section:page.section,exercise:page.exercise,skill:page.skill,sectionTitle:page.sectionTitle},orderingGroups:page.orderingGroups,crossword:globalThis.MELCrossword?.diagnostic()||[],fields,structure:roots.slice(0,25).map(MELContext.structure),questionWidgets:MELContext.unsupportedStructure(lesson)};
  }
  function findOption(options, value) {
    return MELRules.findOption(options,value);
  }
  function setText(el, value) {
    if(globalThis.MELLetters?.candidate(el)&&String(value).length>1)throw new Error('Ô này chỉ dành cho một ký tự; chưa nhận diện được cụm từ. Xuất chẩn đoán để kiểm tra cấu trúc.');
    if(el.maxLength>0&&String(value).length>el.maxLength)throw new Error('Đáp án dài hơn giới hạn của ô. Với ô một chữ, cần ghép đúng cụm từ trước.');
    if (el.tagName === 'INPUT' && el.type === 'number' && (String(value).trim() === '' || !Number.isFinite(Number(value)))) throw new Error('Đáp án không phải số.');
    el.focus();
    if (el.isContentEditable) {
      const range = document.createRange(); range.selectNodeContents(el);
      const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
      if (!document.execCommand('insertText',false,value)) el.textContent = value;
    } else {
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto,'value').set.call(el,value);
    }
    el.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true,inputType:'insertText',data:value}));
    el.dispatchEvent(new Event('change',{bubbles:true,composed:true})); el.blur();
  }
  const pause = () => new Promise(resolve => setTimeout(resolve,300));
  async function crosswordFill(lesson,onlyN='') {
    const epoch=operation,key=signature();
    return MELCrossword.execute(lesson,onlyN,{setText,valid:()=>epoch===operation&&signature()===key});
  }
  async function apply(token, rows) {
    if(globalThis.MELCrossword?.present())throw new Error('Dùng Tự điền ô chữ cho lưới crossword.');
    const epoch = operation;
    if (!snapshot || token !== snapshot.token || snapshot.signature !== signature()) throw new Error('Trang đã đổi hoặc bản quét đã hết hiệu lực. Hãy quét lại.');
    const seen = new Set(), actions = [];
    for (const row of rows) {
      const item = snapshot.refs.get(row.ref);
      if (!item || seen.has(row.ref)) throw new Error('Danh sách ô không hợp lệ.');
      seen.add(row.ref);
      const {el,group,kind} = item;
      if(kind==='letters'){
        if(!MELLetters.intact(item.letters)||JSON.stringify(MELLetters.state(item.letters))!==JSON.stringify(item.current))throw new Error('Cụm ô chữ đã đổi. Hãy quét lại.');
        if(!MELRules.letterValues(MELLetters.pattern(item.letters),row.value))throw new Error('Đáp án không khớp số ô/chữ gợi ý.');
        actions.push({item,value:String(row.value)});continue;
      }
      if (!controlVisible(el) || !enabled(el) || group?.some(x => !x.isConnected || !enabled(x))) throw new Error('Ô trên trang đã đổi. Hãy quét lại.');
      const current = group ? group.map(x => x.checked ?? x.getAttribute('aria-checked')).join('|') : valueOf(el);
      if (current !== item.current) throw new Error('Một ô đã được sửa sau khi quét. Quét lại để tránh ghi đè nhầm.');
      const optionsNow = kind === 'select' ? [...el.options].filter(x => !x.disabled && !x.hidden).map(x => ({text:x.text,value:x.value})) : group ? group.map(x => ({text:optionLabel(x),value:x.value || ''})) : [];
      const labelNow = group ? label(el.closest('[role=radiogroup]') || el.closest('fieldset')?.querySelector('legend') || el) : label(el);
      if (labelNow !== item.label || JSON.stringify(optionsNow) !== item.options) throw new Error('Nội dung ô đã đổi. Hãy quét lại.');
      if(group && kind!=='checkbox' && JSON.stringify(questionInfo(group))!==item.question)throw new Error('Nội dung câu đã đổi. Hãy quét lại.');
      const value = String(row.value ?? '');
      let target = null;
      if (kind === 'select') target = findOption([...el.options].filter(x => !x.disabled && !x.hidden),value);
      else if (group) target = findOption(group.map(x => ({text:optionLabel(x),value:x.value || '',el:x})),value)?.el;
      if (kind !== 'text' && !target) throw new Error(`Không tìm thấy lựa chọn duy nhất “${value}” ở ${item.label}. Dùng Chỉ vị trí.`);
      actions.push({item,value,target,wanted:row.checked!==false});
    }
    const pageKey = snapshot.signature; snapshot = null;
    let done = 0;
    for (const {item,value,target,wanted} of actions) {
      if (epoch !== operation) return {done,total:actions.length,error:'Đã dừng tự điền.'};
      if (signature() !== pageKey || !item.el.isConnected || !enabled(item.el) || (target && (!target.isConnected || !enabled(target)))) return {done,total:actions.length,error:'Trang đổi trong lúc điền. Đã dừng; hãy quét lại.'};
      if(item.kind==='letters'){
        if(JSON.stringify(MELLetters.state(item.letters))!==JSON.stringify(item.current))return {done,total:actions.length,error:'Một cụm chữ vừa thay đổi. Hãy quét lại.'};
        try{await MELLetters.fill(item.letters,value,{setText,pause,valid:()=>epoch===operation&&signature()===pageKey});done++;}catch(error){return {done,total:actions.length,error:error.message};}
        continue;
      }
      const current = item.group ? item.group.map(x => x.checked ?? x.getAttribute('aria-checked')).join('|') : valueOf(item.el);
      if (current !== item.current) return {done,total:actions.length,error:'Một ô vừa thay đổi. Đã dừng; hãy quét lại.'};
      try {
        if (item.kind === 'text') setText(item.el,value);
        else if (item.kind === 'select') setText(item.el,target.value);
        else if (checked(target)!==(item.kind==='checkbox'?wanted:true)) target.click();
      } catch (error) { return {done,total:actions.length,error:error.message}; }
      await pause();
      const ok = item.kind === 'text' ? String(valueOf(item.el)) === value : item.kind === 'select' ? item.el.value === target.value : checked(target)===(item.kind==='checkbox'?wanted:true);
      if (!ok) return {done,total:actions.length,error:'Trang chưa nhận thao tác. Dùng Chỉ vị trí hoặc điền thủ công.'};
      done++;
    }
    return {done,total:actions.length,verification:'dom-only'};
  }
  function clickable(el) {
    const control = el.closest('input[type=radio],input[type=checkbox],[role=radio],[role=checkbox],[role=option],button,[role=button],label');
    if (!control) return null;
    const target = control.tagName === 'LABEL' ? control.control : control;
    if (!target || !enabled(target) || target.closest('a')) return null;
    if (target.tagName === 'BUTTON' && target.type === 'submit' && target.form) return null;
    if (/\b(submit|finish|check|next|send|delete|remove|save|nộp|gửi|tiếp|kiểm tra)\b/i.test(label(target))) return null;
    return target;
  }
  function stopPick() { operation++; if (cancelPicker) cancelPicker(); cancelPicker = null; sequence = null; }
  function sequenceStatus(text) { if(sequence) sequence.info.textContent=text+'\nBấm ô hoặc câu chọn đáp án tiếp theo. Esc để dừng.'; }
  function startSequence({requestId,message}) {
    stopPick();
    if(globalThis.MELCrossword?.present())throw new Error('Crossword không dùng bấm ô lần lượt.');
    const info=document.createElement('div');info.id='mel-pick-tip';
    info.style.cssText='position:fixed;left:12px;top:12px;z-index:2147483647;max-width:calc(100vw - 24px);padding:12px 16px;background:#176b5b;color:white;border-radius:9px;font:14px system-ui;pointer-events:none;white-space:pre-wrap';
    document.documentElement.append(info);
    const session={requestId,info,key:signature(),targets:new Map(),used:new WeakSet(),busy:false};sequence=session;
    sequenceStatus(message);
    const targetOf=e=>{const el=e.composedPath()[0];if(!(el instanceof HTMLElement)||e.composedPath().some(x=>x?.tagName==='MEL-ANSWER-ROOT'))return null;const t=el.closest('input,textarea,select,[contenteditable="true"],[contenteditable="plaintext-only"]') || el.closest('label')?.control;if(t && field(t) && visible(t) && enabled(t))return t;const radio=radioFrom(el),group=radio && radioGroup(radio);return group?.length ? group[0] : null;};
    const suppress=e=>{if(targetOf(e)){e.preventDefault();e.stopImmediatePropagation();}};
    const click=async e=>{
      if(e.composedPath()[0]===session.passTarget)return;const target=targetOf(e);if(!target)return;
      e.preventDefault();e.stopImmediatePropagation();
      if(session.busy)return;
      target.focus({preventScroll:true});
      if(session.used.has(target)){sequenceStatus('Ô này đã được điền. Bấm ô khác để tiếp tục.');return;}
      session.busy=true;const ref=crypto.randomUUID();session.targets.set(ref,target);
      try {const r=await chrome.runtime.sendMessage({type:'MEL_SEQUENCE_STEP',requestId,ref});if(!r?.ok && sequence===session)sequenceStatus(r?.error || 'Chưa điền được ô; thử lại.');}
      finally {session.targets.delete(ref);session.busy=false;}
    };
    const key=e=>{if(e.key==='Escape'){e.preventDefault();stopPick();chrome.runtime.sendMessage({type:'MEL_CANCEL'}).catch(()=>{});}};
    document.addEventListener('pointerdown',suppress,true);document.addEventListener('pointerup',suppress,true);document.addEventListener('click',click,true);document.addEventListener('keydown',key,true);
    cancelPicker=()=>{info.remove();document.removeEventListener('pointerdown',suppress,true);document.removeEventListener('pointerup',suppress,true);document.removeEventListener('click',click,true);document.removeEventListener('keydown',key,true);};
    return {started:true};
  }
  async function sequenceFill(requestId,ref,answer) {
    const value=typeof answer==='object'?answer.value:answer;
    const s=sequence,target=s?.targets.get(ref);
    if(!s || s.requestId!==requestId || s.key!==signature())return {fatal:true,error:'Bài đã đổi. Đã dừng điền lần lượt; hãy nhận bài mới.'};
    if(!target || !controlVisible(target) || !enabled(target) || s.used.has(target))return {error:'Ô đã đổi hoặc đã điền; bấm một ô khác.'};
    try {
      const letters=globalThis.MELLetters?.forInput(target);
      if(letters){
        const result=await MELLetters.fill(letters,value,{setText,pause,valid:()=>sequence===s&&s.key===signature()});
        result.cells.forEach(el=>s.used.add(el));return {done:1};
      }
      const group=radioGroup(target);
      if(group){
        const q=questionInfo(group);
        if(q.isExample || (q.questionNumber && answer.n && norm(q.questionNumber)!==norm(answer.n)))return {error:`Bấm câu ${answer.n || 'tiếp theo'} trong danh sách đáp án; chưa chuyển đáp án.`};
        const match=findOption(group.map(el=>({text:optionLabel(el),value:el.value || '',el})),value)?.el;
        if(!match)return {error:'Câu này không có đáp án khớp duy nhất. Bấm đúng câu; chưa chuyển đáp án.'};
        if(!checked(match)){s.passTarget=match;try{match.click();}finally{s.passTarget=null;}}
        await pause();
        if(sequence!==s || s.key!==signature())return {fatal:true,error:'Bài đã đổi hoặc thao tác đã dừng.'};
        if(!match.isConnected || !checked(match))return {error:'Trang chưa nhận lựa chọn. Chưa chuyển đáp án; hãy thử lại.'};
        group.forEach(el=>s.used.add(el));return {done:1};
      }
      const option=target.tagName==='SELECT'?findOption([...target.options].filter(x=>!x.disabled&&!x.hidden),value):null;
      if(target.tagName==='SELECT'&&!option)return {error:'Không có lựa chọn khớp. Đáp án vẫn được giữ để bấm ô khác.'};
      const expected=String(option?option.value:value);setText(target,expected);await pause();
      if(sequence!==s || s.key!==signature())return {fatal:true,error:'Đã dừng vì bài hoặc thao tác đã đổi.'};
      if(!target.isConnected || String(valueOf(target))!==expected)return {error:'Trang chưa nhận giá trị. Chưa chuyển đáp án; hãy thử lại.'};
      s.used.add(target);return {done:1};
    }catch(error){return {error:error.message};}
  }
  function pick({mode,value,requestId}) {
    if(globalThis.MELCrossword?.present())throw new Error('Dùng Tự điền ô chữ hoặc Tự làm câu này cho crossword.');
    stopPick();
    let source = null, hovered = null, oldOutline = '', finished = false;
    const info = document.createElement('div');
    info.id = 'mel-pick-tip';
    info.style.cssText = 'position:fixed;left:12px;top:12px;max-width:calc(100vw - 24px);z-index:2147483647;padding:12px 16px;background:#176b5b;color:white;border-radius:9px;font:14px system-ui;pointer-events:none;box-shadow:0 4px 20px #0004;white-space:pre-wrap';
    document.documentElement.append(info);
    const base = mode === 'drag' ? 'Bấm vào từ/hình cần kéo, sau đó bấm vị trí thả.' : mode === 'pair' ? 'Bấm lựa chọn thứ nhất, sau đó bấm lựa chọn cần nối.' : `Đáp án: ${value}\nBấm đúng ô nhập hoặc lựa chọn trên trang.`;
    info.textContent = base + ' (Esc để hủy)';
    const restore = () => { if (hovered) hovered.style.outline = oldOutline; hovered = null; };
    const move = event => { const el = event.composedPath()[0]; if (!(el instanceof HTMLElement) || el.closest('mel-answer-root')) return; restore(); hovered = el; oldOutline = el.style.outline; el.style.outline = '3px solid #e6a326'; };
    const suppress = e => { if (!e.composedPath().some(x => x?.tagName === 'MEL-ANSWER-ROOT')) {e.preventDefault();e.stopImmediatePropagation();} };
    const cleanup = () => { restore(); info.remove(); document.removeEventListener('pointermove',move,true); document.removeEventListener('pointerdown',suppress,true); document.removeEventListener('pointerup',suppress,true); document.removeEventListener('click',click,true); document.removeEventListener('keydown',key,true); clearTimeout(timer); };
    const finish = result => {
      if (finished) return; finished = true; cleanup(); cancelPicker = null;
      chrome.runtime.sendMessage({type:'MEL_PICK_RESULT',requestId,...result}).catch(() => {});
    };
    const key = e => { if (e.key === 'Escape') {e.preventDefault();finish({ok:false,message:'Đã hủy chọn vị trí.'});} };
    const click = e => {
      if (e.composedPath().some(x => x?.tagName === 'MEL-ANSWER-ROOT')) return;
      e.preventDefault(); e.stopImmediatePropagation();
      const el = e.composedPath()[0];
      if (!(el instanceof HTMLElement)) return;
      restore();
      if (mode === 'drag') {
        if (!source) { source = el.closest('[draggable=true]') || el; info.textContent = 'Bấm vị trí thả. (Esc để hủy)'; return; }
        if (source === el) { info.textContent = 'Chọn vị trí thả khác nguồn kéo.'; return; }
        const from = source; cleanup(); cancelPicker = null;
        setTimeout(() => {
          try {
            if (!from.isConnected || !el.isConnected) throw new Error('Trang đã thay đổi.');
            const transfer = new DataTransfer(); transfer.setData('text/plain',String(value));
            for (const [node,type] of [[from,'dragstart'],[el,'dragenter'],[el,'dragover'],[el,'drop'],[from,'dragend']]) {
              const r = node.getBoundingClientRect(); node.dispatchEvent(new DragEvent(type,{bubbles:true,cancelable:true,composed:true,dataTransfer:transfer,clientX:r.x+r.width/2,clientY:r.y+r.height/2}));
            }
            finish({ok:true,message:'Đã gửi thao tác kéo thả HTML5. Kiểm tra vị trí trên trang; nếu trang không nhận, kéo thủ công theo đáp án.'});
          } catch (error) { finish({ok:false,message:error.message}); }
        },0); return;
      }
      if (mode === 'pair') {
        const target = clickable(el);
        if (!target) {info.textContent = 'Chọn nút/lựa chọn của bài nối. (Esc để hủy)';return;}
        if (!source) { source = target; info.textContent = 'Bấm lựa chọn thứ hai để nối. (Esc để hủy)'; return; }
        const from = source; cleanup(); cancelPicker = null;
        setTimeout(() => { if (!from.isConnected || !target.isConnected) return finish({ok:false,message:'Trang đã đổi.'}); from.click(); target.click(); finish({ok:true,message:'Đã bấm hai lựa chọn. Kiểm tra cặp nối trên trang.'}); },0); return;
      }
      const labelTarget = el.closest('label')?.control;
      const target = field(el) ? el : labelTarget && field(labelTarget) ? labelTarget : clickable(el);
      if (!target || !enabled(target)) {info.textContent = 'Chọn ô nhập, danh sách hoặc nút đáp án của bài. (Esc để hủy)';return;}
      cleanup(); cancelPicker = null;
      const pickEpoch=operation,pickKey=signature();
      setTimeout(async () => {
        try {
          if (!target.isConnected) throw new Error('Trang đã thay đổi.');
          if (field(target)) {
            const letters=globalThis.MELLetters?.forInput(target);
            if(letters){await MELLetters.fill(letters,String(value),{setText,pause,valid:()=>operation===pickEpoch&&signature()===pickKey});finish({ok:true,message:'Đã điền từng ký tự còn thiếu trong từ; giữ nguyên chữ gợi ý. Kiểm tra lại trên trang.'});return;}
            if (target.tagName === 'SELECT') { const option = findOption([...target.options].filter(x => !x.disabled && !x.hidden),value); if (!option) throw new Error('Không có lựa chọn khớp duy nhất; chọn trực tiếp theo đáp án.'); setText(target,option.value); }
            else setText(target,String(value));
            await pause();
            if (target.tagName !== 'SELECT' && String(valueOf(target)) !== String(value)) throw new Error('Trang chưa nhận giá trị.');
            finish({ok:true,message:'Đã điền ô bạn chọn. Kiểm tra lại trên trang.'});
          } else {
            if (!(target.checked || target.getAttribute('aria-checked') === 'true' || target.getAttribute('aria-selected') === 'true')) target.click();
            finish({ok:true,message:'Đã chọn vị trí bạn chỉ định. Kiểm tra kết quả trên trang.'});
          }
        } catch (error) { finish({ok:false,message:error.message}); }
      },0);
    };
    const timer = setTimeout(() => finish({ok:false,message:'Hết thời gian chọn vị trí. Bấm lại để tiếp tục.'}),90000);
    document.addEventListener('pointermove',move,true); document.addEventListener('pointerdown',suppress,true); document.addEventListener('pointerup',suppress,true); document.addEventListener('click',click,true); document.addEventListener('keydown',key,true);
    cancelPicker = cleanup;
    return {started:true};
  }
  globalThis.MELPage = {crosswordFill,scan,diagnostic,apply,pick,stopPick,pageInfo,startSequence,sequenceFill,sequenceStatus};
})();
