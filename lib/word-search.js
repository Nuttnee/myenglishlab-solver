/* Word-search grid diagnostics and verified endpoint selection. */
(() => {
  if(globalThis.MELWordSearch)return;
  const blocked='script,style,noscript,template,nav,header,footer,mel-answer-root,#mel-pick-tip,[hidden],[aria-hidden=true],input[type=password],input[type=email],input[type=hidden]';
  const clean=el=>Boolean(el&&!el.closest(blocked)&&el.getClientRects().length&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden');
  const applicable=lesson=>/word\s*(?:square|search)/i.test(lesson.instruction||'')&&/first.*last\s+letter/i.test(lesson.instruction||'');
  function diagnostic(lesson){
    const limits={elements:8000,regions:4,nodesPerRegion:650,totalNodes:1800};
    if(!applicable(lesson))return {schema:1,readOnly:true,applicable:false,limits,regions:[]};
    const all=[...document.body?.querySelectorAll('*')||[]].slice(0,limits.elements),letters=[];
    for(const el of all){
      if(!clean(el)||el.matches('input,textarea,select,[contenteditable]'))continue;
      const value=el.textContent.trim();
      // Prefer the deepest glyph wrapper so nested spans do not duplicate cells.
      if(/^\p{L}$/u.test(value)&&![...el.children].some(c=>clean(c)&&c.textContent.trim()===value))letters.push(el);
    }
    const counts=new Map();
    for(const el of letters)for(let p=el.parentElement;p&&!p.matches('html,body,main,form');p=p.parentElement)counts.set(p,(counts.get(p)||0)+1);
    const candidates=[...counts].filter(([el,n])=>n>=16&&n<=900&&clean(el));
    const smallest=candidates.filter(([el])=>!candidates.some(([other])=>other!==el&&el.contains(other)));
    let total=0;
    const regions=smallest.slice(0,limits.regions).map(([grid])=>{
      // Include a nearby result list when it is in a small widget wrapper.
      let root=grid;
      for(let level=0;level<2;level++){
        const p=root.parentElement;
        if(!p||p.matches('html,body,main,form')||!clean(p)||p.querySelectorAll('*').length>550||MELContext.text(p).length>5000)break;
        root=p;
      }
      const origin=root.getBoundingClientRect(),nodes=[];let truncated=false;
      const walk=(node,parent)=>{
        if(nodes.length>=limits.nodesPerRegion||total>=limits.totalNodes){truncated=true;return;}
        if(node.nodeType===3){const t=node.nodeValue.replace(/\s+/g,' ').trim();if(t){nodes.push({parent,tag:'#text',text:t.slice(0,240)});total++;}return;}
        if(node.nodeType!==1||!clean(node)||node.matches('textarea,select,[contenteditable]'))return;
        const r=node.getBoundingClientRect(),style=getComputedStyle(node),index=nodes.length;
        const attributes=Object.fromEntries([...node.attributes].filter(a=>/^(role|tabindex|type|maxlength|aria-(checked|selected|pressed|disabled)|data-(id|index|row|col|column|x|y|item|option|response|selected|checked|state))$/.test(a.name)).map(a=>[a.name,a.value.slice(0,160)]));
        nodes.push({parent,tag:node.tagName,classes:String(node.className||'').slice(0,240),attributes,
          rect:{x:Math.round(r.left-origin.left),y:Math.round(r.top-origin.top),width:Math.round(r.width),height:Math.round(r.height)},
          style:{display:style.display,cursor:style.cursor,pointerEvents:style.pointerEvents,color:style.color,backgroundColor:style.backgroundColor},
          before:getComputedStyle(node,'::before').content.slice(0,80),after:getComputedStyle(node,'::after').content.slice(0,80),
          ...(node.matches('input')?{disabled:node.disabled,readOnly:node.readOnly}:{})});total++;
        // Never export form values, URLs, inline handlers or the rest of the page.
        if(!node.matches('input'))for(const child of node.childNodes)walk(child,index);
      };walk(root,null);
      return {glyphs:letters.filter(el=>grid.contains(el)).length,grid:{tag:grid.tagName,classes:String(grid.className||'').slice(0,240)},nodes,truncated};
    });
    return {schema:1,readOnly:true,applicable:true,limits,regions,truncated:all.length===limits.elements||smallest.length>limits.regions||regions.some(r=>r.truncated)};
  }

  const roots=()=>[...document.querySelectorAll('.wordsearchGrid[role=grid]')].filter(clean);
  const word=value=>String(value||'').trim().toUpperCase();
  function inspect(){
    const found=roots();if(found.length!==1)throw Error('Cần đúng một bảng tìm từ đang hiển thị.');
    const grid=found[0],root=grid.closest('.wordsearch'),lists=root&&[...root.querySelectorAll('.wordsearchAnswersList')].filter(clean);
    if(!root||root.querySelectorAll('.wordsearchGrid').length!==1||lists.length!==1)throw Error('Chưa xác định được danh sách từ của bảng chữ.');
    const rows=[...grid.children];
    if(rows.length<2||rows.length>60||rows.some(r=>!r.matches('.wordsearchGridRow[role=row]')))throw Error('Cấu trúc hàng chưa được hỗ trợ.');
    const matrix=rows.map(r=>[...r.children]),width=matrix[0].length,cells=matrix.flat();
    if(width<2||width>60||cells.length>900||matrix.some(r=>r.length!==width)||cells.some(c=>!c.matches('.wordsearchItem[role=gridcell]')||!clean(c)||!/^\p{L}$/u.test(c.textContent.trim())||c.closest('[inert],[aria-disabled=true]')))throw Error('Bảng chữ không đều hoặc có ô không thể bấm.');
    const boxes=matrix.map(r=>r.map(c=>c.getBoundingClientRect()));
    for(let r=0;r<rows.length;r++)for(let c=0;c<width;c++){
      const b=boxes[r][c];
      if(Math.abs(b.left-boxes[0][c].left)>2||Math.abs(b.top-boxes[r][0].top)>2||(r&&b.top<=boxes[r-1][c].bottom-2)||(c&&b.left<=boxes[r][c-1].right-2))throw Error('Vị trí ô không khớp hàng/cột của bảng chữ.');
    }
    return {root,grid,list:lists[0],matrix,cells,letters:matrix.map(r=>r.map(c=>word(c.textContent)))};
  }
  function paths(p,value){
    const chars=[...value],found=[];
    for(let r=0;r<p.matrix.length;r++)for(let c=0;c<p.matrix[0].length;c++)for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
      if(!dr&&!dc)continue;
      const path=chars.map((_,i)=>p.matrix[r+dr*i]?.[c+dc*i]);
      if(path.every((el,i)=>el&&word(el.textContent)===chars[i]))found.push(path);
    }
    return found;
  }
  function listed(p){
    return [...p.list.children].filter(clean).map(el=>{
      if(el.tagName!=='LI')throw Error('Danh sách kết quả có cấu trúc chưa hỗ trợ.');
      const copy=el.cloneNode(true);copy.querySelectorAll('button,a,[role=button],svg,img').forEach(n=>n.remove());
      const value=word(copy.textContent);
      if(!/^\p{L}{2,}$/u.test(value))throw Error('Chưa đọc rõ từ trong danh sách kết quả.');
      return {value,example:el.classList.contains('example')};
    });
  }
  function prepare(lesson){
    if(!applicable(lesson))throw Error('Hướng dẫn chưa xác nhận cách chọn chữ đầu–cuối.');
    const p=inspect(),items=lesson.items||[];
    if(!items.length||items.some(i=>i.answer?.length!==1||!/^\p{L}{2,}$/u.test(word(i.answer[0]))))throw Error('Đáp án phải là các từ đơn rõ ràng.');
    const mapped=items.map(i=>{const value=word(i.answer[0]),found=paths(p,value);if(found.length!==1)throw Error(`Từ ${value}: không có đường chữ duy nhất.`);return {n:String(i.n),value,example:!!i.isExample,path:found[0]};});
    if(new Set(mapped.map(i=>i.value)).size!==mapped.length)throw Error('Kho có từ lặp, chưa ghép chắc chắn.');
    return {...p,mapped};
  }
  function verify(p,expected){
    const entries=listed(p),values=entries.map(e=>e.value);
    if(new Set(values).size!==values.length||values.some(v=>!p.mapped.some(m=>m.value===v)))throw Error('Có từ lạ hoặc trùng đang được chọn; giữ nguyên để bạn kiểm tra.');
    if(p.mapped.some(m=>m.example&&!values.includes(m.value))||entries.some(e=>e.example&&!p.mapped.some(m=>m.example&&m.value===e.value)))throw Error('Từ ví dụ trên trang chưa khớp kho.');
    if(expected&&(values.length!==expected.size||values.some(v=>!expected.has(v))))throw Error('Trang chưa ghi nhận đúng từ vào danh sách kết quả. Đã dừng.');
    const active=new Set(p.mapped.filter(m=>values.includes(m.value)).flatMap(m=>m.path));
    if(p.cells.some(c=>c.classList.contains('active')!==active.has(c)))throw Error('Trạng thái ô chữ chưa khớp danh sách từ; có thể đang chọn dở một từ.');
    return new Set(values);
  }
  let busy=false;
  async function execute(lesson,onlyN,{pause,valid}){
    let done=0,skipped=0;
    const result=error=>({kind:'word-search',done,skipped,error,verification:'dom-only'});
    if(busy)return result('Đang tìm từ; chờ hoàn tất hoặc bấm Dừng.');
    busy=true;
    try{
      const p=prepare(lesson),expected=verify(p),stamp=JSON.stringify(p.letters);
      const intact=()=>{
        if(!valid())throw Error('Bài đã đổi hoặc thao tác đã dừng.');
        const now=inspect();
        if(now.grid!==p.grid||now.list!==p.list||JSON.stringify(now.letters)!==stamp||now.cells.some((c,i)=>c!==p.cells[i]))throw Error('Bảng chữ đã đổi; đã dừng để bạn kiểm tra.');
      };
      const targets=p.mapped.filter(m=>!m.example&&(!onlyN||m.n===String(onlyN)));
      if(!targets.length)throw Error('Không có từ cần chọn.');
      for(const m of targets){
        intact();verify(p,expected);
        if(expected.has(m.value)){skipped++;continue;}
        const before=JSON.stringify(listed(p));
        m.path[0].click();await pause();intact();
        if(JSON.stringify(listed(p))!==before)throw Error('Danh sách từ thay đổi ngay sau chữ đầu; đã dừng.');
        // Only the page's click handlers mutate cells/results. Never synthesize answers.
        m.path[m.path.length-1].click();await pause();intact();
        const next=new Set([...expected,m.value]);verify(p,next);
        expected.add(m.value);done++;
      }
      return result();
    }catch(e){return result(e.message);}finally{busy=false;}
  }
  globalThis.MELWordSearch={diagnostic,present:()=>roots().length>0,execute};
})();
