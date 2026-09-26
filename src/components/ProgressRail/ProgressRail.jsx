import { useEffect, useState } from 'react'
import { rail } from '../../app/siteData'
import { useDeviceProfile } from '../../hooks/useDeviceProfile'

export default function ProgressRail() {
  const { mobile } = useDeviceProfile()
  const [active, setActive] = useState(rail[0].id)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const mark = window.innerHeight * 0.38
      let best = rail[0].id
      let bestDist = Number.POSITIVE_INFINITY
      rail.forEach((item) => {
        const el = document.getElementById(item.id)
        if (!el) return
        const dist = Math.abs(el.getBoundingClientRect().top - mark)
        if (dist < bestDist) {
          bestDist = dist
          best = item.id
        }
      })
      setActive((current) => (current === best ? current : best))
    }
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const jump = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (mobile) setOpen(false)
  }

  return (
    <nav
      className={`rail ${open ? 'is-open' : ''}`}
      aria-label="Section trace"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="rail-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Trace
      </button>
      <div className="rail-line" />
      <ol>
        {rail.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={item.id === active ? 'is-active' : ''}
              onClick={() => jump(item.id)}
            >
              <span className="rail-num">{item.num}</span>
              <span className="rail-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
