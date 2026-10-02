/* Visible DOM text and local question evidence shared by all adapters. */
(() => {
  const ids=new WeakMap();let nextId=0;
  const skip=el=>!el || el.closest('script,style,noscript,template,mel-answer-root,#mel-pick-tip,[hidden],[aria-hidden=true]') || getComputedStyle(el).display==='none' || getComputedStyle(el).visibility==='hidden';
  function pieces(root){
    const out=[];if(!root)return out;
    const walk=node=>{
      if(node.nodeType===3){const value=node.nodeValue.replace(/\s+/g,' ').trim();if(value)out.push({node,value});return;}
      if(node.nodeType!==1&&node.nodeType!==11)return;
      if(node.nodeType===1&&(skip(node)||node.matches('input,textarea,select,[contenteditable=true]')))return;
      for(const child of node.childNodes)walk(child);
    };walk(root);return out;
  }
  const text=root=>pieces(root).map(p=>p.value).join(' ');
  function number(root){
    const attr=root?.getAttribute('data-question-number')||root?.getAttribute('data-item-number')||root?.getAttribute('data-answer-number');if(attr)return attr;
    const parts=pieces(root).filter(p=>!/^example\s*:?$/i.test(p.value));const first=parts[0]?.value||'';
    // A visible isolated label takes precedence over list position (questions may be reordered).
    const isolated=first.match(/^\(?([A-Z]|\d{1,3}[a-zA-Z]?|[A-Z]\d{1,2})[.)]?$/);
    if(isolated && !/^[A-Z]$/.test(isolated[1]))return isolated[1];
    if(root?.matches('li')&&root.parentElement?.matches('ol')){
      const list=root.parentElement,children=[...list.children].filter(el=>el.matches('li')),index=children.indexOf(root),reversed=list.reversed;
      let n=Number(list.getAttribute('start')||(reversed?children.length:1));for(let i=0;i<=index;i++){if(children[i].hasAttribute('value'))n=Number(children[i].value);if(i<index)n+=reversed?-1:1;}
      if(/^[Aa]$/.test(list.type)&&n>=1&&n<=26)return String.fromCharCode((list.type==='a'?96:64)+n);
      if(!list.type||list.type==='1')return String(n);
    }
    // A sentence starting with "A lot ..." / "I ..." is never a letter label.
    if(isolated && parts[0].node.parentElement!==root && !parts[0].node.parentElement.childElementCount)return isolated[1];
    return first.match(/^\s*(\d{1,3}[a-zA-Z]?)(?=[\s.):])/)?.[1]||'';
  }
  const rowSelector='[data-question],.question,.question-row,.q,li,fieldset,tr,[role=group]';
  function scope(el,peers=[]){
    let best=el,nearest=el.closest(rowSelector);
    for(let node=el.parentElement;node&&!node.matches('html,body,main,form');node=node.parentElement){
      const local=peers.filter(p=>node.contains(p));
      if(local.length>1&&!nearest?.contains(node)&&node!==nearest)break;
      if(text(node).length>1800)break;
      best=node;
      if(node===nearest)break;
    }return best;
  }
  function checkboxScope(el){
    let best=el.closest('label')||el;
    for(let node=el.parentElement;node&&!node.matches('html,body,main,form');node=node.parentElement){
      if(text(node).length>2000)break;
      const boxes=[...node.querySelectorAll('input[type=checkbox],[role=checkbox]')];
      if(boxes.length<2)continue;
      best=node;
      if(node.matches(rowSelector)||node.querySelector('.stem,legend,[data-prompt],p'))break;
    }return best;
  }
  function lineText(el,region=scope(el)){
    // Pearson can put several input + sentence rows in one LI, separated by BR.
    // Inline spans (including hangmanGroup) do not define a question boundary.
    // Only return a line with exactly one control; never guess among inline blanks.
    let words=[],controls=[],result='';
    const end=()=>{if(controls.length===1&&controls[0]===el)result=words.join(' ').replace(/\s+/g,' ').trim();words=[];controls=[];};
    const walk=node=>{
      if(node.nodeType===3){const value=node.nodeValue.trim();if(value)words.push(value);return;}
      if(node.nodeType!==1||skip(node))return;
      if(node.matches('br,hr')){end();return;}
      if(node.matches('input,textarea,select,[contenteditable=true],[contenteditable=plaintext-only]')){controls.push(node);return;}
      const block=node!==region&&/^(block|list-item|flex|grid|table-row|table-cell|flow-root)$/.test(getComputedStyle(node).display);
      if(block)end();for(const child of node.childNodes)walk(child);if(block)end();
    };
    if(region)walk(region);end();return result.slice(0,1800);
  }
  function describe(el,peers=[],forcedScope=null){
    const region=forcedScope||scope(el,peers),context=text(region),questionNumber=number(el)||number(region);
    const root=el.getRootNode(),container=region|| (root instanceof ShadowRoot?root:document.body);
    const list=pieces(container),before=[],after=[];
    for(const p of list){if(el.contains(p.node))continue;const relation=el.compareDocumentPosition(p.node);if(relation&Node.DOCUMENT_POSITION_PRECEDING)before.push(p.value);else if(relation&Node.DOCUMENT_POSITION_FOLLOWING)after.push(p.value);}
    const slots=region?peers.filter(p=>region.contains(p)):[];
    return {context,lineContext:lineText(el,region),questionNumber,isExample:/^\s*example\s*:/i.test(context)||Boolean(el.closest('[data-example=true],.example')),before:before.join(' ').slice(-700),after:after.join(' ').slice(0,700),slot:slots.indexOf(el),slotCount:slots.length};
  }
  function groupKey(el){if(!ids.has(el))ids.set(el,'group-'+(++nextId));return ids.get(el);}
  function structure(root){return [root,...root.querySelectorAll('*')].filter(el=>!skip(el)&&!el.matches('input[type=password],input[type=email],input[type=hidden]')).slice(0,100).map(el=>({tag:el.tagName,classes:String(el.className||''),role:el.getAttribute('role'),tabIndex:el.tabIndex,dataId:el.getAttribute('data-id'),type:el.getAttribute('type'),before:getComputedStyle(el,'::before').content,after:getComputedStyle(el,'::after').content,text:el.children.length?'':text(el).slice(0,180)}));}
  globalThis.MELContext={text,pieces,number,scope,checkboxScope,describe,groupKey,structure,lineText};
})();
