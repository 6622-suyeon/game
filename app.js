'use strict';
const $=id=>document.getElementById(id), key='math-upgrade-school-v1';
const today=()=>{const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;};
const initial=()=>({grade:5,level:0,stones:0,correct:0,streak:0,bestStreak:0,reviewed:0,mistakes:[],daily:{date:today(),correct:0,claimed:false},adventure:{wins:0,damage:0},xp:0,learning:{},settings:{sound:false,focus:false,topic:-1}});
let mode='practice';
function refreshDay(){if(state.daily.date!==today())state.daily={date:today(),correct:0,claimed:false};}
let state=initial(), question, answered=false, count=0;
const natural=n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000000;
function restoreSave(saved){
 if(!saved||![5,6].includes(saved.grade)||!['level','stones','correct','streak'].every(k=>natural(saved[k])))throw new Error('올바른 게임 기록이 아니에요.');
 const clean=initial();
 for(const k of ['grade','level','stones','correct','streak'])clean[k]=saved[k];
 clean.bestStreak=Math.max(clean.streak,natural(saved.bestStreak)?saved.bestStreak:0);
 clean.reviewed=natural(saved.reviewed)?saved.reviewed:0;
 clean.mistakes=Array.isArray(saved.mistakes)?saved.mistakes.filter(q=>q&&[5,6].includes(q.grade)&&MathGame.topics[q.grade].includes(q.topic)&&typeof q.text==='string'&&q.text.length<1000&&typeof q.explanation==='string'&&q.explanation.length<2000&&Number.isFinite(q.answer)).slice(0,100).map(q=>({grade:q.grade,topic:q.topic,text:q.text,explanation:q.explanation,answer:q.answer})):[];
 if(saved.daily&&typeof saved.daily.date==='string'&&/^\d{4}-\d{1,2}-\d{1,2}$/.test(saved.daily.date)&&natural(saved.daily.correct)&&typeof saved.daily.claimed==='boolean')clean.daily={date:saved.daily.date,correct:saved.daily.correct,claimed:saved.daily.claimed};
 if(saved.adventure&&natural(saved.adventure.wins)&&saved.adventure.wins<=1000000)clean.adventure={wins:saved.adventure.wins,damage:natural(saved.adventure.damage)&&saved.adventure.damage<8+(saved.adventure.wins%5)*2?saved.adventure.damage:0};
 clean.xp=natural(saved.xp)?saved.xp:0;
 for(const grade of [5,6])for(const topic of MathGame.topics[grade]){
  const id=grade+':'+topic, record=saved.learning?.[id];
  if(record&&natural(record.attempts)&&natural(record.correct)&&record.correct<=record.attempts)clean.learning[id]={attempts:record.attempts,correct:record.correct};
 }
 if(saved.settings)clean.settings={sound:saved.settings.sound===true,focus:saved.settings.focus===true,topic:Number.isInteger(saved.settings.topic)&&saved.settings.topic>=-1&&saved.settings.topic<4?saved.settings.topic:-1};
 return clean;
}
let session={attempts:0,correct:0},audioContext;
try{const raw=localStorage.getItem(key);if(raw)state=restoreSave(JSON.parse(raw));}catch{$('backupStatus').textContent='저장 기록을 읽지 못했어요. 백업 파일이 있다면 불러와 주세요.';}
const regions=[
 {name:'새싹 숲',guardian:'잠든 나무 수호자',icon:'🌳',story:'숲의 길이 잠들었어요. 정답의 빛으로 나무 수호자를 깨워 주세요.',relic:'새싹의 잎',symbol:'🍃'},
 {name:'달빛 호수',guardian:'안개 속 물의 정령',icon:'🌊',story:'호수에 안개가 가득해요. 검의 빛으로 별빛 길을 밝혀 주세요.',relic:'달빛 진주',symbol:'🦪'},
 {name:'수정 동굴',guardian:'수정 골렘',icon:'💎',story:'별빛이 수정 안에 갇혔어요. 골렘과 힘을 합쳐 빛을 꺼내요.',relic:'무지개 수정',symbol:'💎'},
 {name:'구름 성',guardian:'바람의 기사',icon:'🏰',story:'구름 위 기사가 기다려요. 수학의 힘으로 용기를 보여 주세요.',relic:'바람의 깃털',symbol:'🪶'},
 {name:'별빛 정상',guardian:'별을 지키는 용',icon:'🐉',story:'마지막 별이 빛을 잃었어요. 용과 함께 하늘에 별빛을 돌려줘요.',relic:'별빛 왕관',symbol:'👑'}
];
const guardianMax=wins=>8+(wins%5)*2;
const attackPower=()=>1+Math.min(4,Math.floor(state.level/5));
// Older saves start at the first region; malformed progress cannot grant rewards.
if(!state.adventure||!Number.isSafeInteger(state.adventure.wins)||state.adventure.wins<0||state.adventure.wins>1000000)state.adventure={wins:0,damage:0};
if(!Number.isSafeInteger(state.adventure.damage)||state.adventure.damage<0||state.adventure.damage>=guardianMax(state.adventure.wins))state.adventure.damage=0;
function renderAdventure(){
 const {wins,damage}=state.adventure, current=wins%5, region=regions[current], max=guardianMax(wins);
 $('adventureRound').textContent=`${Math.floor(wins/5)+1}번째 원정 · ${wins}지역 돌파`;
 $('adventureMap').replaceChildren(...regions.map((r,i)=>{const li=document.createElement('li');li.textContent=`${i<current?'✓':r.icon} ${r.name}`;if(i===current)li.setAttribute('aria-current','step');if(i<current)li.className='visited';return li;}));
 $('guardianIcon').textContent=region.icon;$('guardianName').textContent=region.guardian;$('guardianStory').textContent=region.story;
 $('guardianHealth').max=max;$('guardianHealth').value=max-damage;
 $('guardianHealthLabel').textContent=`남은 봉인 ${max-damage} / ${max}`;
 $('attackPower').textContent=`새 문제 정답당 봉인 −${attackPower()} · 검 강화 5단계마다 힘 +1 (최대 5) · 돌파 보상 ✦ ${3+current}개`;
 $('relicCount').textContent=`${Math.min(5,wins)} / 5개 수집`;
 $('relics').replaceChildren(...regions.map((r,i)=>{const li=document.createElement('li'),owned=wins>i;li.textContent=owned?`${r.symbol} ${r.relic}`:'🔒 미발견 유물';li.className=owned?'collected':'';return li;}));
}
function advanceAdventure(){
 const a=state.adventure,region=regions[a.wins%5],power=attackPower();
 a.damage+=power;
 if(a.damage>=guardianMax(a.wins)){
  const reward=3+a.wins%5, first=a.wins<5;a.wins++;a.damage=0;state.stones+=reward;
  const message=`${region.name} 돌파! ✦ 강화석 ${reward}개! ${first?`${region.symbol} ${region.relic} 획득!`:'수호자와 다시 힘을 모았어요!'}${a.wins%5===0?' 다섯 지역에 별빛이 돌아왔어요! 새로운 원정이 시작돼요.':''}`;
  $('adventureEvent').textContent=message;return ' 🗺️ '+message;
 }
 $('adventureEvent').textContent=`⚔️ 정답의 빛! ${region.guardian}의 봉인을 ${power}만큼 풀었어요.`;return '';
}
function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch{$('forgeNote').textContent='브라우저 저장이 제한되어 있어요. 현재 화면에서는 계속 플레이할 수 있어요.';}}
function render(){
 refreshDay();
 renderAdventure();
 renderLearning();
 const pending=state.mistakes.filter(q=>q.grade===state.grade).length;
 $('reviewCount').textContent=pending;
 $('practiceMode').setAttribute('aria-pressed',String(mode==='practice'));
 $('reviewMode').setAttribute('aria-pressed',String(mode==='review'));
 $('modeNote').textContent=mode==='review'?'현재 학년의 틀린 문제를 다시 풀어요. 정답을 맞히면 강화석 1개!':'새 문제를 풀어 연속 정답 보너스와 오늘의 미션에 도전해요.';
 $('dailyProgress').value=Math.min(5,state.daily.correct);
 $('dailyStatus').textContent=state.daily.claimed?'미션 완료! 강화석 3개를 받았어요.':`${Math.min(5,state.daily.correct)} / 5개 정답`;
 const badges=[['첫 정답',state.correct>=1],['3연속 정답',state.bestStreak>=3],['강화 +5',state.level>=5],['복습 해결사',state.reviewed>=3],['정답 20개',state.correct>=20],['전설의 검',state.level>=20]];
 $('badges').replaceChildren(...badges.map(([name,unlocked])=>{const li=document.createElement('li');li.textContent=`${unlocked?'🏅':'🔒'} ${name}`;li.className=unlocked?'earned':'';li.setAttribute('aria-label',`${name}: ${unlocked?'달성':'미달성'}`);return li;}));
 $('level').textContent=`+${state.level}`;$('stones').textContent=state.stones;$('correct').textContent=state.correct;$('streak').textContent=state.streak;
 const tier=Math.min(4,Math.floor(state.level/5));$('weaponName').textContent=['연습용 검','청동 기사 검','은빛 수호자 검','보랏빛 마법 검','전설의 별빛 검'][tier];$('rank').textContent=['새싹 모험가','수학 탐험가','문제 해결사','강화 마스터','전설의 수학 용사'][tier];$('weapon').dataset.tier=tier;$('weapon').textContent=['⚔️','🗡️','⚔️','🔮','🌟'][tier];
 $('progress').style.width=state.level>=20?'100%':`${state.level%5*20}%`;$('goal').textContent=state.level>=20?'전설 달성! 계속 강화할 수 있어요.':`다음 모습까지 ${5-state.level%5}단계`;$('upgrade').disabled=state.stones<1;
 const batch=Math.min(state.stones,5-state.level%5);$('upgradeBatch').disabled=state.stones<1;$('upgradeBatch').textContent=`${state.level>=20?'다음 5단계까지':'다음 진화까지'} 강화 · ${batch}개 사용`;
 document.querySelectorAll('.grade').forEach(b=>{b.classList.toggle('active',Number(b.dataset.grade)===state.grade);b.setAttribute('aria-pressed',String(Number(b.dataset.grade)===state.grade));});
}
function nextQuestion(){
 $('hintText').hidden=true;$('hint').setAttribute('aria-expanded','false');$('hint').disabled=false;
 if(mode==='review'){
  question=state.mistakes.find(q=>q.grade===state.grade);
  if(!question){$('hint').disabled=true;answered=true;$('topic').textContent='오답 복습';$('questionNumber').textContent='';$('question').textContent='복습할 문제가 없어요! 새 문제에 도전해 볼까요?';$('answer').value='';$('answer').disabled=true;$('submit').disabled=true;$('next').hidden=true;$('feedback').textContent='';$('feedback').className='';render();return;}
 }else question=MathGame.makeQuestion(state.grade,state.settings.topic);answered=false;count++;$('topic').textContent=`${state.grade}학년 · ${question.topic}`;$('questionNumber').textContent=`도전 ${count}`;$('question').textContent=question.text;$('answer').value='';$('answer').disabled=false;$('submit').disabled=false;$('feedback').textContent='';$('feedback').className='';$('next').hidden=true;}
$('answerForm').addEventListener('submit',e=>{e.preventDefault();if(answered)return;const value=$('answer').value;if(!Number.isFinite(MathGame.parseAnswer(value))){$('feedback').className='bad';$('feedback').textContent='숫자 또는 분수로 입력해 주세요. 예: 12, 0.5, 1/2';return;}answered=true;const good=MathGame.isCorrect(value,question.answer);let message;
 refreshDay();
 session.attempts++;if(good){session.correct++;state.xp+=10;}
 if(mode==='practice'){const id=state.grade+':'+question.topic,record=state.learning[id]||(state.learning[id]={attempts:0,correct:0});record.attempts++;if(good)record.correct++;}
 playTone(good?'correct':'wrong');
 if(good){
  state.correct++;state.stones++;
  message='정답이에요! ✦ 강화석 1개와 경험치 10 XP를 얻었어요.';
  if(state.xp%50===0)message+=` 🌟 모험가 Lv.${Math.floor(state.xp/50)+1} 달성!`;
  if(mode==='review'){
   state.mistakes=state.mistakes.filter(q=>!(q.grade===state.grade&&q.text===question.text));state.reviewed++;
   message+=' 오답 하나를 해결했어요!';
  }else{
   state.streak++;state.bestStreak=Math.max(state.bestStreak,state.streak);state.daily.correct++;
   message+=advanceAdventure();
   if(state.streak%3===0){state.stones++;message+=' 🔥 3연속 정답 보너스 +1개!';}
   if(state.daily.correct>=5&&!state.daily.claimed){state.daily.claimed=true;state.stones+=3;message+=' 🎯 오늘의 미션 달성! +3개!';}
  }
 }else{
  if(mode==='practice'){state.streak=0;$('adventureEvent').textContent='잠시 쉬어 가도 괜찮아요. 봉인은 그대로예요. 풀이를 보고 다시 도전해요!';}
  if(!state.mistakes.some(q=>q.grade===state.grade&&q.text===question.text)){
   if(state.mistakes.length>=100)state.mistakes.shift();
   state.mistakes.push({...question,grade:state.grade});
  }
  message='괜찮아요! 풀이를 보고 다시 도전해요. 오답 복습에 저장했어요.';
 }
 $('feedback').className=good?'good':'bad';$('feedback').textContent=message+'\n'+question.explanation;
 $('answer').disabled=true;$('submit').disabled=true;$('next').hidden=false;render();save();});
for(const [id,value] of [['practiceMode','practice'],['reviewMode','review']])$(id).addEventListener('click',()=>{if(mode===value)return;mode=value;render();nextQuestion();});
$('next').addEventListener('click',()=>{nextQuestion();$('answer').focus();});
document.querySelectorAll('.grade').forEach(b=>b.addEventListener('click',()=>{const grade=Number(b.dataset.grade);if(state.grade===grade)return;state.grade=grade;state.settings.topic=-1;populateTopics();$('recommendNote').textContent='';state.streak=0;render();save();nextQuestion();}));
$('upgrade').addEventListener('click',()=>{if(state.stones<1)return;state.stones--;state.level++;playTone('upgrade');render();save();$('forgeNote').textContent=`강화 성공! ${$('weaponName').textContent} +${state.level} 달성!`;$('weapon').classList.add('pop');setTimeout(()=>$('weapon').classList.remove('pop'),350);});
$('reset').addEventListener('click',()=>{if(!confirm('강화 단계와 학습 기록을 모두 초기화할까요?'))return;state=initial();count=0;mode='practice';session={attempts:0,correct:0};populateTopics();$('recommendNote').textContent='';$('adventureEvent').textContent='새 원정이 시작됐어요! 새 문제를 풀어 숲의 수호자를 깨워 주세요.';save();render();nextQuestion();$('forgeNote').textContent='정답을 맞히면 강화석을 얻어요. 강화는 100% 성공!';});
function populateTopics(){
 $('topicSelect').replaceChildren(...['모든 단원 섞어서',...MathGame.topics[state.grade]].map((name,i)=>{const option=document.createElement('option');option.value=String(i-1);option.textContent=name;return option;}));
 $('topicSelect').value=String(state.settings.topic);
}
function renderLearning(){
 $('learnerLevel').textContent=`모험가 Lv.${Math.floor(state.xp/50)+1}`;
 $('xpLabel').textContent=`누적 ${state.xp} XP · 다음 레벨까지 ${50-state.xp%50} XP`;$('xpProgress').value=state.xp%50;
 const records=Object.values(state.learning),attempts=records.reduce((n,r)=>n+r.attempts,0),correct=records.reduce((n,r)=>n+r.correct,0);
 $('accuracy').textContent=attempts?`${Math.round(correct/attempts*100)}% · ${correct}/${attempts}개`:'첫 기록을 만들어 보세요';
 $('sessionSummary').textContent=`${session.attempts}문제 도전 · ${session.correct}개 정답`;
 $('topicStats').replaceChildren(...MathGame.topics[state.grade].map(topic=>{const li=document.createElement('li'),r=state.learning[state.grade+':'+topic];const title=document.createElement('strong'),detail=document.createElement('span');title.textContent=topic;detail.textContent=r?.attempts?`${r.correct}/${r.attempts}개 정답 · ${Math.round(r.correct/r.attempts*100)}%`:'아직 도전 전';li.append(title,detail);return li;}));
 document.body.classList.toggle('focus-mode',state.settings.focus);
 $('focusToggle').setAttribute('aria-pressed',String(state.settings.focus));$('focusToggle').textContent=state.settings.focus?'전체 화면으로 돌아가기':'집중 화면 켜기';
 $('soundToggle').setAttribute('aria-pressed',String(state.settings.sound));$('soundToggle').textContent=state.settings.sound?'♪ 효과음 켜짐':'♪ 효과음 꺼짐';
 $('topicSelect').disabled=mode==='review';$('recommend').disabled=mode==='review';
}
function playTone(kind){
 if(!state.settings.sound)return;
 try{
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
  audioContext ||=new Audio();if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
  const tones=kind==='wrong'?[220]:kind==='upgrade'?[392,494,587]:[523,659];
  tones.forEach((frequency,i)=>{const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),start=audioContext.currentTime+i*.1;oscillator.frequency.value=frequency;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.06,start+.01);gain.gain.exponentialRampToValueAtTime(.001,start+.18);oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(start);oscillator.stop(start+.2);});
 }catch{/* Sound is optional; learning remains available without audio support. */}
}
$('topicSelect').addEventListener('change',()=>{state.settings.topic=Number($('topicSelect').value);state.streak=0;$('recommendNote').textContent='선택한 단원의 새 문제가 나와요.';save();render();nextQuestion();});
$('recommend').addEventListener('click',()=>{
 const list=MathGame.topics[state.grade].map((topic,i)=>({topic,i,r:state.learning[state.grade+':'+topic]}));
 list.sort((a,b)=>(a.r?.attempts?a.r.correct/a.r.attempts:-1)-(b.r?.attempts?b.r.correct/b.r.attempts:-1)||(a.r?.attempts||0)-(b.r?.attempts||0));
 state.settings.topic=list[0].i;state.streak=0;populateTopics();$('recommendNote').textContent=list[0].r?.attempts?`${list[0].topic}: 정답률이 낮은 단원부터 차근차근 연습해요.`:`${list[0].topic}: 아직 기록이 없는 단원부터 시작해요.`;save();render();nextQuestion();
});
$('hint').addEventListener('click',()=>{if(!question)return;$('hintText').textContent=MathGame.hints[question.topic]||'문제에 나온 수와 구하려는 것을 먼저 찾아보세요.';$('hintText').hidden=!$('hintText').hidden;$('hint').setAttribute('aria-expanded',String(!$('hintText').hidden));});
$('soundToggle').addEventListener('click',()=>{state.settings.sound=!state.settings.sound;playTone('correct');save();render();});
$('focusToggle').addEventListener('click',()=>{state.settings.focus=!state.settings.focus;save();render();if(state.settings.focus)$('question').focus();});
$('upgradeBatch').addEventListener('click',()=>{const amount=Math.min(state.stones,5-state.level%5);if(amount<1)return;state.stones-=amount;state.level+=amount;playTone('upgrade');render();save();$('forgeNote').textContent=`${amount}단계 강화 성공! ${$('weaponName').textContent} +${state.level}`;});
$('exportSave').addEventListener('click',()=>{
 const file=new Blob([JSON.stringify({format:'math-upgrade-school',version:1,state},null,2)],{type:'application/json'}),url=URL.createObjectURL(file),link=document.createElement('a');link.href=url;link.download=`math-school-${today()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('backupStatus').textContent='백업 파일을 다운로드했어요. 안전한 곳에 보관해 주세요.';
});
$('importSave').addEventListener('change',async e=>{
 const file=e.target.files[0];if(!file)return;
 try{
  if(file.size>1000000)throw new Error('1MB 이하의 게임 백업 파일을 선택해 주세요.');
  const data=JSON.parse(await file.text());if(data.format!=='math-upgrade-school'||data.version!==1)throw new Error('이 게임에서 다운로드한 백업 파일을 선택해 주세요.');
  const restored=restoreSave(data.state);
  if(!confirm('현재 기록을 백업 파일의 기록으로 바꿀까요? 현재 기록은 먼저 백업해 두는 것을 추천해요.'))return;
  // Preserve the current progress if persistent storage is unavailable.
  localStorage.setItem(key,JSON.stringify(restored));state=restored;mode='practice';session={attempts:0,correct:0};count=0;populateTopics();$('recommendNote').textContent='';$('adventureEvent').textContent='백업한 원정을 이어서 시작해요!';render();nextQuestion();$('backupStatus').textContent='백업 기록을 불러왔어요.';
 }catch{$('backupStatus').textContent='백업을 불러오지 못했어요. 올바른 1MB 이하 게임 백업인지, 브라우저 저장이 허용되어 있는지 확인해 주세요. 현재 기록은 유지돼요.';}finally{e.target.value='';}
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.repeat&&!e.isComposing&&answered&&!$('next').hidden&&!['BUTTON','SELECT','SUMMARY','A','INPUT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();$('next').click();}});
populateTopics();render();nextQuestion();
