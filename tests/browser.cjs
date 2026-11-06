const {chromium}=require('playwright');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const server=http.createServer((req,res)=>{
  const name=req.url==='/'?'index.html':req.url.slice(1);
  if(!['index.html','game.js','app.js','style.css','sword.svg'].includes(name)){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.svg')?'image/svg+xml':'text/html');
  res.end(fs.readFileSync(path.join(root,name)));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  assert.equal((await page.request.get(`http://127.0.0.1:${server.address().port}/sword.svg`)).status(),200);
  // Old saves gain new fields without losing their progress.
  await page.evaluate(()=>localStorage.setItem('math-upgrade-school-v1',JSON.stringify({grade:5,level:4,stones:0,correct:10,streak:0})));
  await page.reload();assert.equal(await page.textContent('#level'),'+4');
  async function answer(good){const value=await page.evaluate(good=>String(question.answer+(good?0:1)),good);await page.fill('#answer',value);await page.click('#submit');}
  for(let i=0;i<5;i++){await answer(true);if(i<4)await page.click('#next');}
  assert.equal(await page.textContent('#stones'),'9');
  assert.match(await page.textContent('#dailyStatus'),/미션 완료/);
  // A second submission cannot grant another reward.
  await page.evaluate(()=>document.getElementById('answerForm').dispatchEvent(new Event('submit',{cancelable:true})));
  assert.equal(await page.textContent('#stones'),'9');
  await page.click('#upgrade');assert.equal(await page.textContent('#level'),'+5');
  assert.match(await page.textContent('#badges'),/강화 \+5/);
  await page.click('#next');await answer(false);
  assert.equal(await page.textContent('#reviewCount'),'1');
  await page.reload();assert.equal(await page.textContent('#reviewCount'),'1');
  await page.click('#reviewMode');await answer(false);await page.click('#next');await answer(true);
  assert.equal(await page.textContent('#reviewCount'),'0');assert.equal(await page.textContent('#stones'),'9');
  await page.click('#next');assert.match(await page.textContent('#question'),/복습할 문제가 없어요/);
  assert.ok(await page.isDisabled('#submit'));
  await page.click('#practiceMode');await answer(true);
  assert.equal(await page.textContent('#stones'),'10'); // Daily reward is not granted twice.
  await page.click('[data-grade="6"]');assert.match(await page.textContent('#topic'),/6학년/);
  await page.evaluate(()=>{state.daily={date:'2000-1-1',correct:5,claimed:true};save();});await page.reload();
  assert.match(await page.textContent('#dailyStatus'),/0 \/ 5/);
  for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.screenshot({path:'/tmp/math-school-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/math-school-mobile.png',fullPage:true});
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('#weapon').evaluate(el=>getComputedStyle(el).animationName),'none');
  page.on('dialog',d=>d.accept());await page.click('#reset');assert.equal(await page.textContent('#level'),'+0');assert.equal(await page.textContent('#stones'),'0');
  // Expedition progress survives reloads, mistakes, review and grade changes.
  assert.equal(await page.locator('#guardianHealth').getAttribute('value'),'8');
  await answer(true);await page.reload();
  assert.equal(await page.locator('#guardianHealth').evaluate(el=>el.value),7);
  await answer(false);
  assert.equal(await page.locator('#guardianHealth').evaluate(el=>el.value),7);
  await page.click('#reviewMode');await answer(true);
  assert.equal(await page.locator('#guardianHealth').evaluate(el=>el.value),7);
  await page.click('[data-grade="6"]');
  assert.equal(await page.locator('#guardianHealth').evaluate(el=>el.value),7);
  await page.click('#practiceMode');
  for(let i=0;i<7;i++){await answer(true);if(i<6)await page.click('#next');}
  assert.equal(await page.textContent('#relicCount'),'1 / 5개 수집');
  assert.match(await page.textContent('#adventureEvent'),/새싹 숲 돌파/);
  assert.equal(await page.locator('#guardianHealth').evaluate(el=>el.max),10);
  assert.equal(await page.locator('#relics .collected').count(),1);
  const rewarded=await page.textContent('#stones');
  await page.evaluate(()=>document.getElementById('answerForm').dispatchEvent(new Event('submit',{cancelable:true})));
  assert.equal(await page.textContent('#stones'),rewarded);
  await page.reload();assert.equal(await page.textContent('#stones'),rewarded);
  assert.equal(await page.textContent('#relicCount'),'1 / 5개 수집');
  // Upgrades immediately strengthen attacks, and an entire expedition loops safely.
  for(let i=0;i<5;i++)await page.click('#upgrade');
  await answer(true);assert.equal(await page.locator('#guardianHealth').evaluate(el=>el.value),8);
  for(let i=0;i<40&&await page.locator('#relics .collected').count()<5;i++){await page.click('#next');await answer(true);}
  assert.equal(await page.locator('#relics .collected').count(),5);
  assert.match(await page.textContent('#adventureRound'),/2번째 원정 · 5지역 돌파/);
  assert.match(await page.textContent('#adventureEvent'),/다섯 지역에 별빛/);
  assert.equal(await page.locator('#guardianHealth').evaluate(el=>el.value),8);
  await page.reload();assert.equal(await page.locator('#relics .collected').count(),5);
  for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.screenshot({path:'/tmp/math-school-expedition.png',fullPage:true});
  await page.click('#reset');assert.equal(await page.locator('#relics .collected').count(),0);
  assert.equal(await page.locator('#guardianHealth').evaluate(el=>el.value),8);
  // Invalid persisted expedition state is repaired without a reward.
  await page.evaluate(()=>{state.adventure={wins:-1,damage:999};save();});await page.reload();
  assert.equal(await page.locator('#guardianHealth').evaluate(el=>el.value),8);
  assert.equal(await page.textContent('#stones'),'0');
  // Targeted practice, hints and learning records share the reward safeguards.
  await page.selectOption('#topicSelect','1');
  assert.match(await page.textContent('#topic'),/분수의 덧셈/);
  await page.click('#hint');assert.equal(await page.getAttribute('#hint','aria-expanded'),'true');
  assert.match(await page.textContent('#hintText'),/분자끼리/);
  await answer(true);assert.equal(await page.textContent('#stones'),'1');
  assert.match(await page.textContent('#xpLabel'),/누적 10 XP/);
  assert.match(await page.textContent('#accuracy'),/100% · 1\/1개/);
  await page.evaluate(()=>document.getElementById('answerForm').dispatchEvent(new Event('submit',{cancelable:true})));
  assert.match(await page.textContent('#xpLabel'),/누적 10 XP/);
  await page.click('#next');assert.ok(await page.locator('#hintText').isHidden());
  await answer(false);assert.match(await page.textContent('#accuracy'),/50% · 1\/2개/);
  await page.click('#reviewMode');assert.ok(await page.isDisabled('#topicSelect'));
  await answer(true);assert.match(await page.textContent('#accuracy'),/50% · 1\/2개/);
  assert.match(await page.textContent('#xpLabel'),/누적 20 XP/);
  await page.click('#practiceMode');await page.click('#recommend');
  assert.match(await page.textContent('#recommendNote'),/아직 기록이 없는/);
  // A fully covered grade recommends the actual weakest topic.
  await page.evaluate(()=>{MathGame.topics[state.grade].forEach((topic,i)=>state.learning[state.grade+':'+topic]={attempts:10,correct:i===2?1:9});save();});
  await page.click('#recommend');assert.equal(await page.inputValue('#topicSelect'),'2');
  assert.match(await page.textContent('#recommendNote'),/정답률이 낮은/);
  await page.click('#focusToggle');assert.ok(await page.locator('.adventure').isHidden());
  assert.equal(await page.getAttribute('#focusToggle','aria-pressed'),'true');
  await page.reload();assert.ok(await page.locator('.adventure').isHidden());
  await page.click('#focusToggle');assert.ok(await page.locator('.adventure').isVisible());
  await page.click('#soundToggle');assert.equal(await page.getAttribute('#soundToggle','aria-pressed'),'true');
  await page.reload();assert.equal(await page.getAttribute('#soundToggle','aria-pressed'),'true');
  await page.click('#soundToggle');
  // Batch upgrade spends only available stones and stops at the next milestone.
  await page.evaluate(()=>{state.level=4;state.stones=8;render();save();});
  await page.click('#upgradeBatch');assert.equal(await page.textContent('#level'),'+5');assert.equal(await page.textContent('#stones'),'7');
  await page.click('#upgradeBatch');assert.equal(await page.textContent('#level'),'+10');assert.equal(await page.textContent('#stones'),'2');
  await page.click('#upgradeBatch');assert.equal(await page.textContent('#level'),'+12');assert.equal(await page.textContent('#stones'),'0');
  assert.ok(await page.isDisabled('#upgradeBatch'));
  // Real download -> reset -> import roundtrip, plus corrupt-file protection.
  const downloadEvent=page.waitForEvent('download');await page.click('#exportSave');const download=await downloadEvent;
  const backup=fs.readFileSync(await download.path());assert.equal(JSON.parse(backup).state.level,12);
  await page.click('#reset');assert.equal(await page.textContent('#level'),'+0');
  await page.setInputFiles('#importSave',{name:'backup.json',mimeType:'application/json',buffer:backup});
  await page.waitForFunction(()=>document.querySelector('#backupStatus').textContent==='백업 기록을 불러왔어요.');
  assert.equal(await page.textContent('#level'),'+12');assert.match(await page.textContent('#xpLabel'),/누적 20 XP/);
  await page.reload();assert.equal(await page.textContent('#level'),'+12');
  await page.setInputFiles('#importSave',{name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{bad json')});
  await page.waitForFunction(()=>document.querySelector('#backupStatus').textContent.includes('불러오지 못했어요'));
  assert.equal(await page.textContent('#level'),'+12');
  // Dismissing the replacement confirmation must preserve the current save.
  page.removeAllListeners('dialog');page.once('dialog',d=>d.dismiss());
  const different=JSON.parse(backup);different.state.level=99;
  await page.setInputFiles('#importSave',{name:'other.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(different))});
  await page.waitForFunction(()=>document.querySelector('#importSave').value==='');
  assert.equal(await page.textContent('#level'),'+12');
  for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.screenshot({path:'/tmp/math-school-improved.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: save migration, daily reward, streak bonus, duplicate submission, upgrade, persistent review, grade switch, date rollover, responsive layout, reset, expedition rewards/persistence/upgrade power/five-region completion, hints, topic recommendation, XP, statistics, focus, audio settings, batch upgrade, backup roundtrip/corruption/cancellation, no browser errors');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
