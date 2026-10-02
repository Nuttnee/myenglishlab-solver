/* Runs in the page's MAIN world. Uses the page's actual drag handlers; never writes answers into DOM. */
(() => {
  const VERSION = '1.10.3';
  if (globalThis.MELAutoDrag?.version === VERSION) return;
  const TARGET = '.drop,.droppable,.ui-droppable,[dropzone],[droppable],[data-droppable],[data-drop-zone],[data-drop-target],[data-drop-id],[data-dnd-target],.dropTarget,.drop-target,.dropZone,.drop-zone,.dropzone,.drop-area,.dropArea,[class*="droppable"],[class*="dropzone"],[class*="DropTarget"],[class*="drop-target"],[class*="drop-area"],[aria-dropeffect]:not([aria-dropeffect="none"]),[aria-label*="droppable"],[aria-label*="drop target"]';
  const CONTAINER = '.droppableWrapper,.wordpoolWrapper,.word-bank,.wordBank,.wordbank,[data-word-bank]';
  const SOURCE = '[draggable="true"],.ui-draggable,[data-draggable],[class*="dragItem"],[class*="drag-item"],[class*="draggable"],[class*="dragSource"],[class*="drag-source"],[aria-grabbed]';
  const PLACEHOLDER = /^(?:drag (?:an? )?item here|drag here|drop (?:an? )?item here|drop here|drag and drop here|kéo (?:và thả )?vào đây|thả vào đây)$/i;
  const norm = s => String(s ?? '').normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/[^\p{L}\p{N}']+/gu,' ').trim().replace(/\s+/g,' ');
  const wait = ms => new Promise(r => setTimeout(r,ms));
  const visible = el => el?.isConnected && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none';
  const usable = el => visible(el) && !el.matches(':disabled') && el.getAttribute('aria-disabled') !== 'true' && !el.closest('[inert],mel-answer-root');
  const text = el => String(el?.innerText || el?.textContent || '').trim();
  function all(selector, root = document) {
    const result = [...root.querySelectorAll(selector)];
    for (const node of root.querySelectorAll('*')) if (node.shadowRoot && node.tagName !== 'MEL-ANSWER-ROOT') result.push(...all(selector,node.shadowRoot));
    return [...new Set(result)];
  }
  const imageLabels = el => [...el.querySelectorAll('img')].map(x => x.alt || x.title || '').filter(Boolean);
  const names = el => [...new Set([text(el),el.getAttribute('aria-label'),el.getAttribute('data-answer'),el.getAttribute('alt'),el.getAttribute('title'),...imageLabels(el)].filter(Boolean).map(norm))];
  const spelling = s => String(s ?? '').normalize('NFKC').replace(/[’‘]/g,"'").replace(/[^\p{L}\p{N}']+/gu,' ').trim().replace(/\s+/g,' ');
  const answerMatches = (el,value) => norm(text(el))===norm(value)&&!el.querySelector('img') ? spelling(text(el))===spelling(value) : names(el).includes(norm(value));
  const isBlank = el => { const t = norm(text(el)); return !t || PLACEHOLDER.test(t) || /^[_\s.\-]+$/.test(text(el)); };
  const knownTargets=new Set(), targetHints=new Set();
  const slot = el => visible(el) && !el.matches(CONTAINER) && !el.closest('.wordpoolWrapper,.word-bank,.wordBank,.wordbank,[data-word-bank]') && !el.matches('[draggable="true"],.drag,[aria-grabbed]');
  function targets() {
    let found = [...all(TARGET),...knownTargets].filter(slot);
    // Pearson's older player exposes the literal placeholder inside the target wrapper.
    for (const node of all('span,div,button,a,td')) {
      if (!visible(node) || !PLACEHOLDER.test(norm(text(node))) || [...node.children].some(c => PLACEHOLDER.test(norm(text(c))))) continue;
      let wrapper=node.closest(TARGET) || node.closest('[class*="gap"],[class*="blank"],[class*="slot"]') || node;
      if(!slot(wrapper))wrapper=node;
      while(wrapper===node || !wrapper.classList.length) {
        const parent=wrapper.parentElement,r=parent?.getBoundingClientRect();
        if(!parent || !slot(parent) || !PLACEHOLDER.test(norm(text(parent))) || r.width>280 || r.height>180)break;
        wrapper=parent;
        if(wrapper.classList.length)break;
      }
      knownTargets.add(wrapper);found.push(wrapper);
      for(const c of wrapper.classList)if(/drop|gap|blank|slot|target|answer|response/i.test(c) && !/empty|active|hover|selected|focus/i.test(c))targetHints.add(wrapper.tagName.toLowerCase()+'.'+CSS.escape(c));
    }
    // Keep the same slot after its placeholder is replaced, and recognize already filled siblings.
    for(const selector of targetHints)for(const el of all(selector)){
      const r=el.getBoundingClientRect();if(slot(el)&&r.width<=280&&r.height<=180)found.push(el);
    }
    // Word banks may themselves be droppable (return a word). They are not answer slots.
    found=found.filter(el=>slot(el) && !(el.querySelectorAll(SOURCE).length>1 && !el.getAttribute('aria-label') && !el.getAttribute('data-category') && !el.querySelector('h2,h3,h4,legend,[role=heading]') && !PLACEHOLDER.test(norm(text(el)))));
    // A broad class match must never swallow all the actual slots inside an exercise wrapper.
    found = [...new Set(found)].filter(el => !found.some(other => other !== el && el.contains(other)));
    return found.sort((a,b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1);
  }
  const entries=lesson=>MELRules.rows(lesson);
  function score(row,target,ctx) {
    if(row.dialogue&&ctx.dialogue&&row.dialogue!==ctx.dialogue)return 0;
    const evidence=MELRules.evidence(row,{kind:'drop',...ctx});
    if(evidence.score>=12)return evidence.score;
    const number = target.getAttribute('data-question-number') || target.getAttribute('data-item-number') || target.getAttribute('data-answer-number');
    if (number && norm(number) === norm(row.n)) return 50;
    const split = row.prompt.split(/_{2,}|\[(?:blank|gap)\]/gi);
    if (split.length > 1) {
      const part = Math.min(row.part,split.length-2);
      const left = norm(split[part]).split(' ').filter(Boolean).slice(-9);
      const right = norm(split[part+1]).split(' ').filter(Boolean).slice(0,9);
      let a=0,b=0;
      for(let n=1;n<=left.length;n++) if(ctx.before.endsWith(left.slice(-n).join(' ')))a=n;
      for(let n=1;n<=right.length;n++) if(ctx.after.startsWith(right.slice(0,n).join(' ')))b=n;
      return a+b >= 4 || a >= 3 || b >= 3 ? a+b : 0;
    }
    const prompt=norm(row.prompt.replace(/^picture\s*:\s*/i,''));
    const nearby=target.closest('figure,li,td,[data-question]') || target.parentElement;
    if (prompt.length > 8 && names(nearby || target).some(s => s===prompt)) return 30;
    return 0;
  }
  function itemSource(value,drops) {
    let found=all(SOURCE).filter(el=>usable(el) && !drops.some(d=>d===el || d.contains(el)) && answerMatches(el,value));
    // Text tokens in keyboard-enabled word banks sometimes omit draggable=true.
    if (!found.length) found=all('button,span,a,[role=button],[tabindex]').filter(el=>usable(el) && !drops.some(d=>d===el || d.contains(el)) && answerMatches(el,value) && (el.closest('[class*="wordbank"],[class*="wordBank"],[class*="word-bank"],[class*="drag"],[class*="Drag"],[class*="bank"],[class*="Bank"]')));
    found=found.filter(el=>!found.some(other=>other!==el && other.contains(el) && other.matches(SOURCE)));
    if(found.length>1){const exact=found.filter(el=>text(el)===String(value).trim());if(exact.length)found=exact;}
    const bank=found[0]?.closest('.wordpoolWrapper,.word-bank,.wordBank,.wordbank,[data-word-bank]');
    if(found.length>1 && bank && found.every(el=>(el.draggable||el.matches('.ui-draggable'))&&!el.querySelector('img')&&el.closest('.wordpoolWrapper,.word-bank,.wordBank,.wordbank,[data-word-bank]')===bank&&text(el)===text(found[0])))return found[0];
    return found.length===1 ? found[0] : null;
  }
  function responseSeries(lesson,rows,drops,sentences=false) {
    // Shared response-series mapping for picture labels and sentences with explicit destination ranks.
    // Require a complete response series, an associated word bank, and matching fixed examples.
    // Source token data-id suffixes are NOT answer keys and never determine the answer.
    if((!sentences&&!['matching','drag_image'].includes(lesson.type))||rows.length<2||rows.length>26||
       rows.some(r=>r.parts!==1||(!sentences&&!/^Picture\b/i.test(r.prompt)))||
       (!sentences&&rows.some((r,i)=>r.n!==String.fromCharCode(65+i)))||!rows.some(r=>r.example)||
       new Set(rows.map(r=>norm(r.value))).size!==rows.length)return [];
    const candidates=[];
    for(const wrapper of all('.droppableWrapper').filter(visible)){
      const local=drops.filter(d=>d.closest('.droppableWrapper')===wrapper);
      if(local.length!==rows.length)continue;
      const parts=local.map(d=>({target:d,match:d.id.match(/^(.+)RESPONSE_(\d+)$/)}));
      if(parts.some(p=>!p.match)||new Set(parts.map(p=>p.match[1])).size!==1)continue;
      const prefix=parts[0].match[1];
      const ordered=parts.slice().sort((a,b)=>Number(a.match[2])-Number(b.match[2]));
      if(ordered.some((p,i)=>Number(p.match[2])!==i+1)||ordered.some(p=>all('[id]').filter(el=>el.id===p.target.id).length!==1))continue;
      const banks=all('.wordpoolWrapper').filter(b=>visible(b)&&b.id==='wordpoolWrapper'+prefix);
      if(banks.length!==1)continue;
      const bank=banks[0],pool=all('.drag',bank);
      if(!pool.length||pool.some(t=>!String(t.getAttribute('data-id')||'').startsWith(prefix+'--drag_and_drop--')))continue;
      const available=[...pool,...ordered.flatMap(p=>all('.drag',p.target))];
      const values=[...new Set(available.map(t=>norm(text(t))))].sort();
      if(JSON.stringify(values)!==JSON.stringify(rows.map(r=>norm(r.value)).sort()))continue;
      if(ordered.some((p,i)=>{
        const fixed=!!p.target.closest('.example,[data-example=true]');
        return fixed!==rows[i].example || (fixed&&!names(p.target).includes(norm(rows[i].value)));
      }))continue;
      const pairs=ordered.map((p,i)=>({row:rows[i],target:p.target,index:drops.indexOf(p.target),score:40,reason:sentences?'sentence-rank-response-series':'picture-response-series-with-fixed-example'}));
      // A visible conflicting label is stronger evidence than an ordinal assumption.
      if(pairs.some(p=>{const n=MELContext.describe(p.target,drops).questionNumber;return n&&(sentences?n!==String(p.row.rank):norm(n)!==norm(p.row.n)&&n!==String(p.row.index+1));} ))continue;
      candidates.push(pairs);
    }
    return candidates.length===1?candidates[0]:[];
  }
  function analyze(lesson) {
    const drops=targets(), originalRows=entries(lesson), mapped=[], used=new Set();
    // A numeric answer on an ordering lesson denotes the sentence's destination rank.
    // It is not a draggable token and must never be split into words by the word-order adapter.
    const rankedSentences=lesson.type==='ordering'&&originalRows.length>=2&&originalRows.every(r=>r.parts===1&&/^\d+$/.test(r.value)&&norm(r.prompt).split(' ').length>=3);
    const orderedRows=rankedSentences?originalRows.map(r=>({...r,rank:Number(r.value),value:r.prompt})).sort((a,b)=>a.rank-b.rank):[];
    const validRanks=rankedSentences&&orderedRows.every((r,i)=>r.rank===i+1);
    const sentencePairs=validRanks?responseSeries(lesson,orderedRows,drops,true):[];
    const rows=sentencePairs.length?orderedRows:originalRows;
    const evidence=drops.map(target=>{const ctx=MELContext.describe(target,drops);return rows.map(row=>rankedSentences?0:score(row,target,ctx));});
    for (let index=0;index<drops.length;index++) {
      const target=drops[index];
      const ranked=rows.map((row,i)=>({row,ri:i,score:evidence[index][i]})).sort((a,b)=>b.score-a.score);
      const best=ranked[0];
      if(best){const rivals=evidence.map((scores,i)=>({i,score:scores[best.ri]})).sort((a,b)=>b.score-a.score);if(rivals[0]?.i!==index || (rivals[1]&&rivals[0].score-rivals[1].score<2))continue;}
      if (best && best.score>=3 && (!ranked[1] || best.score-ranked[1].score>=2) && !used.has(best.row.key)) {mapped.push({row:best.row,target,index,score:best.score});used.add(best.row.key);}
    }
    const picturePairs=sentencePairs.length?sentencePairs:responseSeries(lesson,rows,drops);
    if(picturePairs.length&&mapped.every(m=>picturePairs.some(p=>p.target===m.target&&p.row.key===m.row.key))){
      for(const p of picturePairs)if(!used.has(p.row.key)){mapped.push(p);used.add(p.row.key);}
    }
    // Fill holes in an already anchored complete target list, never align only the empty gaps.
    for (const list of [rows,rows.filter(r=>!r.example)]) {
      if (drops.length!==list.length || mapped.length<2 || !mapped.every(m=>list[m.index]?.key===m.row.key)) continue;
      drops.forEach((target,index)=>{if(!mapped.some(m=>m.index===index)){if(index<=Math.min(...mapped.map(m=>m.index))||index>=Math.max(...mapped.map(m=>m.index)))return;const row=list[index];mapped.push({row,target,index,score:2});used.add(row.key);}});
      break;
    }
    const jobs=[],skipped=[],unresolved=[];
    for(const row of rows.filter(r=>!r.example)) {
      const m=mapped.find(m=>m.row.key===row.key);
      if(!m){
        // Category exercises reverse the direction: drag the question word to its answer category.
        const categories=drops.filter(d=>[d.getAttribute('aria-label'),d.getAttribute('data-category'),d.querySelector('h2,h3,h4,legend,[role=heading]')?.textContent].filter(Boolean).some(t=>norm(t)===norm(row.value)));
        const word=MELRules.prompt(row.prompt).trim(),target=categories.length===1?categories[0]:null;
        if(target && word){
          const already=[...target.querySelectorAll(SOURCE)].some(el=>names(el).includes(norm(word)));
          if(already){skipped.push(row.key);mapped.push({row,target,index:drops.indexOf(target),score:50,category:true});continue;}
          const source=itemSource(word,drops);
          if(source){const job={row,target,index:drops.indexOf(target),score:50,category:true,source};mapped.push(job);jobs.push(job);continue;}
        }
        unresolved.push({n:row.n,value:row.value,reason:'Chưa ghép chắc chắn với câu trên trang.'});continue;
      }
      if(answerMatches(m.target,row.value)){skipped.push(row.key);continue;}
      if(!usable(m.target)){unresolved.push({n:row.n,value:row.value,reason:'Ô bị khóa hoặc chưa hiển thị.'});continue;}
      if(!isBlank(m.target)){unresolved.push({n:row.n,value:row.value,reason:'Ô đã có đáp án khác; giữ nguyên để tránh mất bài đang làm.'});continue;}
      const source=itemSource(row.value,drops);
      if(!source){unresolved.push({n:row.n,value:row.value,reason:'Không thấy duy nhất một từ/hình nguồn khớp đáp án.'});continue;}
      jobs.push({...m,source});
    }
    return {drops,rows,mapped,jobs,skipped,unresolved};
  }
  function safeURL() {return `${location.origin}${location.pathname}`;}
  function reportURL(){return location.origin+location.pathname.replace(/(\/activit(?:y|ies)\/)[^/]+/i,'$1[activity]');}
  function diagnostic(lesson) {
    const a=analyze(lesson);
    const describe=el=>({tabIndex:el.tabIndex,tag:el.tagName,id:el.id,classes:String(el.className || ''),text:MELContext.text(el).slice(0,180),labels:names(el),attributes:Object.fromEntries([...el.attributes].filter(a=>/^aria-|^data-|^draggable$|^role$/.test(a.name)).map(a=>[a.name,a.value.slice(0,160)]))});
    const structure=all('.droppableWrapper,.wordpoolWrapper').slice(0,6).map(el=>({container:describe(el),children:[...el.querySelectorAll('*')].filter(n=>!n.matches('script,style')&&visible(n)).slice(0,180).map(n=>({...describe(n),parentClass:String(n.parentElement?.className || ''),tabIndex:n.tabIndex,before:getComputedStyle(n,'::before').content,after:getComputedStyle(n,'::after').content}))}));
    return {version:VERSION,url:reportURL(),lessonId:lesson.id,targets:a.drops.map((d,i)=>({...describe(d),index:i,context:(({context,questionNumber,slot,slotCount})=>({context,questionNumber,slot,slotCount}))(MELContext.describe(d,a.drops))})),sources:all(SOURCE).filter(visible).slice(0,80).map(describe),structure,mapped:a.mapped.map(m=>({n:m.row.n,index:m.index,score:m.score,reason:m.reason||'local-context'})),ready:a.jobs.map(m=>({n:m.row.n,value:m.row.value})),skipped:a.skipped,unresolved:a.unresolved,engine:{jquery:Boolean(globalThis.jQuery),jqueryUI:Boolean(globalThis.jQuery?.ui),pointer:Boolean(globalThis.PointerEvent)}};
  }
  const mouse = (node,type,p,down) => node.dispatchEvent(new MouseEvent(type,{bubbles:true,cancelable:true,composed:true,view:window,clientX:p.x,clientY:p.y,button:0,buttons:down?1:0}));
  const point = el => {const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};};
  async function mouseDrag(source,target,pointer=false) {
    source.scrollIntoView({block:'center',inline:'nearest'}); await wait(30);
    const from=point(source);
    const pointerEvent = (node,type,p,down) => node.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,composed:true,view:window,clientX:p.x,clientY:p.y,button:0,buttons:down?1:0,pointerId:1,pointerType:'mouse',isPrimary:true}));
    const fire = pointer ? pointerEvent : mouse;
    const prefix = pointer?'pointer':'mouse';
    fire(source,prefix+'over',from,false);fire(source,prefix+'move',from,false);fire(source,prefix+'down',from,true);
    try {
      fire(document,prefix+'move',{x:from.x+8,y:from.y+5},true);await wait(30);
      target.scrollIntoView({block:'center',inline:'nearest'});await wait(30);
      const to=point(target);
      for(let i=1;i<=12;i++){
        const p={x:from.x+(to.x-from.x)*i/12,y:from.y+(to.y-from.y)*i/12};
        const hit=document.elementFromPoint(p.x,p.y) || target;fire(hit,prefix+'move',p,true);await wait(12);
      }
      fire(target,prefix+'move',to,true);fire(target,prefix+'up',to,false);
    } finally {fire(document,prefix+'up',point(target),false);}
  }
  async function htmlDrag(source,target,value) {
    source.scrollIntoView({block:'center',inline:'nearest'});await wait(25);
    const transfer=new DataTransfer();transfer.setData('text/plain',value);
    for(const [node,type] of [[source,'dragstart'],[target,'dragenter'],[target,'dragover'],[target,'drop'],[source,'dragend']]){
      if(type==='dragenter')target.scrollIntoView({block:'center',inline:'nearest'});
      const p=point(node);node.dispatchEvent(new DragEvent(type,{bubbles:true,cancelable:true,composed:true,clientX:p.x,clientY:p.y,dataTransfer:transfer}));await wait(30);
    }
  }
  async function keyboardDrag(source,target) {
    // Pearson's instructions explicitly support Space to pick an option and Space to drop it.
    const space=el=>{el.dispatchEvent(new KeyboardEvent('keydown',{key:' ',code:'Space',keyCode:32,which:32,bubbles:true,cancelable:true,composed:true}));el.dispatchEvent(new KeyboardEvent('keyup',{key:' ',code:'Space',keyCode:32,which:32,bubbles:true,cancelable:true,composed:true}));};
    const oldTabIndex=target.getAttribute('tabindex');
    try{
      source.scrollIntoView({block:'center'});source.focus();if(document.activeElement!==source)return;
      space(source);await wait(70);
      target.scrollIntoView({block:'center'});
      if(oldTabIndex===null)target.setAttribute('tabindex','-1');
      target.focus();if(document.activeElement!==target)return;
      space(target);await wait(70);
    }finally{if(oldTabIndex===null)target.removeAttribute('tabindex');}
  }
  function pageKey() {
    const labels=all('h1,h2,h3,[role=heading],[class*=title],[class*=Title]').filter(visible).map(text).filter(t=>t.length<100 && /exercise|\b\d{1,2}\.\d{1,2}\b/i.test(t));
    return safeURL()+'|'+labels.join('|');
  }
  async function accepted(lesson,key,value,job) {
    await wait(300);
    const target=job.target.isConnected?job.target:job.target.id?document.getElementById(job.target.id):null;
    if(target){
      if(job.category && [...target.querySelectorAll(SOURCE)].some(el=>el===job.source || names(el).includes(norm(MELRules.prompt(job.row.prompt)))))return true;
      if(!job.category && answerMatches(target,value))return true;
    }
    await wait(160);
    const matches=analyze(lesson).mapped.filter(m=>m.row.key===key);
    return matches.length===1 && (matches[0].category ? [...matches[0].target.querySelectorAll(SOURCE)].some(el=>names(el).includes(norm(MELRules.prompt(matches[0].row.prompt)))) : answerMatches(matches[0].target,value));
  }
  let busy=false,cancelled=false;
  async function execute(lesson,onlyN='') {
    if(busy)throw new Error('Đang tự kéo thả. Chờ hoàn tất hoặc bấm Dừng.');
    busy=true;cancelled=false;
    const originalScroll={x:scrollX,y:scrollY},key=pageKey();
    let done=0;const completed=[],failures=[];
    try {
      const start=analyze(lesson);
      const selected=start.rows.filter(r=>!r.example && (!onlyN || r.n===String(onlyN)));
      if(!start.drops.length)return {done:0,skipped:0,total:selected.length,error:'Chưa nhận diện được ô kéo thả của trang này. Bấm “Xuất chẩn đoán kéo thả” để lấy thông tin widget.'};
      for(const row of selected) {
        if(cancelled)break;
        if(pageKey()!==key){failures.push({n:row.n,reason:'Trang/bài đã đổi; đã dừng.'});break;}
        const a=analyze(lesson);
        if(a.skipped.includes(row.key))continue;
        let job=a.jobs.find(j=>j.row.key===row.key);
        if(!job){failures.push(a.unresolved.find(x=>x.n===row.n) || {n:row.n,reason:'Không ghép được ô.'});continue;}
        // The movable wordpool is ui-draggable, but its individual words use their own HTML5 handlers.
        const isMouse=Boolean(job.source.matches('.ui-draggable') || globalThis.jQuery?.data?.(job.source,'ui-draggable') || globalThis.jQuery?.data?.(job.source,'draggable'));
        const engines=isMouse?['mouse']:job.source.draggable?['html']:[];
        if(job.source.matches('[role="option"]') && job.source.closest('.wordpoolWrapper') && job.target.closest('.droppableWrapper') && job.source.tabIndex>=0 && (job.target.tabIndex>=0||job.target.matches('.drop[role="region"][aria-label="Drop items here"]')))engines.push('keyboard');
        let success=false;
        for(const engine of engines) {
          if(cancelled || pageKey()!==key)break;
          // Re-scan after every attempt: frameworks may replace source/target nodes.
          job=analyze(lesson).jobs.find(j=>j.row.key===row.key);if(!job)break;
          const beforeDOM=job.target.outerHTML+job.source.outerHTML;
          try {
            if(engine==='html')await htmlDrag(job.source,job.target,row.value);
            else if(engine==='keyboard')await keyboardDrag(job.source,job.target);
            else await mouseDrag(job.source,job.target,engine==='pointer');
            if(await accepted(lesson,row.key,row.value,job)){success=true;break;}
            if(beforeDOM!==job.target.outerHTML+job.source.outerHTML)break;
          } catch(error) { failures.push({n:row.n,engine,reason:error.message});break; }
        }
        if(success){done++;completed.push(row.n);}
        else {failures.push({n:row.n,reason:'Trang chưa nhận thao tác tự kéo thả; không tính là đã điền.'});break;}
      }
      const end=analyze(lesson);
      const remaining=selected.filter(r=>!end.skipped.includes(r.key)).length;
      return {done,skipped:Math.max(0,selected.length-remaining-done),total:selected.length,remaining,completed,failures,cancelled,verification:'dom-only',error:cancelled?'Đã dừng tự kéo thả.':remaining?`${remaining} ô chưa hoàn tất. ${failures[0]?.reason || 'Xuất chẩn đoán để kiểm tra cấu trúc trang.'}`:''};
    } finally {busy=false;window.scrollTo(originalScroll.x,originalScroll.y);}
  }
  globalThis.MELAutoDrag={version:VERSION,analyze:lesson=>{const a=analyze(lesson);return {sources:all(SOURCE).filter(usable).length,targets:a.drops.length,matched:a.mapped.length,ready:a.jobs.length,skipped:a.skipped.length,unresolved:a.unresolved};},execute,diagnostic,cancel:()=>{cancelled=true;}};
})();
