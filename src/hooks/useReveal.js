import { useEffect } from 'react'
import { animate, onScroll, stagger } from 'animejs'

export function useReveal(ref) {
  useEffect(() => {
    const root = ref.current
    if (!root) return undefined
    const nodes = root.querySelectorAll('[data-reveal]')
    if (!nodes.length) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const anim = animate(nodes, {
      opacity: [0, 1],
      y: [16, 0],
      delay: stagger(45),
      duration: 640,
      ease: 'out(3)',
      autoplay: onScroll({
        target: root,
        enter: 'bottom 82%',
      }),
    })

    return () => anim.revert()
  }, [ref])
}
