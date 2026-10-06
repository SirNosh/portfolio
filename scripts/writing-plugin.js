import fs from 'fs'
import path from 'path'
import { Marked } from 'marked'

// Renders writing/<slug>/index.md into standalone pages at <base>writing/<slug>/, styled like the
// site but without the React/Three bundle, and exposes post metadata as `virtual:writings`.

const SITE = 'https://sirnosh.github.io'
const VIRTUAL = 'virtual:writings'
const RESOLVED = `\0${VIRTUAL}`
const DARK_QUERY = '@media (prefers-color-scheme: dark)'

const escape = (value) => String(value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const slugify = (text) => text.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function formatDate(date) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

function parse(source) {
  const text = source.replace(/\r\n/g, '\n')
  const match = text.match(/^---\n([\s\S]*?)\n---\n/)
  const meta = {}
  if (match) {
    for (const line of match[1].split('\n')) {
      const split = line.indexOf(':')
      if (split > 0) meta[line.slice(0, split).trim()] = line.slice(split + 1).trim()
    }
  }
  return { meta, body: match ? text.slice(match[0].length) : text }
}

function loadPosts(root, base) {
  const dir = path.join(root, 'writing')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(dir, entry.name, 'index.md')))
    .map((entry) => {
      const { meta, body } = parse(fs.readFileSync(path.join(dir, entry.name, 'index.md'), 'utf8'))
      const url = `${base}writing/${entry.name}/`
      return { slug: entry.name, dir: path.join(dir, entry.name), body, url, title: meta.title, date: meta.date, summary: meta.summary, dateLabel: formatDate(meta.date) }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

// The figures switch palette with the OS colour scheme; the site has its own toggle, so each
// figure ships as a light and a dark file and the page shows the one matching the toggle.
export function themeVariants(svg) {
  const start = svg.indexOf(DARK_QUERY)
  if (start < 0) return { light: svg, dark: svg }
  const open = svg.indexOf('{', start)
  let depth = 0
  let end = open
  for (; end < svg.length; end += 1) {
    if (svg[end] === '{') depth += 1
    else if (svg[end] === '}' && (depth -= 1) === 0) break
  }
  const light = svg.slice(0, start) + svg.slice(end + 1)
  const close = light.indexOf('</style>', start)
  // Appended last in the same <style>, the dark rules win over the base rules they mirror.
  const dark = light.slice(0, close) + svg.slice(open + 1, end) + light.slice(close)
  return { light, dark }
}

// Width/height from the SVG root reserve each figure's space before its lazy load.
function svgSize(file) {
  const head = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').slice(0, 400) : ''
  const width = head.match(/<svg[^>]*\swidth="([\d.]+)"/)?.[1]
  const height = head.match(/<svg[^>]*\sheight="([\d.]+)"/)?.[1]
  return width && height ? ` width="${width}" height="${height}"` : ''
}

function renderBody(markdown, dir) {
  const marked = new Marked({ gfm: true })
  marked.use({
    renderer: {
      heading({ tokens, depth, text }) {
        return `<h${depth} id="${slugify(text)}">${this.parser.parseInline(tokens)}</h${depth}>\n`
      },
      paragraph({ tokens }) {
        if (tokens.length !== 1 || tokens[0].type !== 'image' || !/^images\/.+\.svg$/.test(tokens[0].href)) return false
        const { href, text } = tokens[0]
        const dark = href.replace(/\.svg$/, '.dark.svg')
        const size = svgSize(path.join(dir, href))
        const img = (src, theme) => `<a class="fig-${theme}" href="${src}" target="_blank" rel="noopener"><img src="${src}" alt="${escape(text)}"${size} loading="lazy" decoding="async" /></a>`
        return `<figure class="figure"><div class="figure-scroll">${img(href, 'light')}${img(dark, 'dark')}</div></figure>\n`
      },
    },
  })
  return marked.parse(markdown)
    .replace(/<table>/g, '<div class="table-wrap"><table>')
    .replace(/<\/table>/g, '</table></div>')
}

const THEME_INIT = `(function(){var t;try{t=localStorage.getItem('portfolio-theme')}catch(e){}if(t!=='dark'&&t!=='light')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.background=t;document.querySelector('meta[name="theme-color"]').content=t==='dark'?'#0f0e0d':'#e4dfd7'})()`

const THEME_TOGGLE = `document.querySelector('.post-toggle').addEventListener('click',function(){var r=document.documentElement,t=r.dataset.background==='dark'?'light':'dark';r.dataset.background=t;document.querySelector('meta[name="theme-color"]').content=t==='dark'?'#0f0e0d':'#e4dfd7';try{localStorage.setItem('portfolio-theme',t)}catch(e){}})`

function renderPage(post, base, css) {
  const url = `${SITE}${post.url}`
  const hasOg = fs.existsSync(path.join(post.dir, 'og.png'))
  const image = hasOg ? `${url}og.png` : ''
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${escape(post.title)} · Dev Vyas</title>
  <meta name="description" content="${escape(post.summary)}" />
  <link rel="canonical" href="${url}" />
  <meta name="theme-color" content="#e4dfd7" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Dev Vyas" />
  <meta property="og:title" content="${escape(post.title)}" />
  <meta property="og:description" content="${escape(post.summary)}" />
  <meta property="og:url" content="${url}" />
  <meta property="article:published_time" content="${post.date}" />
  <meta name="twitter:card" content="${hasOg ? 'summary_large_image' : 'summary'}" />
  <meta name="twitter:title" content="${escape(post.title)}" />
  <meta name="twitter:description" content="${escape(post.summary)}" />
  ${hasOg ? `<meta property="og:image" content="${image}" />\n  <meta property="og:image:width" content="1200" />\n  <meta property="og:image:height" content="630" />\n  <meta name="twitter:image" content="${image}" />` : ''}
  <link rel="icon" type="image/png" href="${base}nosh.png" />
  <script>${THEME_INIT}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>${css}</style>
</head>
<body>
  <div class="field" aria-hidden="true"><div class="field-studio is-light"></div><div class="field-studio is-dark"></div><div class="field-grain"></div></div>
  <header class="post-bar">
    <a class="post-home" href="${base}">&larr; Dev Vyas</a>
    <button class="post-toggle" type="button" aria-label="Toggle dark background">
      <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20.2 15.5A8.7 8.7 0 0 1 8.5 3.8 8.7 8.7 0 1 0 20.2 15.5Z" /></svg>
      <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>
    </button>
  </header>
  <main class="post">
    <article class="post-body">
${renderBody(post.body, post.dir)}
    </article>
    <footer class="post-foot">
      <time datetime="${post.date}">Published ${post.dateLabel}</time>
      <a href="${base}">&larr; Back to the portfolio</a>
    </footer>
  </main>
  <script>${THEME_TOGGLE}</script>
</body>
</html>
`
}

export default function writingPlugin() {
  let root
  let base
  let outDir
  let building = false
  const styles = () => ['tokens.css', 'motion.css', 'post.css']
    .map((file) => fs.readFileSync(path.join(root, 'src/styles', file), 'utf8'))
    .join('\n')
    .replace(/url\("\/assets\//g, `url("${base}assets/`)
  const figure = (post, name) => {
    const dark = name.endsWith('.dark.svg')
    const file = path.join(post.dir, 'images', dark ? name.replace(/\.dark\.svg$/, '.svg') : name)
    if (!fs.existsSync(file)) return null
    return themeVariants(fs.readFileSync(file, 'utf8'))[dark ? 'dark' : 'light']
  }

  return {
    name: 'portfolio-writing',
    configResolved(config) {
      root = config.root
      base = config.base
      outDir = path.resolve(root, config.build.outDir)
      building = config.command === 'build'
    },
    resolveId(id) {
      return id === VIRTUAL ? RESOLVED : null
    },
    load(id) {
      if (id !== RESOLVED) return null
      const writings = loadPosts(root, base).map(({ slug, title, date, dateLabel, summary, url }) => ({ slug, title, date, dateLabel, summary, url }))
      return `export const writings = ${JSON.stringify(writings)}`
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const match = req.url?.split('?')[0].match(new RegExp(`^${base}writing/([^/]+)/(.*)$`))
        const post = match && loadPosts(root, base).find((candidate) => candidate.slug === match[1])
        if (!post) return next()
        const rest = match[2]
        if (rest === '' || rest === 'index.html') {
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          return res.end(renderPage(post, base, styles()))
        }
        const image = rest.match(/^images\/([^/]+\.svg)$/)
        const svg = image && figure(post, image[1])
        if (svg) {
          res.setHeader('Content-Type', 'image/svg+xml')
          return res.end(svg)
        }
        if (rest === 'og.png' && fs.existsSync(path.join(post.dir, 'og.png'))) {
          res.setHeader('Content-Type', 'image/png')
          return res.end(fs.readFileSync(path.join(post.dir, 'og.png')))
        }
        return next()
      })
    },
    closeBundle() {
      // Vite also calls this when the dev server closes; only a build writes pages.
      if (!building) return
      for (const post of loadPosts(root, base)) {
        const target = path.join(outDir, 'writing', post.slug)
        fs.mkdirSync(path.join(target, 'images'), { recursive: true })
        fs.writeFileSync(path.join(target, 'index.html'), renderPage(post, base, styles()))
        for (const name of fs.readdirSync(path.join(post.dir, 'images')).filter((file) => file.endsWith('.svg'))) {
          const { light, dark } = themeVariants(fs.readFileSync(path.join(post.dir, 'images', name), 'utf8'))
          fs.writeFileSync(path.join(target, 'images', name), light)
          fs.writeFileSync(path.join(target, 'images', name.replace(/\.svg$/, '.dark.svg')), dark)
        }
        if (fs.existsSync(path.join(post.dir, 'og.png'))) fs.copyFileSync(path.join(post.dir, 'og.png'), path.join(target, 'og.png'))
      }
    },
  }
}
