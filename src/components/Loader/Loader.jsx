import { useEffect, useRef } from 'react'
import { animate, createDrawable, createTimeline, spring, stagger } from 'animejs'
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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const intro = animate(mark, {
      scale: [0.92, 1],
      ease: spring({ bounce: 0.28, duration: 700 }),
    })
    return () => intro.revert()
  }, [])

  useEffect(() => {
    if (!ready || !root.current) return undefined
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const duration = reduce ? 180 : seen.current ? 280 : 640
    const strokes = createDrawable(root.current.querySelectorAll('.loader-rule path'))
    const timeline = createTimeline({
      onComplete: () => {
        sessionStorage.setItem('portfolio-seen', '1')
        document.body.classList.remove('is-loading')
        document.body.classList.add('is-entered')
        onFinish()
      },
    })
    if (!reduce) {
      strokes.forEach((stroke, index) => {
        timeline.add(stroke, {
          draw: ['0 0', '0 1'],
          duration: 280,
          ease: 'inOut(3)',
        }, index * 90)
      })
    }
    timeline
      .add(root.current.querySelectorAll('.loader-step'), {
        opacity: [0.35, 1],
        duration: reduce ? 1 : 180,
        delay: reduce ? 0 : stagger(60),
      }, reduce ? 0 : 180)
      .add(root.current, {
        y: '-110%',
        ease: reduce ? 'linear' : 'inOut(3)',
        duration,
      })
    return () => timeline.revert()
  }, [ready, onFinish])

  return (
    <div ref={root} className="loader" role="status" aria-live="polite">
      <p className="loader-mark">
        Dev Vyas<span>.</span>
      </p>
      <svg className="loader-rule" viewBox="0 0 160 16" aria-hidden="true">
        <path d="M0 12 H72" />
        <path d="M78 12 H112" />
        <path d="M118 4 L128 12 L138 4" />
      </svg>
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
