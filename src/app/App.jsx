import { useCallback, useEffect, useState } from 'react'
import { bindSprings } from '../animation/springs'
import { bindTravel } from '../animation/travel'
import Engine from '../components/Engine/Engine'
import Loader from '../components/Loader/Loader'
import Shelf from '../components/Shelf/Shelf'

export default function App() {
  const [booting, setBooting] = useState(true)
  const [darkBackground, setDarkBackground] = useState(false)
  const finish = useCallback(() => setBooting(false), [])

  useEffect(() => {
    document.documentElement.dataset.background = darkBackground ? 'dark' : 'light'
  }, [darkBackground])

  useEffect(() => {
    const root = document.getElementById('top')
    const stopSprings = bindSprings(root)
    const stopTravel = bindTravel(root)
    return () => {
      stopSprings()
      stopTravel()
    }
  }, [])

  return (
    <div id="top" className="site">
      <button
        className="background-toggle"
        type="button"
        aria-label="Black background"
        aria-pressed={darkBackground}
        title={darkBackground ? 'Switch to light background' : 'Switch to black background'}
        onClick={() => setDarkBackground((current) => !current)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          {darkBackground ? (
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
            </>
          ) : (
            <path d="M20.2 15.5A8.7 8.7 0 0 1 8.5 3.8 8.7 8.7 0 1 0 20.2 15.5Z" />
          )}
        </svg>
      </button>
      <div className="field" aria-hidden="true">
        <div className="field-grid" />
        <div className="field-wash" />
        <div className="field-drift" />
      </div>
      <main id="scroll-root">
        <section id="between" className="reel" aria-label="Introduction" />
        <Shelf />
      </main>
      <Engine />
      {booting ? <Loader onFinish={finish} /> : null}
    </div>
  )
}
