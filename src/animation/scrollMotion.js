import { animate, createScope, onScroll } from 'animejs'

export function bindScrollMotion(root) {
  const scope = createScope({ root }).add(() => {
    root.querySelectorAll('[data-drift]').forEach((node) => {
      const section = node.closest('.chapter') || root
      animate(node, {
        y: ['-1.25rem', '1.4rem'],
        ease: 'linear',
        autoplay: onScroll({
          target: section,
          enter: 'bottom bottom',
          leave: 'top top',
          sync: true,
        }),
      })
    })
  })

  document.documentElement.dataset.motion = '1'
  window.dispatchEvent(new Event('portfolio:motion'))

  return () => {
    scope.revert()
  }
}
