# Dev Vyas

Single-page portfolio: **[sirnosh.github.io/portfolio](https://sirnosh.github.io/portfolio/)**

A MacBook sits in a photo studio with my name on the screen. As you scroll, the lid closes and the camera glides across the same studio floor to four worn hardcovers: Work Experience, Research, Projects and Writings. Open a book to read it page by page.

## How it works

- **Scroll animation.** One scroll value drives the whole sequence: the lid closes, then a single camera glides from the laptop to the books. It's damped every frame (frame-rate independent), so slow scrolling and wheel notches ease in instead of jumping. Reduced motion skips the easing.
- **One camera, one loop.** `src/lib/stage.js` holds the shared camera. The laptop's loop drives it and renders the bookshelf canvas in the same frame (`frameloop="never"` plus `advance`), so the two canvases move as one studio. When the glide ends, the shelf's own camera takes over from exactly that pose.
- **Two renderers, one studio.** The laptop is vanilla Three.js with a CSS3D screen (`Engine.jsx`); the shelf is React Three Fiber (`newsletter-bookshelf.tsx`). `src/lib/studio.js` gives both the same procedural softbox environment, light/dark lighting presets and contact shadows.
- **Light and dark.** The toggle crossfades the CSS studio backdrop and the 3D lighting together. The default follows the system setting.
- **Loader.** The name rises letter by letter while a footer rule tracks the 10.8 MB laptop model's download. The model's real size is injected at build time, because Pages serves it gzipped. Once the shaders have compiled, a teal curtain sweeps over and lifts away, and the name flies into the laptop screen.

## Stack

React 19 · Vite · Three.js · React Three Fiber · anime.js · Tailwind CSS 4

Type: [Departure Mono](https://departuremono.com/) (pixel, for the name and headings) and Fira Code (everything else). The book covers and pages are painted into canvas textures, so they're repainted once both fonts have loaded.

## Editing content

- Book pages: `src/app/books.js`. Each book's `wear` (0 = new, 1 = heavily worn) sets its rubbed edges, bumped corners, faded spine, stains, flaked foil and aged pages.
- Contact links on the laptop screen: `src/app/siteData.js`

## Publishing a post

Each post is a folder in `writing/`. Its name becomes the URL (`/portfolio/writing/<folder>/`).

```
writing/my-post/
  index.md      # frontmatter (title, date, summary), then the post in Markdown
  images/*.svg  # figures referenced as ![alt](images/name.svg)
  og.png        # optional 1200x630 link-preview image
```

```
---
title: My Post
date: 2026-11-01
summary: One or two sentences, used in the Writings book and link previews.
---
```

On push, `scripts/writing-plugin.js` renders each post into its own page in the site's style, without the 3D bundle. It also adds a page to the Writings book linking to it. Figures that switch palette with `prefers-color-scheme` are split into light and dark files, so they follow the site's toggle. `npm run dev` serves posts at the same URLs.

## Development

```
npm install
npm run dev       # local dev server
npm run lint
npm run build     # production build in dist/
npm run preview   # serve the build
```

The build uses `base: '/portfolio/'`. Every push to `main` deploys to GitHub Pages through `.github/workflows/deploy.yml` (lint, build, deploy).

## Credits

The MacBook model was supplied by the owner. The hardcover mesh and textures are from Poly Haven's [Decorative Book Set 01](https://polyhaven.com/a/decorative_book_set_01) (CC0). Details are in `public/assets/models/CREDITS.md`. Departure Mono is by Helena Zhang, under the SIL Open Font License 1.1, which ships beside the font in `public/assets/fonts/`.
