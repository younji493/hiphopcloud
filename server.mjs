import {createServer} from 'node:http';
import {readFile, mkdir, writeFile, rename} from 'node:fs/promises';
import {join, resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const dataFile = resolve(root, '../../work/looproom-state.json');
const port = Number(process.env.LOOPROOM_PORT || 8736);
const base = 'http://127.0.0.1:' + port;
const assets = new Map([
  ['/', ['index.html', 'text/html']],
  ['/style.css', ['style.css', 'text/css']],
  ['/app.js', ['app.js', 'text/javascript']]
]);
let writes = Promise.resolve();

const server = createServer(async (request, response) => {
  const send = (status, body = '', type = 'text/plain') => {
    response.writeHead(status, {'Content-Type':type+'; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff'});
    response.end(body);
  };
  if (request.headers.host !== '127.0.0.1:' + port) return send(403);
  try {
    const pathname = new URL(request.url, base).pathname;
    if (pathname === '/state' && request.method === 'GET') {
      const state = await readFile(dataFile, 'utf8').catch(error => {
        if (error.code !== 'ENOENT') throw error;
        return 'null';
      });
      return send(200, state, 'application/json');
    }
    if (pathname === '/state' && request.method === 'PUT') {
      if (request.headers.origin !== base || request.headers['content-type'] !== 'application/json') return send(403);
      let size = 0;
      const chunks = [];
      for await (const chunk of request) {
        size += chunk.length;
        if (size > 1024 * 1024) return send(413);
        chunks.push(chunk);
      }
      let state;
      try { state = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { return send(400); }
      if (!state || !['profiles','projects','reviews'].every(key => Array.isArray(state[key]))) return send(400);
      const operation = writes.then(async () => {
        await mkdir(dirname(dataFile), {recursive:true});
        await writeFile(dataFile + '.tmp', JSON.stringify(state));
        await rename(dataFile + '.tmp', dataFile);
      });
      writes = operation.catch(() => {});
      await operation;
      return send(204);
    }
    const asset = assets.get(pathname);
    if (request.method !== 'GET' || !asset) return send(404);
    const [file,type] = asset;
    send(200, await readFile(join(root,file)), type);
  } catch (error) {
    console.error(error.message);
    send(500);
  }
});
server.listen(port, '127.0.0.1', () => console.log(base));
