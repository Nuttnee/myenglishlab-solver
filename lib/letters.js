/* A word made of single-character cells, including immutable clue letters. */
(() => {
  const visible=el=>el?.isConnected&&el.getClientRects().length&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden';
  const input=el=>el.matches('input:not([type]),input[type=text],textarea,[contenteditable=true],[contenteditable=plaintext-only]');
  const editable=el=>input(el)&&!el.disabled&&!el.matches(':disabled')&&!el.readOnly&&el.getAttribute('aria-disabled')!=='true'&&el.getAttribute('aria-readonly')!=='true'&&!el.closest('[inert]');
  const value=el=>input(el)?(el.isContentEditable?el.textContent:el.value):el.textContent;
  const small=el=>{const r=el.getBoundingClientRect();return r.width>=8&&r.width<=44&&r.height>=8&&r.height<=52&&r.width<=r.height*1.9;};
  function candidate(el){return visible(el)&&input(el)&&(el.maxLength===1||el.getAttribute('size')==='1'||(!(el.maxLength>1)&&small(el)));}
  function cell(el){
    if(!visible(el)||el.closest('mel-answer-root,#mel-pick-tip,[hidden],[aria-hidden=true],script,style'))return null;
    if(input(el)){
      if(!candidate(el))return null;
      if(editable(el))return {el,editable:true,fixed:null};
      const fixed=String(value(el)).replace(/\u00a0/g,' ');
      return [...fixed].length===1?{el,editable:false,fixed}:null;
    }
    // Fixed clues can be spans/divs rather than readonly inputs. Require a visible cell box.
    if(el.children.length||!small(el)||el.matches('button,a,label'))return null;
    const fixed=el.textContent.replace(/\u00a0/g,' '),style=getComputedStyle(el);
    if([...fixed].length!==1||!/[\p{L}\p{N}\s'’-]/u.test(fixed))return null;
    if(style.backgroundColor==='rgba(0, 0, 0, 0)'&&parseFloat(style.borderTopWidth)===0&&!el.matches('[aria-readonly=true],[data-letter]'))return null;
    return {el,editable:false,fixed};
  }
  function runs(root){
    const out=[];let active=[];
    const end=()=>{if(active.length)out.push(active);active=[];};
    const walk=node=>{
      if(node.nodeType===3){if(node.textContent.trim())end();return;}
      if(node.nodeType!==1||!visible(node))return;
      const c=cell(node);if(c){active.push(c);return;}
      if(node.matches('input,select,textarea,button,br,script,style,mel-answer-root,[contenteditable]')){end();return;}
      for(const child of node.childNodes)walk(child);
    };
    for(const node of root.childNodes)walk(node);end();return out;
  }
  function forInput(el){
    if(!candidate(el)||!editable(el))return null;
    let depth=0;
    for(let root=el.parentElement;root&&!root.matches('body,html,main,form')&&depth++<6;root=root.parentElement){
      const cells=runs(root).find(list=>list.some(c=>c.el===el));
      if(cells?.length>=2&&cells.length<=60){
        // Multiple ordinary short inputs do not by themselves establish a letter exercise.
        if(!cells.some(c=>!c.editable)&&!cells.every(c=>c.el.maxLength===1))continue;
        return {root,cells};
      }
    }
    return null;
  }
  const pattern=g=>g.cells.map(c=>c.editable?null:c.fixed);
  const state=g=>g.cells.map(c=>String(value(c.el)));
  function intact(g){return g.cells.every(c=>visible(c.el)&&g.root.contains(c.el)&&editable(c.el)===c.editable&&(c.editable||String(value(c.el)).replace(/\u00a0/g,' ')===c.fixed));}
  function groups(inputs){
    const list=[],used=new Set();
    for(const el of inputs){if(used.has(el))continue;const g=forInput(el);if(!g||g.cells.some(c=>used.has(c.el)))continue;list.push(g);g.cells.forEach(c=>used.add(c.el));}
    return list;
  }
  function describe(g,peers){
    const first=g.cells[0].el,last=g.cells[g.cells.length-1].el;
    // One word is one target. A paragraph may contain several independent words.
    let region=g.root;
    for(let p=region.parentElement;p&&!p.matches('body,html,main,form');p=p.parentElement){
      if(p.matches('p,li,td,tr,[data-question],.question,.question-row')){region=p;break;}
      if(MELContext.text(p).length>1800)break;
      region=p;
    }
    const context=MELContext.describe(first,peers,region),lastContext=MELContext.describe(last,peers,region);
    return {...context,after:lastContext.after,letterPattern:pattern(g),letterCount:g.cells.length};
  }
  async function fill(g,answer,{setText,valid,pause}){
    const chars=MELRules.letterValues(pattern(g),answer);
    if(!chars||!intact(g))throw Error('Từ không khớp số ô hoặc chữ gợi ý cố định. Chưa chuyển đáp án.');
    let expected=state(g),changed=0;
    for(let i=0;i<g.cells.length;i++){
      if(!valid()||!intact(g))throw Error('Bài hoặc cụm chữ đã đổi. Đã dừng điền.');
      if(state(g).some((v,j)=>v!==expected[j]))throw Error('Một ô chữ vừa thay đổi. Đã dừng; hãy thử lại.');
      const c=g.cells[i];if(!c.editable||expected[i]===chars[i])continue;
      setText(c.el,chars[i]);expected[i]=chars[i];changed++;
      await new Promise(resolve=>setTimeout(resolve,25));
      if(String(value(c.el))!==chars[i])throw Error('Trang chưa nhận ký tự. Chưa chuyển đáp án; hãy thử lại.');
    }
    await pause();
    if(!valid()||!intact(g)||g.cells.some((c,i)=>c.editable&&String(value(c.el))!==chars[i]))throw Error('Trang chưa giữ đủ ký tự. Chưa chuyển đáp án; hãy thử lại.');
    return {changed,cells:g.cells.filter(c=>c.editable).map(c=>c.el)};
  }
  globalThis.MELLetters={candidate,forInput,groups,pattern,state,intact,describe,fill};
})();
