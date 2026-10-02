/* V11 data adapter. The study seed is preserved verbatim; no study UI/runtime is loaded. */
(() => {
  const M = globalThis.MEL = {};
  M.courses = [['all','Tất cả'],['ta1','Tiếng Anh 1'],['ta2','Tiếng Anh 2'],['ta3','Tiếng Anh 3']];
  M.types = [['all','Tất cả'],['fill_blank','Điền từ'],['type_word','Nhập từ'],['tick_box','Tích ô'],['drag_word','Kéo từ'],['drag_image','Kéo hình'],['choose_image','Chọn hình'],['matching','Nối cặp'],['ordering','Sắp xếp'],['reading','Reading'],['listening','Listening'],['writing','Viết'],['speaking','Nói']];
  M.label = type => M.types.find(x => x[0] === type)?.[1] || type;
  M.text = v => String(v ?? '').trim();
  M.norm = v => M.text(v).normalize('NFKC').toLowerCase().replace(/[‘’]/g,"'").replace(/\s+/g,' ');
  M.enrichCatalog = lessons => lessons.map(lesson=>{
    const verified=(globalThis.MELVerifiedCatalog||[]).find(v=>v.id===lesson.id);
    if(!verified || ['course','section','skill','sectionTitle','exercise'].some(key=>lesson[key]&&verified[key]&&M.norm(lesson[key])!==M.norm(verified[key])))return lesson;
    return {...lesson,section:lesson.section||verified.section,skill:lesson.skill||verified.skill,sectionTitle:lesson.sectionTitle||verified.sectionTitle,exercise:lesson.exercise||verified.exercise,guessed:(lesson.guessed||[]).filter(key=>!verified[key]),activityIds:[...new Set([...(lesson.activityIds||[]),...(verified.activityIds||[])].map(String))]};
  });
  // A listening activity can live under a Grammar header. Match the explicit
  // header category first while retaining skill for the user's library filters.
  M.headerSkill = lesson => M.text(lesson.sectionTitle).match(/^(Vocabulary|Grammar|Reading|Listening|Writing|Speaking|Pronunciation|Functions?)(?:\s*[:：]|\s*$)/i)?.[1].toLowerCase().replace(/^functions$/,'function') || lesson.skill;
  M.isSentenceRanking = l => l.type==='ordering'&&l.items.length>=2&&l.items.every(i=>/^\d+$/.test(i.answer?.[0]||'')&&String(i.prompt||'').trim().split(/\s+/).length>=3);
  M.isCrossword = l => /crossword/i.test(l.title||'') || l.items?.some(i=>/\b(across|down)\b/i.test(i.n));
  M.title = l => [l.section || `Unit ${l.unit}`, l.exercise ? `Ex ${l.exercise}${l.guessed?.includes('exercise') ? '?' : ''}` : l.title, l.sectionTitle].filter(Boolean).join(' · ');
  M.needsReview = l => l.confidence !== 'high' || Boolean(l.reviewNote) || Boolean(l.guessed?.length);
  M.flatten = l => l.items.filter(x => !x.isExample && x.answer.length).flatMap(item => item.answer[0].split('|').map((text, i, parts) => ({n: item.n + (parts.length > 1 ? `.${i + 1}` : ''), value: text.trim(), prompt: item.prompt}))).filter(x => x.value);
  M.normalize = raw => {
    let lessons;
    if (Array.isArray(raw)) lessons = raw;
    else if (raw && Array.isArray(raw.lessons)) lessons = raw.lessons;
    else if (raw && Array.isArray(raw.items)) lessons = [raw];
    else if (raw && typeof raw === 'object') {
      const books = ['ta1','ta2','ta3'].some(c => raw[c]) ? raw : {ta1:raw};
      lessons = [];
      for (const course of ['ta1','ta2','ta3']) for (const [unit, cards] of Object.entries(books[course] || {})) {
        if (!/^\d+$/.test(unit) || !Array.isArray(cards)) continue;
        cards.forEach((c, i) => lessons.push({...c, course, unit:Number(unit), id:c.id || `legacy-${course}-${unit}-${i}`, title:c.title || `Bài nhập ${i + 1}`, items:[{n:'1',prompt:c.prompt,answer:c.answer,hint:c.hint}]}));
      }
      if (!lessons.length) throw new Error('File không có lessons hoặc dữ liệu Unit hợp lệ.');
    } else throw new Error('Định dạng JSON không hợp lệ.');
    const ids = new Set();
    return lessons.map((l, i) => {
      if (!l || typeof l !== 'object' || !['ta1','ta2','ta3'].includes(l.course) || !Number.isInteger(Number(l.unit)) || Number(l.unit) < 1 || Number(l.unit) > 10 || !Array.isArray(l.items)) throw new Error(`Bài ${i + 1}: cần course ta1/ta2/ta3, unit 1–10 và items.`);
      const id = M.text(l.id) || `import-${l.course}-${l.unit}-${M.text(l.section)}-${M.text(l.exercise)}-${i}`;
      if (ids.has(id)) throw new Error(`Trùng mã bài: ${id}`);
      ids.add(id);
      const items = l.items.map((it, j) => {
        if (!it || typeof it !== 'object') throw new Error(`Bài ${i + 1}, câu ${j + 1}: dữ liệu không hợp lệ.`);
        const a = it.answer ?? it.answers ?? [];
        return {...it, n:M.text(it.n) || String(j + 1), prompt:M.text(it.prompt || it.question), answer:(Array.isArray(a) ? a : [a]).map(M.text).filter(Boolean), isExample:Boolean(it.isExample)};
      });
      return {...l,id,unit:Number(l.unit),type:M.text(l.type) || 'type_word',section:M.text(l.section),exercise:M.text(l.exercise),title:M.text(l.title),items};
    });
  };
  M.merge = (base, updates) => [...new Map([...base,...updates].map(l => [l.id,l])).values()];
  M.nativePlan = (lesson,fields,onlyN='') => {
    // Rank numbers repeat within each paragraph. Use the sentence on the input's
    // own line, not the paragraph's number, slot order or shared block context.
    const sentenceRanking=M.isSentenceRanking(lesson);
    if(sentenceRanking)fields=fields.map(f=>f.lineContext&&['text','select'].includes(f.kind)?{...f,context:f.lineContext,questionNumber:'',before:'',after:''}:f);
    if(!lesson.items.some(i=>!i.isExample&&i.answer.length) && lesson.modelAnswer?.text && fields.length===1 && fields[0].kind==='text')return {complete:true,expected:1,actions:[{ref:fields[0].ref,value:lesson.modelAnswer.text,n:'bài viết',reason:'single-writing-field'}],unresolved:[]};
    const rows=MELRules.rows(lesson),expected=rows.filter(r=>!r.example&&(!onlyN||r.n===String(onlyN)));
    let matched=MELRules.assign(rows,fields,{ordered:!sentenceRanking});
    if(fields.length===rows.filter(r=>!r.example).length){
      const withoutExamples=MELRules.assign(rows.filter(r=>!r.example),fields,{ordered:!sentenceRanking});
      if(withoutExamples.plan.length>matched.plan.filter(m=>!m.row.example).length)matched=withoutExamples;
    }
    const plan=matched.plan.filter(m=>expected.includes(m.row));
    const unresolved=expected.filter(row=>!plan.some(m=>m.row===row));
    const actions=plan.map(m=>({ref:m.target.ref,value:m.row.value,checked:true,n:m.row.n,reason:m.reason}));
    // A multi-select answer is a complete selection for its numbered question.
    for(const field of fields.filter(f=>f.kind==='checkbox'&&!f.isExample&&!actions.some(a=>a.ref===f.ref))){
      const related=plan.filter(m=>m.target.groupKey && m.target.groupKey===field.groupKey);
      const onlyQuestion=expected.length && new Set(expected.map(r=>r.n)).size===1 && related.length;
      const completeQuestion=related.length ? (field.questionNumber ? expected.filter(r=>r.n===field.questionNumber) : onlyQuestion ? expected : []) : [];
      if(completeQuestion.length && completeQuestion.every(r=>related.some(m=>m.row===r)))actions.push({ref:field.ref,value:field.options[0].text,checked:false,n:field.questionNumber,reason:'unchecked-option'});
    }
    return {complete:expected.length>0&&!unresolved.length,expected:expected.length,actions,unresolved:unresolved.map(r=>({n:r.n,value:r.value}))};
  };
  M.matchChoices = (fields, answers) => {
    const rows=answers.map((a,index)=>({...a,key:String(index),part:0,parts:1,example:false}));
    const result=MELRules.assign(rows,fields);
    return result.plan.length===rows.length ? rows.map(row=>result.plan.find(m=>m.row===row).target) : null;
  };
  M.match = (lessons, pages, links = {}) => {
    if(pages.some(p=>p.identityConflict))return null;
    lessons=M.enrichCatalog(lessons);
    const unique=key=>[...new Set(pages.map(p=>M.text(p[key])).filter(Boolean))];
    const sections=unique('section'),exercises=unique('exercise'),skills=unique('skill');
    const section=sections.length===1?sections[0]:'',exercise=exercises.length===1?exercises[0]:'',skill=skills.length===1?skills[0]:'';
    if(sections.length>1 || exercises.length>1 || /\//.test(exercise))return null;
    const compatible=l=>(!section || !l.section || l.section===section) && (!exercise || !l.exercise || M.norm(l.exercise)===M.norm(exercise)) && (!skill || !M.headerSkill(l) || M.headerSkill(l)===skill);
    const result=(lesson,reason)=>({lesson,reason,detected:{lessonId:lesson.id,section,exercise,sectionTitle:pages.find(p=>p.sectionTitle)?.sectionTitle || ''}});
    for (const page of pages) {
      const key = page.activityId ? `${page.origin}:${page.activityId}` : '';
      if (key && links[key]) { const linked = lessons.find(l => l.id === links[key]); if (linked && compatible(linked)) return result(linked,'Bài bạn đã liên kết'); }
    }
    const activityMatches=lessons.filter(l=>compatible(l)&&pages.some(p=>p.activityId&&(l.activityIds||[]).map(String).includes(String(p.activityId))));
    if(activityMatches.length===1)return result(activityMatches[0],'Activity ID có trong kho nguồn và tiêu đề không mâu thuẫn');
    const exact=section && exercise ? lessons.filter(l=>compatible(l) && l.section===section && M.norm(l.exercise)===M.norm(exercise)) : [];
    if(exact.length===1)return result(exact[0],'Khớp section / exercise');
    // A source may put the complete alternatives in parentheses. They are question
    // content, not annotations. Require several complete, distinct option groups.
    const choiceKey=options=>options.map(MELRules.option).sort().join('\u0001');
    const choiceGroups=new Set(pages.flatMap(p=>p.choiceGroups||[]).filter(g=>g.length>=2).map(choiceKey));
    const choiceCandidates=lessons.filter(compatible).map(lesson=>{
      const groups=new Set();let total=0;
      for(const item of lesson.items||[]){
        const raw=String(item.prompt||'').trim();
        const options=(raw.startsWith('(')&&raw.endsWith(')')?raw.slice(1,-1):raw).split(/\s+\/\s+/).map(s=>s.trim());
        if(options.length<2||options.some(s=>s.split(/\s+/).length<3)||new Set(options.map(MELRules.option)).size!==options.length)continue;
        total++;const key=choiceKey(options);if(choiceGroups.has(key))groups.add(key);
      }
      return {lesson,count:groups.size,total};
    }).filter(c=>c.count>=3&&c.count/c.total>=0.75).sort((a,b)=>b.count-a.count);
    if(choiceCandidates[0]&&(!choiceCandidates[1]||choiceCandidates[0].count>choiceCandidates[1].count))return result(choiceCandidates[0].lesson,`Khớp đầy đủ lựa chọn của ${choiceCandidates[0].count} câu`);
    // Word-order tasks must match per-question token multisets, not shuffled sentence order.
    const bag=v=>M.norm(v).replace(/[^\p{L}\p{N}'\s-]/gu,' ').split(/\s+/).filter(Boolean).sort().join('\u0001');
    const banks=[...new Set(pages.flatMap(p=>p.orderingGroups||[]).map(tokens=>bag(tokens.join(' '))).filter(Boolean))];
    const ordering=lessons.filter(l=>l.type==='ordering'&&compatible(l)).map(lesson=>{
      const matched=new Set();
      for(const item of lesson.items.filter(i=>!i.isExample)){
        for(const text of [item.prompt.includes('/')?item.prompt:'',...(item.answer||[])]){
          if(!text||text.includes('|'))continue;const key=bag(text);if(key.split('\u0001').length>=4&&banks.includes(key))matched.add(key);
        }
      }
      return {lesson,count:matched.size};
    }).filter(x=>x.count>=2).sort((a,b)=>b.count-a.count);
    if(ordering[0]&&(!ordering[1]||ordering[0].count>ordering[1].count))return result(ordering[0].lesson,`Khớp bộ từ của ${ordering[0].count} câu sắp xếp`);
    // Many source lessons have no exercise number. Require distinctive text from multiple questions.
    const words=v=>M.norm(v).replace(/[^\p{L}\p{N}']+/gu,' ').trim().replace(/\s+/g,' ');
    const pageText=' '+words(pages.map(p=>p.questionText || '').join(' '))+' ';
    // Short matching prompts need evidence from both columns, not just a common verb.
    // Keep meaningful parenthesised words such as "take (that) up".
    const pairs=lessons.filter(l=>l.type==='matching'&&compatible(l)).map(lesson=>{
      const items=lesson.items.filter(i=>!i.isExample&&/→\s*\?\s*$/.test(i.prompt));
      const left=new Set(),right=new Set();let count=0;
      for(const item of items){
        const a=words(item.prompt.replace(/→\s*\?\s*$/,''));
        const matches=(item.answer||[]).map(words).filter(b=>b.split(' ').length>=2&&pageText.includes(' '+b+' '));
        if(a.split(' ').length<2||!pageText.includes(' '+a+' ')||matches.length!==1||left.has(a)||right.has(matches[0]))continue;
        left.add(a);right.add(matches[0]);count++;
      }
      return {lesson,count,total:items.length};
    }).filter(c=>c.count>=3&&c.count/c.total>=0.75).sort((a,b)=>b.count-a.count);
    if(pairs[0]&&(!pairs[1]||pairs[0].count>pairs[1].count))return result(pairs[0].lesson,`Khớp cả hai vế của ${pairs[0].count} cặp nội dung`);
    const uncertainTopic=l=>!l.exercise && l.guessed?.includes('section') && (!section || l.section===section);
    const candidates=lessons.filter(l=>compatible(l)||uncertainTopic(l)).map(lesson=>{
      let rows=0,score=0,answerRows=0;
      for(const item of lesson.items || []){
        let best=0;
        for(const fragment of String(item.prompt || '').replace(/\([^)]*\)/g,' ').split(/_{2,}|\[(?:blank|gap)\]/gi)){
          const tokens=words(fragment.replace(/^\s*[A-Z]\s*:\s*/,'')).split(' ').filter(Boolean);
          for(let size=Math.min(8,tokens.length);size>=4;size--){
            let matched=false;for(let i=0;i<=tokens.length-size;i++)if(pageText.includes(' '+tokens.slice(i,i+size).join(' ')+' ')){best=Math.max(best,size);matched=true;break;}
            if(matched)break;
          }
        }
        if(best>=4){rows++;score+=best;if(!item.isExample)answerRows++;}
      }
      return {lesson,rows,score,answerRows};
    }).filter(c=>c.rows>=2 && c.score>=10 && (compatible(c.lesson) || (c.answerRows>=3 && c.score>=18))).sort((a,b)=>b.score-a.score);
    const best=candidates[0],second=candidates[1];
    if(best && (!second || best.score-second.score>=5))return result(best.lesson,'Khớp nội dung nhiều câu trên trang');
    return null;
  };
  M.allowedURL = value => { try { const u = new URL(value); return u.protocol === 'https:' && ['pearson.com','myenglishlab.com','pearson-intl.com'].some(h => u.hostname === h || u.hostname.endsWith('.' + h)); } catch { return false; } };
})();
