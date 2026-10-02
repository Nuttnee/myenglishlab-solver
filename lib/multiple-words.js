/* Independent pressed tokens in prose. Match exact answer and surrounding sentence. */
(() => {
  if(globalThis.MELMultipleWords)return;
  const selector='.underlineGroup.multiple > .underlineElement[role=button][aria-pressed]';
  const visible=el=>Boolean(el?.isConnected&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'&&getComputedStyle(el).display!=='none');
  const enabled=el=>!el.closest('.example,.itemExample,[data-example=true],[inert],[aria-disabled=true]');
  const words=v=>MELRules.words(v),pressed=el=>el.getAttribute('aria-pressed')==='true';
  function groups(){return [...document.querySelectorAll('.underlineGroup.multiple')].filter(root=>visible(root)&&enabled(root)).map(root=>({root,options:[...root.children].filter(el=>el.matches('.underlineElement'))})).filter(g=>g.options.length&&g.options.every(el=>el.matches(selector)&&visible(el)&&enabled(el)&&['true','false'].includes(el.getAttribute('aria-pressed'))));}
  function around(el,root){
    let before='',after='',found=false;
    for(const p of MELContext.pieces(root)){
      if(el.contains(p.node)){found=true;continue;}
      if(found)after+=' '+p.value;else before+=' '+p.value;
    }
    return {before:words(before),after:words(after)};
  }
  function fits(el,item,root){
    // A slash-separated alternative question is not evidence for independent selections.
    if(/\s\/\s/.test(MELRules.prompt(item.prompt)))return false;
    const answer=words(item.answer?.[0]),prompt=words(MELRules.prompt(item.prompt));
    if(!answer||words(MELContext.text(el))!==answer||prompt.split(' ').length<5)return false;
    const parts=(' '+prompt+' ').split(' '+answer+' ');
    if(parts.length!==2)return false;
    const before=parts[0].trim(),after=parts[1].trim(),context=around(el,root);
    return (!before||(' '+context.before).endsWith(' '+before))&&(!after||(context.after+' ').startsWith(after+' '));
  }
  function plan(lesson,onlyN=''){
    const available=groups(),allItems=(lesson.items||[]).filter(i=>!i.isExample&&i.answer?.length),rows=[],unresolved=[];
    for(const item of allItems){
      const found=available.flatMap(g=>g.options.filter(el=>fits(el,item,g.root.closest('.itemContent')||g.root)).map(el=>({el,g})));
      if(found.length!==1){if(!onlyN||String(item.n)===String(onlyN))unresolved.push(String(item.n));continue;}
      rows.push({n:String(item.n),...found[0]});
    }
    const duplicate=new Set(rows.filter(a=>rows.some(b=>b!==a&&a.el===b.el)).map(a=>a.el));
    const unique=rows.filter(r=>!duplicate.has(r.el));
    for(const row of rows.filter(r=>duplicate.has(r.el)))if(!onlyN||row.n===String(onlyN))unresolved.push(row.n);
    return {available,rows:unique.filter(r=>!onlyN||r.n===String(onlyN)),wanted:new Set(unique.map(r=>r.el)),unresolved};
  }
  async function execute(lesson,onlyN,{pause,valid}){
    const p=plan(lesson,onlyN);let done=0,skipped=0;
    const extra=p.available.flatMap(g=>g.options).filter(el=>pressed(el)&&!p.wanted.has(el));
    const result=error=>({kind:'multiple-words',done,skipped,unresolved:p.unresolved,error,verification:'dom-only'});
    // Do not silently erase user selections or report an already-wrong set as complete.
    if(extra.length)return result('Có từ khác đang được chọn: '+extra.map(el=>MELContext.text(el)).join(', ')+'. Giữ nguyên để bạn kiểm tra và bỏ chọn nếu cần.');
    const snapshots=new Map(p.available.map(g=>[g,{context:MELContext.text(g.root.closest('.itemContent')||g.root),labels:g.options.map(el=>MELContext.text(el)),states:g.options.map(pressed)}]));
    for(const {el,g} of p.rows){
      const saved=snapshots.get(g),currentGroup=()=>groups().find(x=>x.root===g.root);
      const intact=()=>{
        const now=currentGroup();return now&&now.options.length===g.options.length&&now.options.every((x,i)=>x===g.options[i]&&MELContext.text(x)===saved.labels[i])&&MELContext.text(g.root.closest('.itemContent')||g.root)===saved.context;
      };
      if(!valid()||!intact()||g.options.some((x,i)=>pressed(x)!==saved.states[i]))return result('Trang hoặc lựa chọn đã đổi. Đã dừng chọn từ.');
      if(pressed(el)){skipped++;continue;}
      el.click();await pause();
      if(!valid()||!intact()||!pressed(el))return result('Trang chưa nhận từ đã chọn. Chưa tính là hoàn thành.');
      if(g.options.some((x,i)=>x!==el&&pressed(x)!==saved.states[i]))return result('Lựa chọn khác bị thay đổi khi bấm từ. Đã dừng để bạn kiểm tra.');
      saved.states=g.options.map(pressed);done++;
    }
    return result(p.unresolved.length?'Chưa ghép chắc chắn câu '+p.unresolved.join(', ')+'.':undefined);
  }
  globalThis.MELMultipleWords={present:()=>groups().length>0,execute};
})();
