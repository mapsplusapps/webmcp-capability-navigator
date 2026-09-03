import { chromium } from 'playwright';
import { mkdirSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const liveUrl = process.env.LIVE_URL || 'https://webmcp-capability-navigator.vercel.app';
const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const extensionPath = process.env.WEBMCP_EXTENSION_PATH;
const outDir = path.resolve('artifacts/browser');
mkdirSync(outDir, { recursive: true });
if (!extensionPath || !existsSync(extensionPath)) throw new Error('WEBMCP_EXTENSION_PATH missing');

const context = await chromium.launchPersistentContext('/tmp/webmcp-demo-profile', {
  executablePath: chromePath,
  headless: false,
  viewport: { width: 1600, height: 900 },
  recordVideo: { dir: outDir, size: { width: 1600, height: 900 } },
  args: [
    '--no-first-run',
    '--no-default-browser-check',
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`,
  ],
});

await context.addInitScript(() => {
  window.__webmcpRegisteredTools = Object.create(null);
  const wrap = () => {
    const mc = document.modelContext;
    if (!mc || typeof mc.registerTool !== 'function' || mc.__demoWrapped) return false;
    const original = mc.registerTool.bind(mc);
    const wrapped = async (tool, options) => {
      window.__webmcpRegisteredTools[tool.name] = tool;
      return original(tool, options);
    };
    try { mc.registerTool = wrapped; }
    catch { try { Object.defineProperty(mc, 'registerTool', { value: wrapped, configurable: true }); } catch {} }
    try { Object.defineProperty(mc, '__demoWrapped', { value: true }); } catch {}
    return true;
  };
  wrap();
  let tries = 0;
  const timer = setInterval(() => { if (wrap() || ++tries > 300) clearInterval(timer); }, 10);
});

const page = context.pages()[0] || await context.newPage();
const video = page.video();
await page.goto(liveUrl, { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(4500);

const statusText = await page.locator('#webmcp-status').innerText();
if (!statusText.includes('WebMCP ready')) throw new Error(`Live browser did not report WebMCP ready: ${statusText}`);
await page.waitForFunction(() => Object.keys(window.__webmcpRegisteredTools || {}).length === 6, null, { timeout: 15000 });

await page.screenshot({ path: path.join(outDir, '01-webmcp-ready.png'), fullPage: false });

await page.evaluate(() => {
  const badge = document.createElement('div');
  badge.id = 'judge-demo-overlay';
  Object.assign(badge.style, {
    position:'fixed', top:'18px', right:'18px', zIndex:'999999',
    background:'#0c1b22', color:'#fff', border:'1px solid #22c7be',
    padding:'11px 14px', borderRadius:'7px', font:'700 13px/1.25 ui-monospace, monospace',
    boxShadow:'0 8px 30px rgba(12,27,34,.25)'
  });
  badge.textContent = 'LIVE · WebMCP ready · 6 registered tools';
  document.body.appendChild(badge);
});

const setOverlay = async (text) => page.evaluate((value) => {
  const node = document.querySelector('#judge-demo-overlay');
  if (node) node.textContent = value;
}, text);
const pause = (ms = 1800) => page.waitForTimeout(ms);
const callTool = async (name, input) => {
  await setOverlay(`AGENT → ${name}`);
  const result = await page.evaluate(async ({ name, input }) => {
    const tool = window.__webmcpRegisteredTools?.[name];
    if (!tool) throw new Error(`registered tool missing: ${name}`);
    return await tool.execute(input);
  }, { name, input });
  await pause(1900);
  return result;
};

await pause(2500);
await page.locator('#lab').scrollIntoViewIfNeeded();
await pause(2500);
await page.screenshot({ path: path.join(outDir, '02-workspace-empty.png'), fullPage: false });

const objective = 'Create a public-data operational dashboard';
const capabilityIds = ['geospatial-public-data','rapid-response-data-automation','mobile-accessible-operations'];
const constraints = ['Public data only','Mobile-first'];

await callTool('list_capabilities', { problem:'public-data operational dashboard', delivery_pattern:'dashboard' });
await callTool('get_capability', { capability_id:'geospatial-public-data' });
await callTool('find_examples', { capability_ids: capabilityIds, problem:'public-data operational dashboard' });
await page.locator('#agent-trace').scrollIntoViewIfNeeded();
await page.screenshot({ path: path.join(outDir, '03-agent-trace.png'), fullPage: false });
await pause(1800);

await callTool('draft_scope', { objective, capability_ids: capabilityIds, constraints });
await callTool('prepare_decision_packet', { objective, capability_ids: capabilityIds, constraints });
await callTool('stage_human_review', { objective, capability_ids: capabilityIds, constraints });
await page.locator('#receipt').scrollIntoViewIfNeeded();
await setOverlay('AGENT → staged into visible Human Review');
await pause(3500);
await page.screenshot({ path: path.join(outDir, '04-human-review-staged.png'), fullPage: false });

await setOverlay('HUMAN → changes the same workspace');
await page.locator('#constraints').fill('Public data only\nMobile-first\nLow-bandwidth field use');
await pause(1700);
await page.locator('button.build').click();
await pause(2800);
await page.screenshot({ path: path.join(outDir, '05-human-rebuild.png'), fullPage: false });

await page.locator('.manifest').scrollIntoViewIfNeeded();
await setOverlay('6 narrow tools · 0 external actions');
await pause(3000);
await page.screenshot({ path: path.join(outDir, '06-tool-manifest.png'), fullPage: false });

await context.close();
const rawPath = await video.path();
console.log(`RAW_VIDEO=${rawPath}`);
console.log(`CAPTURE_DIR=${outDir}`);
