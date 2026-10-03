import { useEffect, useRef } from 'react'
import { createTimeline } from 'animejs'
import { useAssetLoader } from '../../hooks/useAssetLoader'

const LINES = 7

function Lines() {
  return Array.from({ length: LINES }, (_, line) => <span key={line} style={{ '--line': line }} />)
}

export default function Loader({ onFinish }) {
  const { ready } = useAssetLoader()
  const root = useRef(null)
  const count = useRef(null)

  useEffect(() => {
    document.body.classList.add('is-loading')
    // Progress arrives per network chunk, so it is written to the DOM rather than React state.
    let latest = 0
    const update = ({ detail }) => {
      latest = Math.max(latest, detail)
      root.current.style.setProperty('--progress', String(latest))
      count.current.textContent = `${String(Math.round(latest * 100)).padStart(3, '0')}%`
    }
    window.addEventListener('portfolio:progress', update)
    return () => window.removeEventListener('portfolio:progress', update)
  }, [])

  useEffect(() => {
    if (!ready || !root.current) return undefined
    // The engine may time out without the model; the page is inked in full either way.
    window.dispatchEvent(new CustomEvent('portfolio:progress', { detail: 1 }))
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timeline = createTimeline({
      onComplete: () => {
        sessionStorage.setItem('portfolio-seen', '1')
        document.body.classList.remove('is-loading')
        document.body.classList.add('is-entered')
        onFinish()
      },
    })
    if (!reduce) {
      // Let the last line finish inking before the book recedes.
      timeline.add(root.current.querySelector('.loader-stack'), {
        opacity: 0,
        scale: 0.94,
        duration: 360,
        ease: 'inOut(3)',
      }, 380)
    }
    timeline.add(root.current, {
      y: '-110%',
      ease: reduce ? 'linear' : 'inOut(3)',
      duration: reduce ? 180 : 420,
    }, reduce ? 0 : 640)
    return () => timeline.revert()
  }, [ready, onFinish])

  return (
    <div ref={root} className="loader" role="status" aria-label="Loading">
      <div className="loader-stack" aria-hidden="true">
        <div className="loader-book">
          <div className="loader-page is-left"><Lines /></div>
          <div className="loader-page is-right"><Lines /></div>
          {[0, 1].map((leaf) => <div key={leaf} className="loader-leaf" style={{ '--leaf': leaf }} />)}
        </div>
        <p className="loader-caption">
          <span>Dev Vyas</span>
          <span ref={count} className="loader-count">000%</span>
        </p>
      </div>
    </div>
  )
}
