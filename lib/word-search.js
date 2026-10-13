/* Read-only diagnostics for unknown word-square controls. No click adapter yet. */
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
  globalThis.MELWordSearch={diagnostic};
})();
