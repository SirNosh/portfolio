import { useEffect, useState } from 'react'

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
  await document.fonts.load('600 72px Barlow')
  await document.fonts.load('400 20px Barlow')
  await document.fonts.load('500 13px "IBM Plex Mono"')
  await document.fonts.ready
}

export function useAssetLoader() {
  const [marks, setMarks] = useState({ type: false, engine: false })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const mark = (key) => {
      if (!cancelled) setMarks((prev) => ({ ...prev, [key]: true }))
    }

    const run = async () => {
      await loadFonts()
      mark('type')
      await withTimeout(waitEvent('webgl'), 7000)
      mark('engine')
      if (!cancelled) setReady(true)
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  return { marks, ready }
}
