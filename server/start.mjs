import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import process from 'node:process';
import { createApiHandler } from './api.mjs';

const root = resolve('dist');
const api = createApiHandler();
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
createServer(async (req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (path.startsWith('/api/')) return api(req, res);
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
    try {
        const file = resolve(root, '.' + decodeURIComponent(path === '/' ? '/index.html' : path));
        if (!file.startsWith(root + sep)) { res.writeHead(403); return res.end(); }
        const body = await readFile(file);
        res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
        res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
        res.writeHead(404);
        res.end('Not found. Run npm run build before starting the server.');
    }
}).listen(Number(process.env.PORT || 3001), () => console.log('TextFormatter server ready'));
