import { useEffect, useRef } from 'react'
import { animate, createTimeline, spring, stagger } from 'animejs'
import { useAssetLoader } from '../../hooks/useAssetLoader'

const steps = [
  ['type', 'Type'],
  ['engine', 'Engine'],
]

export default function Loader({ onFinish }) {
  const { marks, ready } = useAssetLoader()
  const root = useRef(null)
  const seen = useRef(false)

  useEffect(() => {
    seen.current = sessionStorage.getItem('portfolio-seen') === '1'
  }, [])

  useEffect(() => {
    document.body.classList.add('is-loading')
    const mark = root.current?.querySelector('.loader-mark')
    if (!mark) return undefined
    const intro = animate(mark, {
      scale: [0.92, 1],
      ease: spring({ bounce: 0.28, duration: 700 }),
    })
    return () => intro.revert()
  }, [])

  useEffect(() => {
    if (!ready || !root.current) return undefined
    const duration = seen.current ? 280 : 640
    const timeline = createTimeline({
      onComplete: () => {
        sessionStorage.setItem('portfolio-seen', '1')
        document.body.classList.remove('is-loading')
        document.body.classList.add('is-entered')
        onFinish()
      },
    })
      .add(root.current.querySelectorAll('.loader-step'), {
        opacity: [0.35, 1],
        duration: 180,
        delay: stagger(60),
      })
      .add(root.current, {
        y: '-110%',
        ease: 'inOut(3)',
        duration,
      })
    return () => timeline.revert()
  }, [ready, onFinish])

  return (
    <div ref={root} className="loader" role="status" aria-live="polite">
      <p className="loader-mark">
        Dev Vyas<span>.</span>
      </p>
      <p className="loader-lead">Preparing the engine.</p>
      <ol>
        {steps.map(([key, label]) => (
          <li key={key} className={`loader-step${marks[key] ? ' is-on' : ''}`}>
            <span>{label}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
