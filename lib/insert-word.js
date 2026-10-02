/* Hover-revealed insertion fields. Only write at a verified sentence boundary. */
(() => {
  if(globalThis.MELInsertWord)return;
  const selector='.insertAWord .sentence',inputSelector='input:not([type]),input[type=text]';
  const words=v=>MELRules.words(v),visible=el=>Boolean(el?.isConnected&&el.getClientRects().length&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden');
  const enabled=el=>!el.disabled&&!el.readOnly&&!el.matches(':disabled')&&!el.closest('[inert],[aria-disabled=true]');
  const example=el=>Boolean(el.closest('.itemExample,.example,[data-example=true]'));
  const roots=()=>[...document.querySelectorAll(selector)].filter(visible);
  // Include the DOM position of hidden text fields, but never their value in diagnostics.
  function parts(root,target){
    let before='',after='',passed=false;
    const walk=node=>{
      if(node===target){passed=true;return;}
      if(node.nodeType===3){if(passed)after+=' '+node.nodeValue;else before+=' '+node.nodeValue;return;}
      if(node.nodeType!==1||node.matches('input,textarea,select,script,style,[contenteditable]'))return;
      for(const child of node.childNodes)walk(child);
    };walk(root);return {before,after};
  }
  function withoutCue(text,value){
    const match=text.match(/\(\s*([^()]*)\s*\)\s*$/);
    return match&&words(match[1])===words(value)?text.slice(0,match.index):null;
  }
  function specification(item){
    const value=String(item.answer?.[0]||'').trim(),prompt=withoutCue(String(item.prompt||''),value);
    if(!value||prompt===null)return null;
    const halves=prompt.split(/_{2,}/);if(halves.length!==2)return null;
    return {before:words(halves[0]),after:words(halves[1]),value};
  }
  function matches(root,spec){
    if(example(root)||!root.querySelector('.switcher[role=button]'))return false;
    const text=withoutCue(parts(root).before,spec.value);
    return text!==null&&words(text)===words(spec.before+' '+spec.after);
  }
  function atBoundary(root,el,spec){
    const p=parts(root,el),after=withoutCue(p.after,spec.value);
    return after!==null&&words(p.before)===spec.before&&words(after)===spec.after;
  }
  const fields=(root,spec)=>[...root.querySelectorAll(inputSelector)].filter(el=>enabled(el)&&atBoundary(root,el,spec));
  const occupiedElsewhere=(root,spec)=>[...root.querySelectorAll(inputSelector)].some(el=>el.value.trim()&&!atBoundary(root,el,spec));
  function hoverTargets(root,spec){
    return [...root.querySelectorAll('.switcher[role=button]')].filter(el=>visible(el)&&enabled(el)).flatMap(el=>{
      const p=parts(root,el),before=words(p.before),content=words(parts(el).before);
      if(before===spec.before)return [{el,edge:'left'}];
      if(words(before+' '+content)===spec.before)return [{el,edge:'right'}];
      return [];
    });
  }
  function hover({el,edge},enter){
    const r=el.getBoundingClientRect(),options={bubbles:true,view:window,clientX:edge==='left'?r.left+1:r.right-1,clientY:r.top+r.height/2};
    for(const type of enter?['pointerover','pointerenter','pointermove','mouseover','mouseenter','mousemove']:['pointerout','pointerleave','mouseout','mouseleave']){
      const EventType=type.startsWith('pointer')?PointerEvent:MouseEvent;
      el.dispatchEvent(new EventType(type,{...options,bubbles:!type.endsWith('enter')&&!type.endsWith('leave'),pointerType:'mouse'}));
    }
  }
  function plan(lesson,onlyN=''){
    const available=roots(),rows=[],unresolved=[];
    for(const item of lesson.items||[]){
      if(item.isExample||onlyN&&String(item.n)!==String(onlyN))continue;
      const spec=specification(item),found=spec?available.filter(root=>matches(root,spec)):[];
      if(found.length!==1){unresolved.push(String(item.n));continue;}
      rows.push({n:String(item.n),root:found[0],spec});
    }
    const duplicates=new Set(rows.filter(a=>rows.some(b=>b!==a&&a.root===b.root)).map(a=>a.root));
    return {rows:rows.filter(r=>!duplicates.has(r.root)),unresolved:[...unresolved,...rows.filter(r=>duplicates.has(r.root)).map(r=>r.n)]};
  }
  async function execute(lesson,onlyN,{setText,pause,valid}){
    const p=plan(lesson,onlyN);let done=0,skipped=0;
    const result=error=>({kind:'insert-word',done,skipped,unresolved:p.unresolved,error,verification:'dom-only'});
    for(const {root,spec,n} of p.rows){
      if(!valid()||!root.isConnected||!matches(root,spec))return result('Trang hoặc câu đã đổi. Đã dừng chèn từ.');
      let candidates=fields(root,spec);
      if(candidates.length>1)return result('Có nhiều ô tại cùng vị trí. Chưa điền câu '+n+'.');
      if(occupiedElsewhere(root,spec))return result('Câu '+n+' đã có từ ở vị trí khác. Giữ nguyên để bạn kiểm tra.');
      if(candidates.length===1&&candidates[0].value===spec.value){skipped++;continue;}
      if(candidates.some(el=>el.value.trim()))return result('Ô chèn từ đã có nội dung khác ở câu '+n+'. Xóa hoặc sửa ô đó trước.');
      let target=candidates.find(visible),active=null;
      try{
        if(!target){
          // Hover both sides of the intended gap if needed; never click a guessed word.
          for(const candidate of hoverTargets(root,spec)){
            if(!valid())return result('Đã dừng chèn từ.');
            active=candidate;hover(candidate,true);await pause();
            if(!valid()||!root.isConnected||!matches(root,spec))return result('Trang hoặc câu đã đổi khi hiện ô nhập.');
            candidates=fields(root,spec);
            if(candidates.length>1)return result('Vị trí ô nhập không duy nhất ở câu '+n+'.');
            target=candidates.find(visible);if(target)break;
            hover(candidate,false);active=null;
          }
        }
        if(!target)return result('Chưa hiện được ô nhập đúng vị trí ở câu '+n+'. Rê chuột vào khoảng trống để hiện ô rồi bấm lại; nếu vẫn lỗi, xuất chẩn đoán.');
        if(!enabled(target)||target.value.trim()||occupiedElsewhere(root,spec))return result('Ô nhập đã đổi ở câu '+n+'. Chưa ghi đè nội dung.');
        setText(target,spec.value);await pause();
        if(active?.el.isConnected){hover(active,false);active=null;await pause();}
        if(!valid()||!root.isConnected||!matches(root,spec))return result('Trang hoặc câu đã đổi sau khi nhập.');
        candidates=fields(root,spec);
        if(candidates.length!==1||candidates[0].value!==spec.value||occupiedElsewhere(root,spec))return result('Trang chưa giữ từ tại đúng vị trí ở câu '+n+'. Chưa tính là hoàn thành.');
        done++;
      }catch(error){return result(error.message);}finally{if(active?.el.isConnected)hover(active,false);}
    }
    return result(p.unresolved.length?'Chưa ghép chắc chắn câu '+p.unresolved.join(', ')+'.':undefined);
  }
  function diagnostic(){return roots().slice(0,30).map(root=>({
    context:parts(root).before.trim().slice(0,1600),isExample:example(root),
    fields:[...root.querySelectorAll(inputSelector)].slice(0,50).map(el=>({
      tag:el.tagName,type:el.type,classes:String(el.className),visible:visible(el),enabled:enabled(el),maxLength:el.maxLength,
      before:parts(root,el).before.trim().slice(-700),after:parts(root,el).after.trim().slice(0,700)
    })),switchers:[...root.querySelectorAll('.switcher')].slice(0,50).map(el=>({text:parts(el).before.trim().slice(0,120),role:el.getAttribute('role'),tabIndex:el.tabIndex}))
  }));}
  globalThis.MELInsertWord={present:()=>roots().some(root=>!example(root)&&root.querySelector('.switcher[role=button]')),execute,diagnostic};
})();
