/// <reference types="node" />
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
const API_URL = process.env['API_URL'] ?? 'http://localhost:3000';
const SITE_URL = process.env['SITE_URL'] ?? 'https://privatemotors.pt';

async function handleSitemap(res: import('node:http').ServerResponse) {
  try {
    const r = await fetch(`${API_URL}/api/v1/public/sitemap-data`);
    const data = (await r.json()) as { vehicles: Array<{ slug: string; updatedAt: string }> };
    const today = new Date().toISOString().split('T')[0];

    const staticUrls = ['/', '/privacidade', '/cookies', '/termos'].map((path) => {
      const priority = path === '/' ? '1.0' : '0.3';
      const freq = path === '/' ? 'daily' : 'monthly';
      return `  <url><loc>${SITE_URL}${path}</loc><lastmod>${today}</lastmod><changefreq>${freq}</changefreq><priority>${priority}</priority></url>`;
    });

    const vehicleUrls = data.vehicles.map((v) => {
      const date = new Date(v.updatedAt).toISOString().split('T')[0];
      return `  <url><loc>${SITE_URL}/viaturas/${v.slug}</loc><lastmod>${date}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...staticUrls, ...vehicleUrls].join('\n')}\n</urlset>`;

    res.writeHead(200, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    });
    res.end(xml);
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erro ao gerar sitemap');
  }
}

if (isMainModule(import.meta.url)) {
  createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${port}`);

    // Sitemap dinâmico
    if (url.pathname === '/sitemap.xml') {
      await handleSitemap(res);
      return;
    }

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
