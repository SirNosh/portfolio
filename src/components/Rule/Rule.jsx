import { useEffect, useRef } from 'react'
import { animate, createDrawable, onScroll } from 'animejs'

export default function Rule({ immediate = false }) {
  const ref = useRef(null)

  useEffect(() => {
    const line = ref.current
    if (!line) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const drawable = createDrawable(line)
    const anim = animate(drawable, {
      draw: ['0 0', '0 1'],
      ease: 'inOut(3)',
      duration: 700,
      autoplay: immediate
        ? true
        : onScroll({
            target: line,
            enter: 'bottom 88%',
          }),
    })

    return () => anim.revert()
  }, [immediate])

  return (
    <svg className="rule" viewBox="0 0 120 2" aria-hidden="true">
      <path ref={ref} d="M0 1 H120" />
    </svg>
  )
}
