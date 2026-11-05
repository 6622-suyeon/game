(function(root){
'use strict';
const rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const gcd=(a,b)=>b?gcd(b,a%b):a;
function fraction(n,d){const g=gcd(n,d);return d/g===1?String(n/g):`${n/g}/${d/g}`;}
function makeQuestion(grade){
 const a=rand(2,9), b=rand(2,9), type=rand(0,3);
 if(grade===5){
  if(type===0){const n=a*b;const divisors=Array.from({length:n},(_,i)=>i+1).filter(x=>n%x===0);return {topic:'약수와 배수',text:`${n}의 약수는 모두 몇 개일까요?`,answer:divisors.length,explanation:`${n}의 약수는 ${divisors.join(', ')}이므로 모두 ${divisors.length}개예요.`};}
  if(type===1){const d=rand(3,12), n=rand(1,d-1), m=rand(1,d-1);return {topic:'분수의 덧셈',text:`${n}/${d} + ${m}/${d} = ?`,answer:(n+m)/d,explanation:`분모가 같으면 분자끼리 더해요. (${n} + ${m})/${d} = ${fraction(n+m,d)}`};}
  if(type===2)return {topic:'직사각형의 넓이',text:`가로 ${a}cm, 세로 ${b}cm인 직사각형의 넓이는 몇 cm²일까요?`,answer:a*b,explanation:`직사각형의 넓이 = 가로 × 세로 = ${a} × ${b} = ${a*b}cm²`};
  const g=gcd(a,b);return {topic:'최소공배수',text:`${a}과 ${b}의 최소공배수는 무엇일까요?`,answer:a*b/g,explanation:`최대공약수는 ${g}예요. 최소공배수 = ${a} × ${b} ÷ ${g} = ${a*b/g}`};
 }
 if(type===0)return {topic:'분수의 나눗셈',text:`${a}/${b} ÷ ${a} = ?`,answer:1/b,explanation:`자연수로 나눌 때는 그 수의 역수를 곱해요. ${a}/${b} × 1/${a} = 1/${b}`};
 if(type===1){const p=rand(1,9)*10,total=rand(2,10)*10;return {topic:'비율과 백분율',text:`${total}명의 학생 중 ${p}%가 운동을 좋아해요. 운동을 좋아하는 학생은 몇 명일까요?`,answer:total*p/100,explanation:`전체 × 비율 = ${total} × ${p}/100 = ${total*p/100}명`};}
 if(type===2){const c=rand(2,8);return {topic:'직육면체의 부피',text:`가로 ${a}cm, 세로 ${b}cm, 높이 ${c}cm인 직육면체의 부피는 몇 cm³일까요?`,answer:a*b*c,explanation:`부피 = 가로 × 세로 × 높이 = ${a} × ${b} × ${c} = ${a*b*c}cm³`};}
 return {topic:'비례식',text:`${a} : ${b} = ${a*3} : □ 에서 □에 들어갈 수는?`,answer:b*3,explanation:`${a}에 3을 곱하면 ${a*3}이므로 ${b}에도 3을 곱해요. ${b} × 3 = ${b*3}`};
}
function parseAnswer(value){const s=value.trim();if(/^[+-]?\d+\s*\/\s*[+-]?\d+$/.test(s)){const [n,d]=s.split('/').map(Number);return d===0?NaN:n/d;}return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)?Number(s):NaN;}
function isCorrect(value,answer){const n=parseAnswer(value);return Number.isFinite(n)&&Math.abs(n-answer)<1e-8;}
const api={makeQuestion,parseAnswer,isCorrect};if(typeof module!=='undefined')module.exports=api;else root.MathGame=api;
})(typeof globalThis!=='undefined'?globalThis:this);
