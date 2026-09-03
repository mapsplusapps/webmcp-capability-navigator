import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const port = Number(process.env.PORT || 4173);
const headers = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'tools=(self)',
  'X-Content-Type-Options': 'nosniff'
};
const contentTypes = { '.html':'text/html; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8' };

http.createServer(async (req, res) => {
  const requested = (req.url || '/').split('?')[0];
  const file = requested === '/' ? 'index.html' : requested.replace(/^\//, '');
  if (!['index.html','src/app.mjs','src/core.mjs','src/data.mjs','src/webmcp.mjs','vercel.json'].includes(file)) {
    res.writeHead(404, { ...headers, 'Content-Type':'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  try {
    const body = await readFile(new URL(`../${file}`, import.meta.url));
    res.writeHead(200, { ...headers, 'Content-Type': contentTypes[extname(file)] || 'text/plain; charset=utf-8' });
    res.end(body);
  } catch {
    res.writeHead(404, { ...headers, 'Content-Type':'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Capability Navigator: http://127.0.0.1:${port}`));
