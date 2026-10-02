/* Shared, deterministic matching rules. No lesson IDs, activity IDs, or account-specific selectors. */
(() => {
  const R=globalThis.MELRules={version:'1.8.3'};
  R.text=v=>String(v??'').normalize('NFKC').toLowerCase().replace(/[‘’]/g,"'").trim().replace(/\s+/g,' ');
  R.words=v=>R.text(v).replace(/[^\p{L}\p{N}']+/gu,' ').trim().replace(/\s+/g,' ');
  R.option=v=>R.text(v).replace(/[.!?]+$/,'').trim();
  R.optionMatch=(a,b)=>{
    if(R.option(a)===R.option(b))return true;
    const bool=v=>/^(t|true)$/.test(R.option(v))?'true':/^(f|false)$/.test(R.option(v))?'false':null;
    return Boolean(bool(a)&&bool(a)===bool(b));
  };
  R.findOption=(options,value)=>{const matches=options.filter(o=>R.optionMatch(o.text,value)||R.optionMatch(o.value,value));return matches.length===1?matches[0]:null;};
  R.prompt=v=>String(v||'').replace(/\([^)]*\)/g,' ').replace(/(?:→|->).*$/s,' ').replace(/^(?:picture|label)\s*:\s*/i,'').replace(/\.{3,}|…/g,' ');
  R.letterValues=(pattern,value)=>{
    if(!Array.isArray(pattern)||pattern.length<2)return null;
    const raw=String(value).normalize('NFC').replace(/\u00a0/g,' ');
    for(const variant of [raw,raw.replace(/\s/g,'')]){
      const chars=[...variant];
      if(chars.length===pattern.length&&pattern.every((fixed,i)=>fixed===null||R.text(fixed)===R.text(chars[i])))return chars;
    }
    return null;
  };
  R.rows=lesson=>{const rows=(lesson.items||[]).flatMap((item,index)=>{
    const answer=String((Array.isArray(item.answer)?item.answer[0]:item.answer)||'');
    const parts=answer.split('|').map(s=>s.trim()).filter(Boolean);
    return parts.map((value,part)=>({key:`${index}:${part}`,index,part,parts:parts.length,n:String(item.n||index+1),value,prompt:String(item.prompt||''),example:Boolean(item.isExample)}));
  });
    for(const row of rows){
      const base=row.n.match(/^(\d+)(?:[a-zA-Z])?$/)?.[1];if(!base)continue;
      const siblings=rows.filter(r=>r.n.match(/^(\d+)(?:[a-zA-Z])?$/)?.[1]===base);
      if(siblings.length>1 && siblings.some(r=>r.n!==base))Object.assign(row,{baseNumber:base,baseSlot:siblings.indexOf(row),baseCount:siblings.length,activeSlot:siblings.filter(r=>!r.example).indexOf(row),activeCount:siblings.filter(r=>!r.example).length});
    }
    return rows;
  };
  R.evidence=(row,target)=>{
    if(target.isExample&&!row.example)return {score:0,reason:'example'};
    if(target.kind==='letters'&&!R.letterValues(target.letterPattern,row.value))return {score:0,reason:'letter-pattern-mismatch'};
    if(target.kind==='text'&&target.maxLength>0&&String(row.value).length>target.maxLength)return {score:0,reason:'field-too-short'};
    const isChoice=['radio','role-radio','select','checkbox'].includes(target.kind);
    if(isChoice&&!R.findOption(target.options||[],row.value))return {score:0,reason:'option-missing-or-ambiguous'};
    let score=isChoice?12:0,reason=isChoice?'unique-option':'no-evidence';
    const set=(s,r)=>{if(s>score){score=s;reason=r;}};
    if(target.kind==='letters'&&target.letterPattern.some(c=>c!==null&&/\p{L}/u.test(c)))set(22+Math.min(8,target.letterPattern.filter(c=>c!==null).length),'fixed-letter-pattern');
    const context=' '+R.words(target.context)+' ',raw=R.prompt(row.prompt),prompt=R.words(raw);
    const number=R.text(target.questionNumber),n=R.text(row.n);
    if(number && row.baseNumber===number && row.baseCount>1){
      if((target.slotCount===row.baseCount&&target.slot===row.baseSlot)||(target.slotCount===row.activeCount&&row.activeSlot>=0&&target.slot===row.activeSlot))set(60,'base-number-and-slot');
    }else if(number && n && number===n){
      if(row.parts>1){if(target.slotCount===row.parts&&target.slot===row.part)set(60,'number-and-slot');}
      // A paragraph number does not identify any one of its several inline blanks.
      // Use local sentence neighbours unless the source explicitly supplies sub-slots.
      else if(!(target.slotCount>1))set(50,'question-number');
    }
    // Short vocabulary is only accepted as the complete local question, not inside a long passage.
    const shortContext=R.words(target.context).replace(/^\d+[a-z]?\s+/,'').replace(/\b(?:drag item here|drop here)\b/g,'').trim();
    if(prompt && shortContext===prompt)set(45,'exact-question');
    const parts=raw.split(/_{2,}|\[(?:blank|gap)\]/gi);
    if(parts.length>1){
      for(const variant of [raw,String(row.prompt||'')]){
      const parts=variant.split(/_{2,}|\[(?:blank|gap)\]/gi);
      const i=Math.min(row.part||0,parts.length-2),left=R.words(parts[i]).split(' ').filter(Boolean).slice(-9),right=R.words(parts[i+1]).split(' ').filter(Boolean).slice(0,9);
      let a=0,b=0;
      for(let n=1;n<=left.length;n++)if((' '+R.words(target.before)).endsWith(' '+left.slice(-n).join(' ')))a=n;
      for(let n=1;n<=right.length;n++)if((R.words(target.after)+' ').startsWith(right.slice(0,n).join(' ')+' '))b=n;
      if(a+b>=4||a>=3||b>=3)set(24+a+b,'blank-neighbours');
      }
    }else if(prompt.split(' ').length>=4){
      if(context.includes(' '+prompt+' '))set(40+Math.min(8,prompt.split(' ').length),'question-text');
      else {
        // Cropped source sentences: require a contiguous distinctive fragment in the local question.
        const tokens=prompt.split(' ');
        for(let size=Math.min(9,tokens.length);size>=5;size--){
          if(tokens.some((_,i)=>i+size<=tokens.length&&context.includes(' '+tokens.slice(i,i+size).join(' ')+' '))){set(20+size,'question-fragment');break;}
        }
      }
    }
    return {score,reason};
  };
  R.assign=(rows,targets,{ordered=false}={})=>{
    const matrix=rows.map(row=>targets.map(target=>R.evidence(row,target)));
    const plan=[];
    rows.forEach((row,ri)=>{
      const ranked=matrix[ri].map((e,ti)=>({...e,ti})).sort((a,b)=>b.score-a.score),best=ranked[0];
      if(!best||best.score<12 || (ranked[1]&&best.score-ranked[1].score<2))return;
      const rivals=matrix.map((es,i)=>({score:es[best.ti].score,i})).sort((a,b)=>b.score-a.score);
      if(rivals[0].i!==ri || (rivals[1]&&rivals[0].score-rivals[1].score<2))return;
      plan.push({row,target:targets[best.ti],rowIndex:ri,targetIndex:best.ti,score:best.score,reason:best.reason});
    });
    // Order is a fallback only when a complete list has at least two independent anchors.
    if(ordered && rows.length===targets.length && plan.length>=2 && plan.every(m=>m.rowIndex===m.targetIndex)){
      const anchors=plan.map(m=>m.rowIndex),first=Math.min(...anchors),last=Math.max(...anchors);
      rows.forEach((row,i)=>{if(i>first&&i<last&&!plan.some(m=>m.rowIndex===i)&&!targets[i].isExample&&!['radio','checkbox','select','role-radio','letters'].includes(targets[i].kind)&&!(targets[i].maxLength>0&&row.value.length>targets[i].maxLength))plan.push({row,target:targets[i],rowIndex:i,targetIndex:i,score:10,reason:'anchored-order'});});
    }
    return {plan,unresolved:rows.filter((_,i)=>!plan.some(m=>m.rowIndex===i)).map(row=>({n:row.n,key:row.key,reason:'ambiguous-or-missing-evidence'}))};
  };
})();
