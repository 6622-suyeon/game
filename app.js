'use strict';
const $=id=>document.getElementById(id), key='math-upgrade-school-v1';
const today=()=>{const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;};
const initial=()=>({grade:5,level:0,stones:0,correct:0,streak:0,bestStreak:0,reviewed:0,mistakes:[],daily:{date:today(),correct:0,claimed:false}});
let mode='practice';
function refreshDay(){if(state.daily.date!==today())state.daily={date:today(),correct:0,claimed:false};}
let state=initial(), question, answered=false, count=0;
try{const saved=JSON.parse(localStorage.getItem(key));if(saved&&[5,6].includes(saved.grade)&&['level','stones','correct','streak'].every(k=>Number.isSafeInteger(saved[k])&&saved[k]>=0)){state={...initial(),...saved};state.bestStreak=Math.max(state.streak,Number.isSafeInteger(saved.bestStreak)?saved.bestStreak:0);state.reviewed=Number.isSafeInteger(saved.reviewed)&&saved.reviewed>=0?saved.reviewed:0;state.mistakes=Array.isArray(saved.mistakes)?saved.mistakes.filter(q=>[5,6].includes(q.grade)&&typeof q.text==='string'&&typeof q.topic==='string'&&typeof q.explanation==='string'&&Number.isFinite(q.answer)).slice(0,100):[];if(!saved.daily||typeof saved.daily.date!=='string'||!Number.isSafeInteger(saved.daily.correct)||saved.daily.correct<0||typeof saved.daily.claimed!=='boolean')state.daily=initial().daily;}}catch{}
function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch{$('forgeNote').textContent='브라우저 저장이 제한되어 있어요. 현재 화면에서는 계속 플레이할 수 있어요.';}}
function render(){
 refreshDay();
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
 document.querySelectorAll('.grade').forEach(b=>{b.classList.toggle('active',Number(b.dataset.grade)===state.grade);b.setAttribute('aria-pressed',String(Number(b.dataset.grade)===state.grade));});
}
function nextQuestion(){
 if(mode==='review'){
  question=state.mistakes.find(q=>q.grade===state.grade);
  if(!question){answered=true;$('topic').textContent='오답 복습';$('questionNumber').textContent='';$('question').textContent='복습할 문제가 없어요! 새 문제에 도전해 볼까요?';$('answer').value='';$('answer').disabled=true;$('submit').disabled=true;$('next').hidden=true;$('feedback').textContent='';$('feedback').className='';render();return;}
 }else question=MathGame.makeQuestion(state.grade);answered=false;count++;$('topic').textContent=`${state.grade}학년 · ${question.topic}`;$('questionNumber').textContent=`도전 ${count}`;$('question').textContent=question.text;$('answer').value='';$('answer').disabled=false;$('submit').disabled=false;$('feedback').textContent='';$('feedback').className='';$('next').hidden=true;}
$('answerForm').addEventListener('submit',e=>{e.preventDefault();if(answered)return;const value=$('answer').value;if(!Number.isFinite(MathGame.parseAnswer(value))){$('feedback').className='bad';$('feedback').textContent='숫자 또는 분수로 입력해 주세요. 예: 12, 0.5, 1/2';return;}answered=true;const good=MathGame.isCorrect(value,question.answer);let message;
 refreshDay();
 if(good){
  state.correct++;state.stones++;
  message='정답이에요! ✦ 강화석 1개를 얻었어요.';
  if(mode==='review'){
   state.mistakes=state.mistakes.filter(q=>!(q.grade===state.grade&&q.text===question.text));state.reviewed++;
   message+=' 오답 하나를 해결했어요!';
  }else{
   state.streak++;state.bestStreak=Math.max(state.bestStreak,state.streak);state.daily.correct++;
   if(state.streak%3===0){state.stones++;message+=' 🔥 3연속 정답 보너스 +1개!';}
   if(state.daily.correct>=5&&!state.daily.claimed){state.daily.claimed=true;state.stones+=3;message+=' 🎯 오늘의 미션 달성! +3개!';}
  }
 }else{
  if(mode==='practice')state.streak=0;
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
document.querySelectorAll('.grade').forEach(b=>b.addEventListener('click',()=>{const grade=Number(b.dataset.grade);if(state.grade===grade)return;state.grade=grade;state.streak=0;render();save();nextQuestion();}));
$('upgrade').addEventListener('click',()=>{if(state.stones<1)return;state.stones--;state.level++;render();save();$('forgeNote').textContent=`강화 성공! ${$('weaponName').textContent} +${state.level} 달성!`;$('weapon').classList.add('pop');setTimeout(()=>$('weapon').classList.remove('pop'),350);});
$('reset').addEventListener('click',()=>{if(!confirm('강화 단계와 학습 기록을 모두 초기화할까요?'))return;state=initial();count=0;mode='practice';save();render();nextQuestion();$('forgeNote').textContent='정답을 맞히면 강화석을 얻어요. 강화는 100% 성공!';});
render();nextQuestion();
