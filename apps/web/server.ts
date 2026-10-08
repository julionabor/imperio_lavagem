import {
  AngularNodeAppEngine,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = fileURLToPath(new URL('.', import.meta.url));
const browserDistFolder = join(serverDistFolder, '../browser');
const angularApp = new AngularNodeAppEngine();

const CONTENT_TYPES: Record<string, string> = {
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
};

function isHashedAsset(pathname: string): boolean {
  return /\.[0-9a-f]{8,}\.(js|css|mjs|woff2?)(\?.*)?$/.test(pathname);
}

const port = Number(process.env['PORT'] ?? 4000);

if (isMainModule(import.meta.url)) {
  createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${port}`);
    const filePath = join(browserDistFolder, decodeURIComponent(url.pathname));

    // Static files
    if (existsSync(filePath)) {
      const stat = statSync(filePath);
      if (stat.isFile()) {
        const ext = extname(filePath);
        const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream';
        const hashed = isHashedAsset(url.pathname);
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': hashed
            ? 'public, max-age=31536000, immutable'
            : 'no-cache, must-revalidate',
          'Content-Length': stat.size,
        });
        createReadStream(filePath).pipe(res);
        return;
      }
    }

    // Angular SSR
    try {
      const response = await angularApp.handle(req);
      if (response) {
        writeResponseToNodeResponse(response, res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Não encontrado');
      }
    } catch (err) {
      console.error('SSR error:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Erro interno do servidor');
    }
  }).listen(port, () => {
    console.log(`Angular SSR server em http://localhost:${port}`);
  });
}
