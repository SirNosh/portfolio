import { useEffect, useRef, useState } from 'react'
import { contact } from '../../app/siteData'

const links = [
  { href: '#black-box', label: 'Work', section: true },
  { href: '#lineage', label: 'Lineage', section: true },
  { href: '#experience', label: 'Experience', section: true },
  { href: '#contact', label: 'Contact', section: true },
]

export default function Topbar() {
  const bar = useRef(null)
  const [light, setLight] = useState(false)

  useEffect(() => {
    let frame = 0
    let current = false

    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const progress = max > 0 ? window.scrollY / max : 0
      if (bar.current) bar.current.style.transform = `scaleX(${progress})`

      const header = document.querySelector('.topbar')
      const mark = header ? header.getBoundingClientRect().bottom : 40
      let tone = 'dark'
      document.querySelectorAll('.chapter').forEach((section) => {
        const rect = section.getBoundingClientRect()
        if (rect.top <= mark && rect.bottom > mark) tone = section.dataset.tone || 'dark'
      })
      const next = tone === 'light'
      if (next !== current) {
        current = next
        setLight(next)
      }
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

  return (
    <header className={`topbar${light ? ' is-light' : ''}`}>
      <a className="brand" href="#between">
        Dev Vyas
      </a>
      <nav aria-label="Site">
        {links.map((link) => (
          <a key={link.href} className="section-link" href={link.href}>
            {link.label}
          </a>
        ))}
        <a href={contact.github} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">
          LinkedIn
        </a>
      </nav>
      <div ref={bar} className="progress" />
    </header>
  )
}
