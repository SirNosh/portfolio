import { useEffect, useState } from 'react'

function makeFiberTile() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const image = ctx.createImageData(256, 256)
  for (let i = 0; i < image.data.length; i += 4) {
    const n = 214 + Math.random() * 41
    image.data[i] = n
    image.data[i + 1] = n - 10
    image.data[i + 2] = n - 24
    image.data[i + 3] = 46
  }
  ctx.putImageData(image, 0, 0)
  return canvas.toDataURL('image/png')
}

function waitEvent(name) {
  if (document.documentElement.dataset[name] === '1') return Promise.resolve()
  return new Promise((resolve) => {
    window.addEventListener(`portfolio:${name}`, () => resolve(), { once: true })
  })
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      window.setTimeout(resolve, ms)
    }),
  ])
}

async function loadFonts() {
  if (!document.fonts?.load) return
  await document.fonts.load('600 64px "Schibsted Grotesk"')
  await document.fonts.load('400 20px "Schibsted Grotesk"')
  await document.fonts.load('500 13px "IBM Plex Mono"')
  await document.fonts.load('italic 500 18px Fraunces')
  await document.fonts.ready
}

export function useAssetLoader() {
  const [marks, setMarks] = useState({
    drawings: false,
    threads: false,
    systems: false,
    traces: false,
  })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const mark = (key) => {
      if (!cancelled) setMarks((prev) => ({ ...prev, [key]: true }))
    }

    const run = async () => {
      const fiber = makeFiberTile()
      document.documentElement.style.setProperty('--fiber', `url("${fiber}")`)
      await loadFonts()
      mark('drawings')

      await withTimeout(waitEvent('webgl'), 7000)
      mark('threads')

      await withTimeout(waitEvent('motion'), 4000)
      mark('systems')

      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      })
      window.dispatchEvent(new Event('portfolio:remeasure'))
      mark('traces')
      if (!cancelled) setReady(true)
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  return { marks, ready }
}
