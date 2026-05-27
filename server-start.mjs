import { serve } from 'srvx'
import { readFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import app from './dist/server/server.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const port = parseInt(process.env.PORT || '3000', 10)
const host = process.env.HOST || '0.0.0.0'

const MIME = {
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain',
  '.webmanifest': 'application/manifest+json',
}

async function handler(req) {
  const { pathname } = new URL(req.url)

  // Serve static files from dist/client
  const isStatic = pathname.startsWith('/assets/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/manifest.json' ||
    /\.(png|jpg|jpeg|svg|ico|woff2?|ttf|webmanifest)$/.test(pathname)

  if (isStatic) {
    try {
      const file = await readFile(join(__dirname, 'dist', 'client', pathname))
      const mime = MIME[extname(pathname)] ?? 'application/octet-stream'
      const maxAge = pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600'
      return new Response(file, { headers: { 'Content-Type': mime, 'Cache-Control': maxAge } })
    } catch {
      return new Response('Not Found', { status: 404 })
    }
  }

  return app.fetch(req)
}

serve({ fetch: handler, port, hostname: host })
console.log(`Server running at http://${host}:${port}`)
