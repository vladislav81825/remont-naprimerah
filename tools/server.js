'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 4173);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

function resolvePath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0]);
  } catch (error) {
    return null;
  }
  const clean = decoded.replace(/^\/+/, '');
  const target = path.resolve(root, clean);
  if (!target.startsWith(root)) return null;
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    return path.join(target, 'index.html');
  }
  return target;
}

http.createServer((request, response) => {
  const requested = request.url === '/' ? '/index.html' : request.url;
  let file = resolvePath(requested);

  if (!file && requested === '/articles/') file = path.join(root, 'articles/index.html');
  if (!file) file = path.join(root, '404.html');

  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(root, '404.html');
    response.statusCode = 404;
  }

  const type = mime[path.extname(file).toLowerCase()] || 'application/octet-stream';
  response.setHeader('Content-Type', type);
  response.setHeader('Cache-Control', 'no-cache');

  fs.createReadStream(file)
    .on('error', () => {
      response.statusCode = 500;
      response.end('Internal Server Error');
    })
    .pipe(response);
}).listen(port, () => {
  console.log(`REMONT: http://localhost:${port}`);
});
