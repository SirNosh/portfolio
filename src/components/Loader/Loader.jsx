import { useEffect, useRef, useState } from 'react'
import { animate, createTimeline, stagger } from 'animejs'
import { loaderLines } from '../../app/siteData'
import { useAssetLoader } from '../../hooks/useAssetLoader'

const groups = [
  ['drawings', 'Drawings'],
  ['threads', 'Threads'],
  ['systems', 'Systems'],
  ['traces', 'Traces'],
]

export default function Loader({ onFinish }) {
  const { marks, ready } = useAssetLoader()
  const root = useRef(null)
  const [line] = useState(() => loaderLines[Math.floor(Math.random() * 2)])
  const seen = useRef(false)

  useEffect(() => {
    seen.current = sessionStorage.getItem('portfolio-seen') === '1'
  }, [])

  useEffect(() => {
    if (!ready || !root.current) return undefined
    const duration = seen.current ? 280 : 720
    const timeline = createTimeline({
      onComplete: () => {
        sessionStorage.setItem('portfolio-seen', '1')
        document.body.classList.remove('is-loading')
        document.body.classList.add('is-entered')
        onFinish()
      },
    })
      .add(root.current.querySelectorAll('.loader-knot'), {
        scale: [0.4, 1],
        ease: 'out(3)',
        duration: duration * 0.45,
        delay: stagger(50),
      })
      .add(root.current, {
        y: '-110%',
        ease: 'inOut(3)',
        duration,
      })
    return () => timeline.revert()
  }, [ready, onFinish])

  useEffect(() => {
    document.body.classList.add('is-loading')
    const hint = root.current?.querySelector('.loader-aside')
    if (!hint) return undefined
    const fade = animate(hint, {
      opacity: [0, 1],
      delay: 500,
      duration: 400,
      ease: 'out(2)',
    })
    return () => fade.revert()
  }, [])

  return (
    <div ref={root} className="loader" role="status" aria-live="polite">
      <div className="loader-sheet">
        <p className="loader-name">Dev Vyas</p>
        <p className="loader-lead">Getting the agents in order.</p>
        <p className="loader-aside">{line}</p>
        <ol className="loader-groups">
          {groups.map(([key, label]) => (
            <li key={key} className={marks[key] ? 'is-tied' : ''}>
              <span className="loader-knot" />
              <span>{label}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
