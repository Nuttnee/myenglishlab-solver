/* Pearson crossword: response classes identify words; geometry orders their shared cells. */
(() => {
  const visible=e=>e?.isConnected&&e.getClientRects().length&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden';
  const roots=()=>[...document.querySelectorAll('.crossword')].filter(visible);
  const locked=e=>e.disabled||e.readOnly||e.matches('.example,[aria-readonly=true],[aria-disabled=true]')||!!e.closest('[inert]');
  const ids=e=>[...e.classList].map(c=>c.match(/^response-RESPONSE_(\d+)$/)?.[1]).filter(Boolean);
  const chars=s=>[...String(s||'').normalize('NFC').replace(/[\s-]/g,'')];
  function inspect(root){
    const cells=[...root.querySelectorAll('input.cw')].filter(visible),groups=new Map();
    for(const el of cells)for(const id of ids(el)){if(!groups.has(id))groups.set(id,[]);groups.get(id).push(el);}
    const words=[...groups].map(([id,list])=>{
      const boxes=list.map(el=>({el,r:el.getBoundingClientRect()}));
      const xs=boxes.map(b=>b.r.left+b.r.width/2),ys=boxes.map(b=>b.r.top+b.r.height/2);
      const tolerance=Math.max(1,Math.min(...boxes.map(b=>Math.min(b.r.width,b.r.height)))*.22);
      const horizontal=Math.max(...ys)-Math.min(...ys)<=tolerance,vertical=Math.max(...xs)-Math.min(...xs)<=tolerance;
      const direction=horizontal&&!vertical?'across':vertical&&!horizontal?'down':'';
      boxes.sort((a,b)=>direction==='across'?a.r.left-b.r.left:a.r.top-b.r.top);
      const positions=boxes.map(b=>direction==='across'?b.r.left:b.r.top),steps=positions.slice(1).map((n,i)=>n-positions[i]);
      const median=[...steps].sort((a,b)=>a-b)[Math.floor(steps.length/2)];
      const regular=!!direction&&steps.length>0&&steps.every(n=>n>tolerance&&Math.abs(n-median)<=Math.max(2,median*.2));
      return {id,direction,cells:boxes.map(b=>b.el),regular};
    });
    return {root,cells,words};
  }
  function layout(root){
    const r=root.getBoundingClientRect();
    return JSON.stringify([...root.querySelectorAll('input.cw')].map(e=>{const b=e.getBoundingClientRect();return [ids(e),locked(e),visible(e),Math.round(b.left-r.left),Math.round(b.top-r.top),Math.round(b.width),Math.round(b.height)];}));
  }
  function plan(lesson){
    const found=roots();if(found.length!==1)throw Error('Cần đúng một lưới crossword đang hiển thị.');
    const grid=inspect(found[0]),rows=lesson.items||[],assignments=new Map(),mapped=[];
    if(!grid.cells.length||grid.cells.some(e=>!ids(e).length))throw Error('Lưới chưa có mã nhóm từ đầy đủ.');
    if(rows.length!==grid.words.length)throw Error('Số từ trong lưới chưa khớp kho đáp án.');
    for(const row of rows){
      const m=String(row.n).trim().match(/^(\d+)(?:\s+(across|down))?$/i);
      if(!m)throw Error('Chưa đọc được số câu/hướng của từ trong kho.');
      const word=grid.words.find(w=>w.id===m[1]);
      if(!word||mapped.some(w=>w.id===word.id)||!word.regular)throw Error(`Câu ${row.n}: chưa xác định được dãy ô ngang/dọc liên tục.`);
      if(m[2]&&m[2].toLowerCase()!==word.direction)throw Error(`Câu ${row.n}: hướng trên lưới không khớp đáp án.`);
      const answer=chars(row.answer?.[0]);
      if(answer.length!==word.cells.length)throw Error(`Câu ${row.n}: đáp án ${answer.length} chữ nhưng lưới có ${word.cells.length} ô.`);
      word.cells.forEach((el,i)=>{
        if(assignments.has(el)&&assignments.get(el)!==answer[i])throw Error(`Câu ${row.n}: hai đáp án mâu thuẫn tại ô giao nhau.`);
        if((locked(el)||row.isExample)&&el.value.toUpperCase()!==answer[i].toUpperCase())throw Error(`Câu ${row.n}: chữ gợi ý/ví dụ không khớp đáp án.`);
        assignments.set(el,answer[i]);
      });
      mapped.push({...word,n:String(row.n),example:!!row.isExample,answer});
    }
    return {...grid,mapped,assignments};
  }
  function diagnostic(){return roots().map(root=>{const g=inspect(root),r=root.getBoundingClientRect();return {words:g.words.map(w=>({id:w.id,direction:w.direction,regular:w.regular,length:w.cells.length})),cells:g.cells.map(e=>{const b=e.getBoundingClientRect();return {groups:ids(e),classes:e.className,value:e.value,locked:!!locked(e),maxLength:e.maxLength,x:Math.round(b.left-r.left),y:Math.round(b.top-r.top),width:b.width,height:b.height};})};});}
  let busy=false;
  async function execute(lesson,onlyN,{setText,valid}){
    if(busy)throw Error('Đang điền crossword. Bấm Dừng hoặc chờ hoàn tất.');
    busy=true;let writtenCells=0;
    try{
      const p=plan(lesson),stamp=layout(p.root),initial=new Map(p.cells.map(e=>[e,e.value])),expected=new Map(initial);
      const selected=p.mapped.filter(w=>!w.example&&(!onlyN||w.n===String(onlyN)));
      if(!selected.length)throw Error('Không có từ cần điền trong lựa chọn.');
      const complete=w=>w.cells.every((e,i)=>e.value.toUpperCase()===w.answer[i].toUpperCase());
      const skipped=selected.filter(complete).length;
      const targets=new Set(selected.flatMap(w=>w.cells));
      const intact=()=>p.root.isConnected&&p.cells.every(e=>e.isConnected&&p.root.contains(e))&&layout(p.root)===stamp;
      let error='';
      for(const el of targets){
        if(!valid()||!intact()){error='Bài hoặc lưới đã đổi, hoặc thao tác đã dừng.';break;}
        if(p.cells.some(e=>e.value!==expected.get(e))){error='Một ô vừa thay đổi ngoài thao tác; đã dừng để tránh ghi đè.';break;}
        const letter=p.assignments.get(el);
        if(locked(el)||el.value.toUpperCase()===letter.toUpperCase())continue;
        try{
          setText(el,letter);
          el.dispatchEvent(new KeyboardEvent('keyup',{key:letter,bubbles:true,composed:true}));
          await new Promise(r=>setTimeout(r,35));
          if(el.value!==letter){error='Trang chưa giữ ký tự vừa điền; đã dừng.';break;}
          expected.set(el,letter);writtenCells++;
        }catch(e){error=e.message;break;}
      }
      await new Promise(r=>setTimeout(r,180));
      if(!error&&(!valid()||!intact()||p.cells.some(e=>e.value!==expected.get(e))))error='Lưới thay đổi sau khi điền; cần kiểm tra lại.';
      const remaining=selected.filter(w=>!complete(w)).length;
      return {kind:'crossword',done:Math.max(0,selected.length-remaining-skipped),skipped,writtenCells,total:selected.length,remaining,error,verification:'dom-only'};
    }catch(e){return {kind:'crossword',done:0,writtenCells,error:e.message,verification:'dom-only'};}
    finally{busy=false;}
  }
  globalThis.MELCrossword={present:()=>roots().length>0,diagnostic,execute};
})();
