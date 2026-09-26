export function bindLoop() {
  let lock = false

  const onScroll = () => {
    if (lock) return
    const loop = document.getElementById('again')
    if (!loop) return
    const top = loop.getBoundingClientRect().top
    if (top > 0) return
    lock = true
    const y = Math.max(0, -top)
    const html = document.documentElement
    const previous = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'
    window.scrollTo(0, y)
    html.style.scrollBehavior = previous
    requestAnimationFrame(() => {
      lock = false
    })
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  return () => window.removeEventListener('scroll', onScroll)
}
