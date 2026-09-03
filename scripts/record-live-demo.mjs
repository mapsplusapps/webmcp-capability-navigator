import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
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
  ignoreDefaultArgs: ['--disable-extensions'],
  args: [
    '--no-first-run',
    '--no-default-browser-check',
    '--enable-experimental-web-platform-features',
    '--enable-features=WebMCP,WebMCPTesting,DevToolsWebMCPSupport',
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`,
  ],
});

const page = context.pages()[0] || await context.newPage();
const video = page.video();
await page.goto(liveUrl, { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(5000);

await page.waitForFunction(() => !!document.modelContext, null, { timeout: 20000 }).catch(() => {});
const statusText = await page.locator('#webmcp-status').innerText();
console.log(`WEBMCP_STATUS=${statusText}`);
const modelContextPresent = await page.evaluate(() => !!document.modelContext);
console.log(`MODEL_CONTEXT_PRESENT=${modelContextPresent}`);
if (!modelContextPresent || !statusText.includes('WebMCP ready')) {
  throw new Error(`Live browser did not expose native WebMCP: ${statusText}`);
}

const toolNames = await page.evaluate(async () => {
  const tools = await document.modelContext.getTools();
  return tools.map((tool) => tool.name);
});
console.log(`REGISTERED_TOOLS=${toolNames.join(',')}`);
if (toolNames.length !== 6) throw new Error(`Expected 6 WebMCP tools, found ${toolNames.length}: ${toolNames.join(',')}`);

const expectedTools = [
  'list_capabilities',
  'get_capability',
  'find_examples',
  'draft_scope',
  'prepare_decision_packet',
  'stage_human_review',
];
for (const name of expectedTools) {
  if (!toolNames.includes(name)) throw new Error(`Missing registered WebMCP tool: ${name}`);
}

await page.screenshot({ path: path.join(outDir, '01-webmcp-ready.png'), fullPage: false });

await page.evaluate(() => {
  const badge = document.createElement('div');
  badge.id = 'judge-demo-overlay';
  Object.assign(badge.style, {
    position: 'fixed', top: '18px', right: '18px', zIndex: '999999',
    background: '#0c1b22', color: '#fff', border: '1px solid #22c7be',
    padding: '11px 14px', borderRadius: '7px', font: '700 13px/1.25 ui-monospace, monospace',
    boxShadow: '0 8px 30px rgba(12,27,34,.25)'
  });
  badge.textContent = 'LIVE · Native WebMCP ready · 6 registered tools';
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
    const tools = await document.modelContext.getTools();
    const tool = tools.find((candidate) => candidate.name === name);
    if (!tool) throw new Error(`registered tool missing: ${name}`);
    return await document.modelContext.executeTool(tool, JSON.stringify(input));
  }, { name, input });
  console.log(`TOOL_PASS=${name}`);
  await pause(1900);
  return result;
};

await pause(2500);
await page.locator('#lab').scrollIntoViewIfNeeded();
await pause(2500);
await page.screenshot({ path: path.join(outDir, '02-workspace-empty.png'), fullPage: false });

const objective = 'Create a public-data operational dashboard';
const capabilityIds = ['geospatial-public-data', 'rapid-response-data-automation', 'mobile-accessible-operations'];
const constraints = ['Public data only', 'Mobile-first'];

await callTool('list_capabilities', { problem: 'public-data operational dashboard', delivery_pattern: 'dashboard' });
await callTool('get_capability', { capability_id: 'geospatial-public-data' });
await callTool('find_examples', { capability_ids: capabilityIds, problem: 'public-data operational dashboard' });
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
