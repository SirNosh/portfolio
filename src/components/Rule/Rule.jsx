import { useEffect, useRef } from 'react'
import { createDrawable, createTimeline, onScroll } from 'animejs'

export default function Rule({ immediate = false }) {
  const ref = useRef(null)

  useEffect(() => {
    const svg = ref.current
    if (!svg) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const strokes = createDrawable(svg.querySelectorAll('path'))
    const timeline = createTimeline({
      autoplay: immediate
        ? true
        : onScroll({
            target: svg,
            enter: 'bottom 88%',
          }),
    })

    strokes.forEach((stroke, index) => {
      timeline.add(stroke, {
        draw: ['0 0', '0 1'],
        duration: 380,
        ease: 'inOut(3)',
      }, index * 140)
    })

    return () => timeline.revert()
  }, [immediate])

  return (
    <svg ref={ref} className="rule" viewBox="0 0 160 16" aria-hidden="true">
      <path d="M0 12 H72" />
      <path d="M78 12 H112" />
      <path d="M118 4 L128 12 L138 4" />
    </svg>
  )
}
