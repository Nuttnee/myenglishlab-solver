/* Sentence word ordering. Use widget events; never write tokens or answer state into the page. */
(() => {
  const VERSION='1.9.0';
  if(globalThis.MELOrdering?.version===VERSION)return;
  const norm=s=>String(s??'').normalize('NFKC').replace(/[‘’]/g,"'").toLowerCase().replace(/[.!?,;:]+$/,'').trim();
  const words=s=>String(s??'').trim().split(/\s+/).map(norm).filter(Boolean);
  const visible=el=>el?.isConnected&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
  const enabled=el=>visible(el)&&!el.matches('.example,.disabled,[aria-disabled=true],:disabled')&&!el.closest('[inert],mel-answer-root');
  const tokens=el=>[...el.children].filter(x=>x.matches('.drag')&&!x.matches('.ui-sortable-helper,.ui-sortable-placeholder'));
  const value=el=>norm(el.querySelector('.itemContentText')?.textContent??el.textContent);
  const seq=el=>tokens(el).map(value);
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const bag=a=>[...a].sort();
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  function groups(){
    return [...document.querySelectorAll('.draggableJumbledWords')].filter(enabled).flatMap(root=>{
      const banks=[...root.querySelectorAll('.wordpoolWrapper')].filter(visible),targets=[...root.querySelectorAll('.droppableWrapper')].filter(visible);
      if(banks.length!==1||targets.length!==1||!enabled(targets[0]))return [];
      const bank=banks[0],target=targets[0],all=[...tokens(bank),...tokens(target)];
      if(!all.length||all.some(t=>!enabled(t)))return [];
      return [{root,bank,target,available:[...seq(bank),...seq(target)],placed:seq(target)}];
    });
  }
  function engine(g){
    const jq=globalThis.jQuery,instance=el=>jq?.data?.(el,'ui-sortable')||jq?.data?.(el,'sortable');
    const source=instance(g.bank),target=instance(g.target);
    if(source||target){
      let connects=false;
      try{const c=source?.options.connectWith;connects=(Array.isArray(c)?c:[c]).filter(x=>typeof x==='string').some(s=>g.target.matches(s));}catch{}
      return source&&target&&!source.options.disabled&&!target.options.disabled&&connects?'sortable':null;
    }
    return tokens(g.bank).every(t=>t.draggable)?'html':null;
  }
  function plan(lesson){
    const found=groups(),rows=(lesson.items||[]).filter(i=>!i.isExample).map(i=>({...i,n:String(i.n),expected:words(i.answer?.[0])}));
    const mapped=rows.map(row=>({row,candidates:found.filter(g=>same(bag(g.available),bag(row.expected)))}));
    const jobs=[],complete=[],unresolved=[];
    for(const {row,candidates} of mapped){
      const g=candidates[0];
      if(candidates.length!==1||mapped.some(m=>m.row!==row&&m.candidates.includes(g))){unresolved.push({n:row.n,reason:'Bộ từ thiếu/thừa hoặc trùng nhiều câu; chưa ghép chắc chắn.'});continue;}
      if(!same(g.placed,row.expected.slice(0,g.placed.length))){unresolved.push({n:row.n,reason:'Các từ đã đặt chưa đúng thứ tự; hãy trả chúng về khay từ rồi chạy lại.'});continue;}
      if(g.placed.length===row.expected.length){complete.push(row.n);continue;}
      const method=engine(g);
      if(!method){unresolved.push({n:row.n,reason:'Khay từ và vùng trả lời chưa có cơ chế kéo được hỗ trợ.'});continue;}
      jobs.push({row,...g,method});
    }
    return {rows,found,jobs,complete,unresolved};
  }
  function analyze(lesson){const p=plan(lesson);return {kind:'ordering',sources:p.found.reduce((n,g)=>n+tokens(g.bank).length,0),targets:p.found.length,matched:p.jobs.length+p.complete.length,ready:p.jobs.length,skipped:p.complete.length,unresolved:p.unresolved};}
  const pageKey=()=>location.href+'|'+[...document.querySelectorAll('h1,h2,h3,[role=heading]')].filter(visible).map(x=>x.textContent).join('|');
  const mouse=(el,type,p,down)=>el.dispatchEvent(new MouseEvent(type,{view:window,bubbles:true,cancelable:true,composed:true,clientX:p.x,clientY:p.y,button:0,buttons:down?1:0}));
  const point=el=>{const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};};
  function endpoint(target){
    const last=tokens(target).at(-1),r=target.getBoundingClientRect();
    if(!last)return point(target);
    const b=last.getBoundingClientRect();
    return {x:Math.min(r.right-3,b.right+8),y:Math.min(r.bottom-3,b.bottom+3)};
  }
  let busy=false,cancelled=false;
  async function move(source,job,valid){
    job.root.scrollIntoView({block:'center'});await wait(35);
    if(!valid())return;
    if(job.method==='sortable'){
      const from=point(source);let to=from;
      mouse(source,'mousedown',from,true);
      try{
        mouse(document,'mousemove',{x:from.x+8,y:from.y+5},true);await wait(25);
        // A placeholder can resize the bank; refresh public geometry before entering the target.
        globalThis.jQuery(job.bank).sortable('refreshPositions');
        to=endpoint(job.target);
        if(!valid())return;
        mouse(document,'mousemove',to,true);await wait(30);
        mouse(document,'mousemove',to,true);await wait(30);
      }finally{mouse(document,'mouseup',to,false);}
    }else{
      const transfer=new DataTransfer();transfer.setData('text/plain',source.textContent.trim());
      try{
        for(const [el,type] of [[source,'dragstart'],[job.target,'dragenter'],[job.target,'dragover'],[job.target,'drop']]){
          if(!valid())return;
          const p=type==='dragstart'?point(source):endpoint(job.target);
          el.dispatchEvent(new DragEvent(type,{bubbles:true,cancelable:true,composed:true,clientX:p.x,clientY:p.y,dataTransfer:transfer}));await wait(35);
        }
      }finally{source.dispatchEvent(new DragEvent('dragend',{bubbles:true,dataTransfer:transfer}));}
    }
  }
  async function execute(lesson,onlyN=''){
    if(busy)throw new Error('Đang sắp xếp từ. Chờ hoàn tất hoặc bấm Dừng.');
    busy=true;cancelled=false;
    const key=pageKey(),scroll={x:scrollX,y:scrollY},valid=()=>!cancelled&&pageKey()===key;
    let done=0,moved=0;const failures=[];
    const start=plan(lesson),selected=start.rows.filter(r=>!onlyN||r.n===String(onlyN));
    try{
      for(const row of selected){
        if(!valid())break;
        if(start.complete.includes(row.n))continue;
        let p=plan(lesson),job=p.jobs.find(j=>j.row.n===row.n);
        if(!job){failures.push(p.unresolved.find(u=>u.n===row.n)||{n:row.n,reason:'Không tìm được câu.'});continue;}
        while(job&&valid()){
          const before=[...job.placed],remaining=seq(job.bank),expected=row.expected.slice(0,before.length+1);
          const source=tokens(job.bank).find(t=>value(t)===row.expected[before.length]&&enabled(t));
          if(!source){failures.push({n:row.n,reason:'Không tìm thấy thẻ từ tiếp theo.'});break;}
          try{await move(source,job,valid);await wait(220);}
          catch(error){failures.push({n:row.n,reason:`Thao tác kéo bị lỗi: ${error.message}`});return result();}
          if(!valid())break;
          // Re-find by the complete token multiset, never by duplicate bank/target IDs.
          const fresh=groups().filter(g=>same(bag(g.available),bag(row.expected)));
          const after=fresh.length===1?fresh[0]:null;
          const expectedBank=remaining.slice();expectedBank.splice(expectedBank.indexOf(row.expected[before.length]),1);
          if(!after||!same(after.placed,expected)||!same(bag(seq(after.bank)),bag(expectedBank))){failures.push({n:row.n,reason:'Trang chưa nhận đúng từ/thứ tự sau khi kéo; đã dừng để tránh lệch câu.'});return result();}
          moved++;
          if(after.placed.length===row.expected.length){done++;break;}
          job=plan(lesson).jobs.find(j=>j.row.n===row.n);
        }
      }
      return result();
    }finally{busy=false;window.scrollTo(scroll.x,scroll.y);}
    function result(){
      const end=plan(lesson),remaining=selected.filter(r=>!end.complete.includes(r.n)).length;
      return {kind:'ordering',done,moved,skipped:selected.filter(r=>start.complete.includes(r.n)).length,total:selected.length,remaining,failures,cancelled,verification:'dom-only',error:cancelled?'Đã dừng sắp xếp từ.':pageKey()!==key?'Bài đã đổi; đã dừng.':remaining?`${remaining} câu chưa hoàn tất. ${failures[0]?.reason||'Kiểm tra vùng trả lời rồi thử lại.'}`:''};
    }
  }
  globalThis.MELOrdering={version:VERSION,analyze,execute,cancel:()=>{cancelled=true;},diagnostic:lesson=>({...analyze(lesson),groups:groups().map(g=>({bank:seq(g.bank),placed:g.placed,engine:engine(g),duplicateId:!!g.bank.id&&g.bank.id===g.target.id}))})};
})();
