const $ = id => document.getElementById(id);
const input = $('chapter');
const sample = `Mara had always believed that the house remembered everything. The staircase creaked in the same place where her father had paused to listen for the storm, and the kitchen window still refused to close unless someone lifted it with both hands. On the morning she decided to leave, the sky was the colour of old paper.

Although she had rehearsed the conversation dozens of times, she found herself unable to explain why the decision, which had seemed perfectly reasonable in the quiet of her bedroom, became almost impossible to articulate when her brother finally appeared in the doorway. He looked at the suitcase, then at her, and waited.

“I'll write,” she said.

It was not a promise either of them believed. Outside, a bus sighed at the corner, releasing a handful of passengers into the rain. Mara picked up the key, considered the weight of it in her palm, and placed it carefully on the table beside the untouched cup of tea.`;
function sentencesOf(text){
  return (text.replace(/\s+/g,' ').match(/[^.!?]+[.!?]+["'”’)]*|[^.!?]+$/g)||[]).map(s=>s.trim()).filter(Boolean);
}
function wordsOf(text){return text.match(/\b[\w’'-]+\b/g)||[]}
function syllables(word){
  let w=word.toLowerCase().replace(/[^a-z]/g,''); if(!w) return 1;
  if(w.length<=3) return 1;
  w=w.replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/,'').replace(/^y/,'');
  const m=w.match(/[aeiouy]{1,2}/g); return Math.max(1,m?m.length:1);
}
function countSyllables(words){return words.reduce((n,w)=>n+syllables(w),0)}
function flesch(words,sentences){
  if(!words.length||!sentences.length)return null;
  const syll=countSyllables(words);
  return 206.835-1.015*(words.length/sentences.length)-84.6*(syll/words.length);
}
function gradeLevel(words,sentences){
 if(!words.length||!sentences.length)return null;
 return 0.39*(words.length/sentences.length)+11.8*(countSyllables(words)/words.length)-15.59;
}
function complexity(sentence){
 const words=wordsOf(sentence), n=Math.max(words.length,1), syll=countSyllables(words);
 const long=words.filter(w=>syllables(w)>=3).length;
 const connectors=(sentence.match(/\b(although|because|while|whereas|which|that|who|whom|whose|unless|until|despite|therefore|however|nevertheless|if|when|whenever|since|after|before|as though|even though)\b/gi)||[]).length;
 const punctuation=(sentence.match(/[;:—–(),]/g)||[]).length;
 const passive=(sentence.match(/\b(am|is|are|was|were|be|been|being)\s+\w+(ed|en)\b/gi)||[]).length;
 const score=Math.round((n*0.55)+(long*2.4)+(connectors*2.8)+(punctuation*0.8)+(passive*1.6));
 const reasons=[];
 if(n>=24) reasons.push(`${n} words`);
 if(long>=3) reasons.push(`${long} long words`);
 if(connectors>=2) reasons.push(`${connectors} linking clauses`);
 if(punctuation>=3) reasons.push('dense punctuation');
 if(passive) reasons.push('possible passive phrasing');
 return {sentence,score,words:n,reasons:reasons.length?reasons:['overall sentence structure']};
}
function level(score){
 if(score>=90)return ['Very easy','Easy for most readers'];
 if(score>=80)return ['Easy','Comfortable to read'];
 if(score>=70)return ['Fairly easy','Clear for most adult readers'];
 if(score>=60)return ['Standard','Plain, accessible language'];
 if(score>=50)return ['Fairly difficult','May need a slower read'];
 if(score>=30)return ['Difficult','Consider simplifying selected passages'];
 return ['Very difficult','Dense text; review sentence structure'];
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function updateCount(){const t=input.value; $('counts').textContent=`${wordsOf(t).length.toLocaleString()} words · ${sentencesOf(t).length} sentences`;}
input.addEventListener('input',updateCount);
$('sample').addEventListener('click',()=>{input.value=sample;updateCount();runAnalysis()});
$('analyze').addEventListener('click',runAnalysis);
function runAnalysis(){
 const text=input.value.trim(), words=wordsOf(text), sents=sentencesOf(text);
 if(!words.length||!sents.length){$('status').textContent='Add some text';$('results').innerHTML='<div class="empty"><div class="empty-inner"><div class="empty-icon">✎</div><h3>Ready when you are</h3><p>Paste a word, sentence, or chapter to get a readability estimate.</p></div></div>';return}
 const score=Math.max(0,Math.min(100,Math.round(flesch(words,sents))));
 const grade=Math.max(0,gradeLevel(words,sents));
 const [band,desc]=level(score);
 const reliability=words.length<20||sents.length<2?'Short-text estimate · add more writing for a steadier result':'Based on the Flesch Reading Ease formula';
 const hard=sents.map(complexity).sort((a,b)=>b.score-a.score).slice(0,5);
 const selected=new Set(hard.map(x=>x.sentence));
 const highlighted=sents.map(s=>selected.has(s)?`<mark>${escapeHtml(s)}</mark>`:escapeHtml(s)).join(' ');
 $('status').textContent='Analysis complete';
 $('results').innerHTML=`
 <div class="stats">
  <div class="stat"><div class="stat-label">Reading ease</div><div class="stat-value">${score}<span style="font-size:13px;color:#667085">/100</span></div><div class="meter"><span style="width:${score}%"></span></div><div class="stat-note">Higher usually means easier</div></div>
  <div class="stat"><div class="stat-label">Estimated grade</div><div class="stat-value">${grade.toFixed(1)}</div><div class="stat-note">Approximate US school grade</div></div>
 </div>
 <div class="band">${band} · ${desc}</div>
 <div class="section-title"><span>Five sentences to review</span><span class="subtle">Ranked by estimated complexity</span></div>
 <div class="sentence-list">${hard.map((x,i)=>`<article class="sentence"><div class="sentence-top"><span class="sentence-num">Sentence ${sents.indexOf(x.sentence)+1}</span><span class="sentence-score">Complexity ${x.score}</span></div><p>${escapeHtml(x.sentence)}</p><small>${x.reasons.join(' · ')}</small></article>`).join('')}</div>
 <div class="preview"><div class="section-title"><span>Chapter view</span><span class="subtle">Highlighted = review</span></div><div class="preview-box">${highlighted}</div></div>
 <p class="note">${reliability}. This is a local heuristic, not an AI editor. Readability formulas can miss tone, genre, dialogue, and intentional stylistic choices. The “hardest” ranking is an estimate based on length, long words, clause signals, punctuation, and possible passive phrasing.</p>`;
}
updateCount();
