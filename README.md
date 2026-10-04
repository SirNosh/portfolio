# Dev Vyas

Single-page portfolio: **[sirnosh.github.io/portfolio](https://sirnosh.github.io/portfolio/)**

A MacBook sits in a photo studio with my name on the screen. As you scroll, the lid closes, the laptop turns upright and flies off, and four hardcovers drop onto the floor: Work Experience, Research, Projects and Writings. Open a book to read it page by page.

## How it works

- **Scroll animation.** One scroll value drives the whole sequence: lid, zoom, quarter turn, fly-out and the books' entrance. It's damped every frame (frame-rate independent), so slow scrolling and wheel notches ease in instead of jumping. Reduced motion skips the easing.
- **Two renderers, one studio.** The laptop is vanilla Three.js with a CSS3D screen (`Engine.jsx`); the shelf is React Three Fiber (`newsletter-bookshelf.tsx`). `src/lib/studio.js` gives both the same procedural softbox environment, light/dark lighting presets and contact shadows.
- **Light and dark.** The toggle crossfades the CSS studio backdrop and the 3D lighting together. The default follows the system setting.
- **Loader.** An open book inks its page in step with the 10.8 MB laptop model's download. The model's real size is injected at build time, because Pages serves it gzipped.

## Stack

React 19 · Vite · Three.js · React Three Fiber · anime.js · Tailwind CSS 4

## Editing content

- Book pages: `src/app/books.js`
- Contact links on the laptop screen: `src/app/siteData.js`

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

The MacBook model was supplied by the owner. The hardcover mesh and textures are from Poly Haven's [Decorative Book Set 01](https://polyhaven.com/a/decorative_book_set_01) (CC0). Details are in `public/assets/models/CREDITS.md`.
