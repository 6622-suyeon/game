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
  assert.deepEqual(errors,[]);
  console.log('PASS: save migration, daily reward, streak bonus, duplicate submission, upgrade, persistent review, grade switch, date rollover, responsive layout, reset, no browser errors');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
