// Bakes the shelf's four books into self-contained GLBs with finished textures, so the site
// does no texture painting at runtime. Sources are CC0 scans from Poly Haven, fetched into a
// git-ignored cache. Run: `npm run bake:books` (set CHROME to your Chrome/Chromium executable if
// it isn't at the default Windows path). `--preview` also writes preview renders to the cache.
import fs from 'fs'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import puppeteer from 'puppeteer-core'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const cache = path.join(root, 'scripts/bake-books/.cache')
const outDir = path.join(root, 'public/assets/models/books')
const manifestPath = path.join(root, 'src/app/bookModels.json')
const chrome = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const preview = process.argv.includes('--preview')

async function fetchTo(url, file) {
  if (fs.existsSync(file)) return
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  fs.writeFileSync(file, Buffer.from(await response.arrayBuffer()))
}

async function polyhaven(asset) {
  const response = await fetch(`https://api.polyhaven.com/files/${asset}`)
  return response.json()
}

async function fetchGltf(asset, resolution) {
  const files = await polyhaven(asset)
  const gltf = files.gltf[resolution].gltf
  const dir = path.join(cache, asset)
  await fetchTo(gltf.url, path.join(dir, `${asset}.gltf`))
  for (const [file, info] of Object.entries(gltf.include)) await fetchTo(info.url, path.join(dir, file))
}

async function fetchSources() {
  await fetchGltf('book_encyclopedia_set_01', '2k')
  await fetchGltf('binder_notebook', '2k')
  const set = await polyhaven('decorative_book_set_01')
  const dir = path.join(cache, 'decorative_book_set_01')
  await fetchTo(set.fbx['1k'].fbx.url, path.join(dir, 'decorative_book_set_01.fbx'))
  for (const base of ['book_softcover_01', 'book_hardcover_01']) {
    for (const map of ['diff', 'arm', 'nor_gl', 'mask01', 'mask02', 'mask03']) {
      await fetchTo(set[`${base}_${map}`]['2k'].jpg.url, path.join(dir, `${base}_${map}.jpg`))
    }
  }
}

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.bin': 'application/octet-stream', '.gltf': 'model/gltf+json', '.fbx': 'application/octet-stream', '.woff2': 'font/woff2' }

function serve() {
  const server = http.createServer((request, response) => {
    const file = path.join(root, decodeURIComponent(new URL(request.url, 'http://x').pathname))
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      response.writeHead(404).end()
      return
    }
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' })
    fs.createReadStream(file).pipe(response)
  })
  return new Promise((resolve) => server.listen(0, () => resolve(server)))
}

await fetchSources()
const server = await serve()
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
try {
  const page = await browser.newPage()
  page.on('pageerror', (error) => console.error('page error:', error))
  page.on('console', (message) => console.log('page:', message.text()))
  await page.setViewport({ width: 900, height: 900 })
  await page.goto(`http://localhost:${server.address().port}/scripts/bake-books/index.html`)
  await page.waitForFunction(() => window.bakeBooks, { timeout: 60000 })
  const result = await page.evaluate((withPreview) => window.bakeBooks({ preview: withPreview }), preview)
  fs.mkdirSync(outDir, { recursive: true })
  for (const [name, base64] of Object.entries(result.files)) {
    fs.writeFileSync(path.join(outDir, name), Buffer.from(base64, 'base64'))
    console.log('wrote', name, `${(Buffer.byteLength(base64, 'base64') / 1024).toFixed(0)} KB`)
  }
  fs.writeFileSync(manifestPath, `${JSON.stringify(result.manifest, null, 2)}\n`)
  for (const [name, base64] of Object.entries(result.previews ?? {})) fs.writeFileSync(path.join(cache, name), Buffer.from(base64, 'base64'))
} finally {
  await browser.close()
  server.close()
}
