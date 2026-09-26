import { useEffect, useRef } from 'react'
import { createDrawable, createTimeline } from 'animejs'
import { useAssetLoader } from '../../hooks/useAssetLoader'

export default function Loader({ onFinish }) {
  const { ready } = useAssetLoader()
  const root = useRef(null)

  useEffect(() => {
    document.body.classList.add('is-loading')
  }, [])

  useEffect(() => {
    if (!ready || !root.current) return undefined
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
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
    timeline.add(root.current, {
      y: '-110%',
      ease: reduce ? 'linear' : 'inOut(3)',
      duration: reduce ? 180 : 420,
    }, reduce ? 0 : 220)
    return () => timeline.revert()
  }, [ready, onFinish])

  return (
    <div ref={root} className="loader" role="status" aria-live="polite" aria-label="Loading">
      <svg className="loader-rule" viewBox="0 0 160 16" aria-hidden="true">
        <path d="M0 12 H72" />
        <path d="M78 12 H112" />
        <path d="M118 4 L128 12 L138 4" />
      </svg>
    </div>
  )
}
