import { access, readFile } from 'node:fs/promises';

const requiredFiles = [
  'index.html',
  'LICENSE',
  'README.md',
  'JUDGE_PROMPT.md',
  'HACKATHON.md',
  'RELEASE_MANIFEST.json',
  'src/app.mjs',
  'src/core.mjs',
  'src/data.mjs',
  'src/webmcp.mjs',
  'scripts/serve.mjs',
  'test/core.test.mjs'
];
for (const file of requiredFiles) await access(new URL(`../${file}`, import.meta.url));
const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
const joined = JSON.stringify(config);
for (const expected of ['Cross-Origin-Opener-Policy','Cross-Origin-Embedder-Policy','Cross-Origin-Resource-Policy','Permissions-Policy','X-Content-Type-Options']) {
  if (!joined.includes(expected)) throw new Error(`missing deployment header: ${expected}`);
}
const source = await readFile(new URL('../src/webmcp.mjs', import.meta.url), 'utf8');
for (const name of ['list_capabilities','get_capability','find_examples','draft_scope','prepare_decision_packet','stage_human_review']) {
  if (!source.includes(`name: '${name}'`)) throw new Error(`missing WebMCP tool: ${name}`);
}
console.log('release preflight: PASS');
