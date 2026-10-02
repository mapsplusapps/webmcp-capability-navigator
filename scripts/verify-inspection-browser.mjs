import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.LIVE_URL||'http://127.0.0.1:4173';
const out='artifacts/inspection-browser';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({
  ...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),
  headless:process.env.HEADED!=='1',
  args:['--enable-experimental-web-platform-features','--enable-features=WebMCP,WebMCPTesting,DevToolsWebMCPSupport']
});
const report={base,checks:[],native:false};
try{
  const context=await browser.newContext({viewport:{width:1536,height:1024}});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(base,{waitUntil:'networkidle'});
  assert.equal(response.status(),200,'anonymous site access');
  await page.locator('#run').waitFor();
  assert.match(await page.title(),/Capability Navigator/);
  await page.locator('#run').click();
  await page.locator('#approve').waitFor();
  assert.match(await page.locator('#review').innerText(),/INS-1042/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('capability-navigator:inspection-orders:v1')),null);
  await page.screenshot({path:out+'/desktop-review.png',fullPage:true});
  await page.locator('#title').fill('Review pump bearings');
  await page.locator('#assignee').selectOption('Alex Chen');
  await page.locator('#approve').click();
  assert.match(await page.locator('#review').innerText(),/WO-1042/);
  await page.reload({waitUntil:'networkidle'});
  assert.match(await page.locator('#review').innerText(),/Review pump bearings/);
  assert.match(await page.locator('#review').innerText(),/Alex Chen/);
  report.checks.push('guided draft, edits, approval and refresh persistence');
  await page.locator('[data-asset="BR-008"]').click();
  await page.locator('#prepare').click();await page.locator('#approve').waitFor();
  assert.match(await page.locator('#review').innerText(),/INS-1043/);
  await page.locator('#discard').click();
  assert.equal(await page.locator('#approve').count(),0);
  report.checks.push('asset change uses new evidence; discard does not save');
  await page.locator('#prepare').click();await page.locator('#approve').waitFor();
  await page.evaluate(()=>document.querySelector('#approval-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('capability-navigator:inspection-orders:v1')));
  assert.equal(stored.length,1,'script-triggered submission cannot approve');
  report.checks.push('script-triggered approval denied');
  await page.evaluate(()=>localStorage.clear());await page.reload({waitUntil:'networkidle'});
  const native=await page.evaluate(()=>!!document.modelContext?.getTools);
  if(native){
    const names=await page.evaluate(async()=> (await document.modelContext.getTools()).map(t=>t.name));
    assert.equal(names.length,4);
    for(const name of ['list_overdue_inspections','get_inspection_evidence','prepare_work_order','stage_work_order_review']){
      await page.evaluate(async name=>{
        const tools=await document.modelContext.getTools();const tool=tools.find(t=>t.name===name);
        const input=name==='list_overdue_inspections'?{}:{asset_id:'PS-014'};
        // Native API changed to object arguments; use the current form.
        await document.modelContext.executeTool(tool,input);
      },name);
    }
    await page.locator('#approve').waitFor();
    assert.equal(await page.evaluate(()=>localStorage.getItem('capability-navigator:inspection-orders:v1')),null);
    report.native=true;report.checks.push('native WebMCP discovery and four invocations; staging does not save');
  }else if(process.env.REQUIRE_NATIVE==='1')throw new Error('Native WebMCP unavailable');
  for(const width of [320,390,768]){
    await page.setViewportSize({width,height:900});await page.locator('#run').click();await page.locator('#approve').waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no horizontal overflow at '+width);
    await page.screenshot({path:out+'/review-'+width+'.png',fullPage:true});
    await page.locator('#approve').click();assert.match(await page.locator('#review').innerText(),/WO-1042/);
    await page.evaluate(()=>localStorage.clear());await page.reload({waitUntil:'networkidle'});
  }
  report.checks.push('320,390,768 pixel layouts and approval');
  await page.goto(base+'/capabilities.html',{waitUntil:'networkidle'});
  assert.equal(await page.locator('#webmcp-status').count(),1);
  assert.deepEqual(errors,[]);
  report.checks.push('original capability reference retained; no browser errors');
  await context.close();
  report.status='PASS';
}catch(error){report.status='FAIL';report.error=error.stack;process.exitCode=1;}
finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
