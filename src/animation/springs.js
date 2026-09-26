import { animate, spring } from 'animejs'

const press = spring({ bounce: 0.42, duration: 460 })

function play(el, scale) {
  animate(el, { scale, ease: press })
}

export function bindSprings(root) {
  if (!root) return () => {}
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const nodes = root.querySelectorAll('.cta, .topbar a, .tiles > li, .steps > li, .layers > article')
  const stops = []

  nodes.forEach((el) => {
    const down = () => play(el, 0.96)
    const up = () => play(el, 1)
    const over = () => play(el, el.classList.contains('cta') ? 1.03 : 1.025)
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    if (fine) {
      el.addEventListener('pointerenter', over)
      el.addEventListener('pointerleave', up)
    }
    stops.push(() => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      if (fine) {
        el.removeEventListener('pointerenter', over)
        el.removeEventListener('pointerleave', up)
      }
    })
  })

  return () => stops.forEach((stop) => stop())
}
