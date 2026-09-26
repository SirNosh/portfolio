import { useEffect } from 'react'
import { animate, onScroll, spring, stagger } from 'animejs'

export function useReveal(ref) {
  useEffect(() => {
    const root = ref.current
    if (!root) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const cards = root.querySelectorAll('.tiles > li, .steps > li, .layers > article')
    const marks = root.querySelectorAll('.lineage .n')
    const animations = []

    if (cards.length) {
      animations.push(animate(cards, {
        y: [22, 0],
        scale: [0.94, 1],
        delay: stagger(80, { from: 'first' }),
        duration: 720,
        ease: spring({ bounce: 0.28, duration: 720 }),
        autoplay: onScroll({
          target: root,
          enter: 'bottom 78%',
        }),
      }))
    }

    if (marks.length) {
      animations.push(animate(marks, {
        scale: [0.4, 1],
        delay: stagger(60),
        duration: 540,
        ease: spring({ bounce: 0.45, duration: 540 }),
        autoplay: onScroll({
          target: root,
          enter: 'bottom 80%',
        }),
      }))
    }

    return () => animations.forEach((anim) => anim.revert())
  }, [ref])
}
