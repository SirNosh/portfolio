export function bindTravel(root) {
  if (!root) return () => {}
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  const chapters = root.querySelectorAll('.chapter')
  const scroller = document.getElementById('scroll-root')
  let frame = 0

  const tick = () => {
    frame = requestAnimationFrame(tick)
    const vh = window.innerHeight || 1
    const height = scroller ? scroller.offsetHeight : document.documentElement.scrollHeight
    const travel = Math.min(1, Math.max(0, window.scrollY / Math.max(1, height - vh)))
    root.style.setProperty('--travel', travel.toFixed(4))

    chapters.forEach((section) => {
      const rect = section.getBoundingClientRect()
      const pass = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)))
      section.style.setProperty('--pass', pass.toFixed(4))
    })
  }

  tick()
  return () => cancelAnimationFrame(frame)
}
