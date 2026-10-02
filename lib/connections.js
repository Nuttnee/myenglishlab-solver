/* Pearson matchingGroup click adapter and read-only evidence collector.
   Pair verification uses the actual SVG endpoints, never data-id suffixes. */
(() => {
  const VERSION='1.11.0';
  if(globalThis.MELConnections?.version===VERSION)return;
  const excluded='script,style,noscript,template,mel-answer-root,#mel-pick-tip,input,textarea,select,[contenteditable],video,audio,[hidden],[aria-hidden=true]';
  const norm=v=>String(v||'').normalize('NFKC').toLowerCase().replace(/[‘’]/g,"'").replace(/\s+/g,' ').trim();
  const visible=el=>el?.isConnected&&!el.closest(excluded)&&el.getClientRects().length&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden';
  const locked=el=>el.matches('.example,[disabled],[aria-disabled=true]')||Boolean(el.closest('[inert]'));
  const roots=()=>[...document.querySelectorAll('.matching')].filter(visible).filter(root=>root.querySelector('.matchingGroup.left .matchingElement')&&root.querySelector('.matchingGroup.right .matchingElement')&&root.querySelector('.matchingLines svg'));
  const sides=root=>['left','right'].map(side=>[...root.querySelectorAll(`.matchingGroup.${side} .matchingElement`)].filter(el=>visible(el)&&el.closest('.matching')===root));
  function topology(root){
    const [left,right]=sides(root),edges=[],used=new Set();
    const nearest=(point,els,side)=>els.filter(el=>{
      const r=el.getBoundingClientRect();return Math.abs(point.x-(side==='left'?r.right:r.left))<=8&&Math.abs(point.y-(r.top+r.height/2))<=Math.max(3,Math.min(8,r.height*.3));
    });
    for(const path of root.querySelectorAll('.matchingLines svg path')){
      if(!visible(path))continue;
      try{
        const length=path.getTotalLength(),matrix=path.getScreenCTM();
        if(!matrix||length<1)throw new Error();
        let a=path.getPointAtLength(0).matrixTransform(matrix),b=path.getPointAtLength(length).matrixTransform(matrix);
        if(a.x>b.x)[a,b]=[b,a];
        const l=nearest(a,left,'left'),r=nearest(b,right,'right');
        if(l.length!==1||r.length!==1||used.has(l[0])||used.has(r[0]))throw new Error();
        used.add(l[0]);used.add(r[0]);edges.push({left:l[0],right:r[0]});
      }catch{return {error:'Không xác định được hai đầu của đường nối SVG.',edges:[]};}
    }
    if([...left,...right].some(el=>el.classList.contains('matched')!==used.has(el)))return {error:'Trạng thái nút và đường nối chưa nhất quán.',edges:[]};
    return {edges};
  }
  function plan(lesson){
    if(lesson?.type!=='matching')return {jobs:[],error:'Không phải dạng nối cặp.'};
    const items=lesson.items||[],candidates=[];
    if(!items.length||items.some(i=>!/→\s*\?\s*$/.test(i.prompt||'')||i.answer?.length!==1))return {jobs:[],error:'Cần một vế trái và một đáp án cho mỗi cặp.'};
    if(new Set(items.map(i=>String(i.n))).size!==items.length)return {jobs:[],error:'Số câu bị trùng; chưa xác định được cặp cần làm.'};
    for(const root of roots()){
      const [left,right]=sides(root),used=new Set(),jobs=[];
      if(left.length!==items.length||right.length!==items.length)continue;
      for(const item of items){
        const a=norm(item.prompt.replace(/→\s*\?\s*$/,'')),b=norm(item.answer[0]);
        const l=left.filter(el=>norm(MELContext.text(el))===a),r=right.filter(el=>norm(MELContext.text(el))===b);
        if(l.length!==1||r.length!==1||used.has(l[0])||used.has(r[0]))break;
        used.add(l[0]);used.add(r[0]);jobs.push({n:String(item.n),example:Boolean(item.isExample),left:l[0],right:r[0]});
      }
      if(jobs.length===items.length)candidates.push({root,jobs});
    }
    if(candidates.length!==1)return {jobs:[],error:candidates.length?'Có nhiều bảng nối cùng khớp.':'Chưa ghép duy nhất được toàn bộ hai cột.'};
    const {root,jobs}=candidates[0],state=topology(root);
    if(state.error)return {root,jobs:[],error:state.error};
    for(const job of jobs){
      job.complete=state.edges.some(e=>e.left===job.left&&e.right===job.right);
      job.occupied=state.edges.some(e=>e.left===job.left||e.right===job.right);
      job.locked=locked(job.left)||locked(job.right);
      if((job.example||job.locked)&&!job.complete)return {root,jobs:[],error:'Cặp ví dụ/khóa chưa khớp đường nối và đáp án.'};
    }
    return {root,jobs,error:''};
  }
  function analyze(lesson){
    const p=plan(lesson),jobs=p.jobs.filter(j=>!j.example);
    return {kind:'connections',supported:Boolean(p.root&&!p.error),matched:jobs.length,ready:jobs.filter(j=>!j.complete&&!j.occupied&&!j.locked).length,skipped:jobs.filter(j=>j.complete).length,sources:lesson?.type==='matching'?roots().reduce((n,r)=>n+sides(r)[0].length,0):0,targets:lesson?.type==='matching'?roots().length:0,error:p.error,unresolved:jobs.filter(j=>!j.complete&&j.occupied).map(j=>({n:j.n,reason:'Cặp đã nối với đáp án khác; giữ nguyên.'}))};
  }
  let epoch=0,busy=false;
  const key=()=>location.href+'|'+[...document.querySelectorAll('h1,h2,h3,h4')].map(el=>el.textContent).join('|');
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function click(el){
    el.focus({preventScroll:true});const r=el.getBoundingClientRect();
    el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window,clientX:r.left+r.width/2,clientY:r.top+r.height/2,button:0}));
  }
  async function execute(lesson,onlyN=''){
    if(busy)return {kind:'connections',done:0,skipped:0,error:'Đang nối cặp.'};
    const start=plan(lesson),selected=start.jobs.filter(j=>!j.example&&(!onlyN||j.n===String(onlyN)));
    if(start.error||!selected.length)return {kind:'connections',done:0,skipped:0,error:start.error||'Không có cặp phù hợp.'};
    busy=true;const run=++epoch,signature=key(),completed=new Set(),skipped=selected.filter(j=>j.complete).length;
    let error='',pending=null;
    const valid=()=>epoch===run&&key()===signature;
    try{
      for(const original of selected){
        if(!valid())break;
        const current=plan(lesson),job=current.jobs.find(j=>j.n===original.n);
        if(current.error||!job){error=current.error||'Bảng nối đã thay đổi.';break;}
        if(job.complete)continue;
        if(job.occupied||job.locked){error='Có cặp đang nối khác đáp án; đã giữ nguyên.';continue;}
        const leftText=norm(MELContext.text(job.left)),rightText=norm(MELContext.text(job.right));
        pending=job.left;click(job.left);await wait(60);
        if(!valid())break;
        if(!job.left.isConnected||!job.right.isConnected){error='Nút nối đã được dựng lại giữa hai lần bấm; đã dừng.';break;}
        if(norm(MELContext.text(job.left))!==leftText||norm(MELContext.text(job.right))!==rightText||locked(job.left)||locked(job.right)){error='Nội dung/trạng thái nút đổi giữa hai lần bấm; đã dừng.';break;}
        click(job.right);pending=null;
        let verified=false;
        for(let i=0;i<10;i++){
          await wait(50);if(!valid())break;
          const fresh=plan(lesson),pair=fresh.jobs.find(j=>j.n===original.n);
          if(!fresh.error&&pair?.complete){verified=true;break;}
        }
        if(!valid())break;
        if(!verified){error='Chưa thấy đường nối đúng giữa hai đầu; đã dừng, không tính là hoàn tất.';break;}
        completed.add(job.n);
      }
    }catch(e){error=e.message;}
    finally{
      if(pending?.isConnected)pending.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',keyCode:27,which:27,bubbles:true}));
      busy=false;
    }
    const cancelled=epoch!==run,changed=key()!==signature,remaining=selected.length-skipped-completed.size;
    return {kind:'connections',done:completed.size,skipped,total:selected.length,remaining,cancelled,verification:'svg-and-dom-only',error:cancelled?'Đã dừng nối cặp.':changed?'Bài đã đổi; đã dừng.':error||(remaining?'Một số cặp chưa hoàn tất.':'')};
  }
  function diagnostic(lesson={}){
    const nodes=[...document.querySelectorAll('body *')].filter(visible).slice(0,16000);
    const textCache=new Map(),text=el=>{if(!textCache.has(el))textCache.set(el,MELContext.text(el).trim());return textCache.get(el);};
    const keys=new Map(),ref=el=>{if(!keys.has(el))keys.set(el,'node-'+keys.size);return keys.get(el);};
    const jq=globalThis.jQuery;
    const events=el=>{
      const result=[];
      // Names/selectors only: never serialize handler source, model data or globals.
      try{const registered=jq?._data?.(el,'events')||{};
        for(const [type,list] of Object.entries(registered))for(const h of Array.from(list).slice(0,20))result.push({type,selector:typeof h.selector==='string'?h.selector.slice(0,200):''});
      }catch{}
      for(const type of ['click','mousedown','mouseup','pointerdown','pointerup','keydown','touchstart','touchend'])if(typeof el['on'+type]==='function')result.push({type,inline:true});
      return result.slice(0,50);
    };
    const describe=el=>{
      const r=el.getBoundingClientRect(),attrs={};
      for(const a of el.attributes||[]){
        if(/^(?:id|class|role|tabindex|disabled|aria-(?:label|disabled|selected|pressed|checked|controls|labelledby)|data-(?:id|index|side|pair|response|source|target|match|group|example)|d|x1|y1|x2|y2|points|stroke|fill|transform)$/i.test(a.name))attrs[a.name]=a.value.slice(0,1200);
      }
      return {ref:ref(el),parent:el.parentElement?ref(el.parentElement):null,tag:el.tagName,attrs,rect:{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)},text:el.children.length?'':text(el).slice(0,240),cursor:getComputedStyle(el).cursor,pointerEvents:getComputedStyle(el).pointerEvents,events:events(el)};
    };
    const expected=[];
    if(lesson.type==='matching')for(const item of (lesson.items||[]).slice(0,60)){
      if(!/→\s*\?\s*$/.test(item.prompt||''))continue;
      expected.push({n:item.n,side:'left',text:item.prompt.replace(/→\s*\?\s*$/,'').trim(),example:Boolean(item.isExample)});
      for(const answer of (item.answer||[]).slice(0,5))expected.push({n:item.n,side:'right',text:answer,example:Boolean(item.isExample)});
    }
    const endpoints=expected.map(item=>{
      const matches=nodes.filter(el=>norm(text(el))===norm(item.text));
      const smallest=matches.filter(el=>!matches.some(other=>other!==el&&el.contains(other))).slice(0,8);
      return {...item,candidates:smallest.map(el=>{
        const ancestors=[];for(let p=el.parentElement;p&&!p.matches('body,html')&&ancestors.length<6;p=p.parentElement)ancestors.push(describe(p));
        return {...describe(el),ancestors};
      })};
    });
    const found=nodes.filter(el=>endpoints.some(e=>e.candidates.some(c=>c.ref===keys.get(el))));
    const roots=[];
    for(const el of found){
      for(let p=el.parentElement;p&&!p.matches('body,html,main,form');p=p.parentElement){
        if(found.filter(other=>p.contains(other)).length<2)continue;
        if(p.querySelectorAll('*').length<=800&&text(p).length<=15000)roots.push(p);
        break;
      }
    }
    // Also capture plausible containers when no lesson is selected. This is diagnostic
    // evidence only; a class containing "match" never authorizes automatic clicks.
    for(const el of nodes)if(/(?:match|connect|pair)/i.test(String(el.getAttribute('class')||'')+' '+el.id)&&el.children.length>=2&&el.querySelectorAll('*').length<=800&&text(el).length<=15000)roots.push(el);
    const unique=[...new Set(roots)].filter(el=>!roots.some(other=>other!==el&&other.contains(el))).slice(0,8);
    const regions=unique.map(root=>({root:ref(root),nodes:[root,...root.querySelectorAll('*')].filter(visible).slice(0,500).map(describe)}));
    const graphics=nodes.filter(el=>el.matches('svg,canvas')).slice(0,20).map(el=>({...describe(el),width:el.getAttribute('width'),height:el.getAttribute('height'),shapes:el.matches('svg')?[...el.querySelectorAll('path,line,polyline,circle,rect')].slice(0,100).map(describe):[]}));
    return {schema:2,readOnly:true,analysis:analyze(lesson),supported:analyze(lesson).supported,expected:endpoints.length,found:endpoints.filter(e=>e.candidates.length).length,endpoints,regions,graphics,delegatedEvents:{document:events(document),body:events(document.body)},limits:{pageNodes:16000,regions:8,nodesPerRegion:500,graphics:20}};
  }
  globalThis.MELConnections={version:VERSION,diagnostic,analyze,execute,cancel:()=>{epoch++;}};
})();
