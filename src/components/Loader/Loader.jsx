import { useEffect, useRef, useState } from 'react'
import { createTimeline } from 'animejs'
import { useAssetLoader } from '../../hooks/useAssetLoader'

const FIRST = 'Dev'
const LAST = 'Vyas'
// Letters rise outward from the gap between the words.
const RANK = [...[...FIRST].map((_, i) => FIRST.length - 1 - i), ...[...LAST].map((_, i) => i)]

function Word({ text, offset, className, children }) {
  return (
    <span className={`loader-word ${className}`}>
      {[...text].map((char, i) => (
        <span key={i} className="loader-char" style={{ '--rank': RANK[offset + i] }}>{char}</span>
      ))}
      {children}
    </span>
  )
}

// Repeat visits in the same tab replay the same choreography, faster.
function playbackRate() {
  try {
    return sessionStorage.getItem('portfolio-seen') === '1' ? 2.2 : 1
  } catch {
    return 1
  }
}

// The laptop's on-screen name (or the no-WebGL fallback) the loader's name hands off to.
function handoffTarget() {
  return [...document.querySelectorAll('.laptop-screen .screen-name, .engine.has-error .engine-fallback .screen-name')]
    .find((el) => { const rect = el.getBoundingClientRect(); return rect.width > 0 && rect.height > 0 })
}

export default function Loader({ onFinish }) {
  const { ready } = useAssetLoader()
  // Reduced motion skips the letter reveal entirely.
  const [introDone, setIntroDone] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const root = useRef(null)
  const count = useRef(null)

  useEffect(() => {
    document.body.classList.add('is-loading')
    // Progress arrives per network chunk, so it is written to the DOM rather than React state.
    let latest = 0
    const update = ({ detail }) => {
      latest = Math.max(latest, detail)
      root.current.style.setProperty('--progress', String(latest))
      count.current.textContent = `${String(Math.round(latest * 100)).padStart(3, '0')}%`
    }
    window.addEventListener('portfolio:progress', update)
    return () => window.removeEventListener('portfolio:progress', update)
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const el = root.current
    let timeline
    let cancelled = false
    // Wait for the face so the letters never rise in a fallback font.
    const fonts = document.fonts
      ? document.fonts.load('600 64px "Fira Code"')
      : Promise.resolve()
    Promise.race([fonts, new Promise((resolve) => { setTimeout(resolve, 1500) })]).then(() => {
      if (cancelled) return
      timeline = createTimeline({ playbackRate: playbackRate(), onComplete: () => setIntroDone(true) })
        .add(el.querySelectorAll('.loader-char'), {
          y: ['110%', '0%'],
          rotate: [(target) => (target.closest('.is-last') ? 14 : -9), 0],
          duration: 1000,
          ease: 'out(4)',
          delay: (target) => Number(target.style.getPropertyValue('--rank')) * 70,
        }, 0)
        .add(el.querySelector('.loader-dot'), { y: ['110%', '0%'], duration: 700, ease: 'out(3)' }, 620)
        .add(el.querySelector('.loader-meta'), { opacity: [0, 1], duration: 600, ease: 'out(2)' }, 400)
    })
    return () => {
      cancelled = true
      timeline?.revert()
    }
  }, [])

  useEffect(() => {
    if (!ready || !introDone || !root.current) return undefined
    const el = root.current
    // The engine may time out without the model; the rule fills either way.
    window.dispatchEvent(new CustomEvent('portfolio:progress', { detail: 1 }))
    const finish = () => {
      try {
        sessionStorage.setItem('portfolio-seen', '1')
      } catch {
        // Storage blocked (some private modes): the next visit simply plays at full length.
      }
      document.body.classList.remove('is-loading')
      document.body.classList.add('is-entered')
      onFinish()
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const timeline = createTimeline({ onComplete: finish }).add(el, { opacity: 0, duration: 200, ease: 'linear' })
      return () => timeline.revert()
    }
    const name = el.querySelector('.loader-name')
    const curtain = el.querySelector('.loader-curtain')
    const cream = '#f3f0ea'
    const timeline = createTimeline({ playbackRate: playbackRate(), onComplete: finish })
      // Curtain rises over the page; the name rides on top of it in cream.
      .add(curtain, { y: ['100%', '0%'], duration: 640, ease: 'inOut(4)' }, 0)
      .add(el.querySelector('.loader-meta'), { opacity: 0, duration: 260, ease: 'out(2)' }, 0)
      .add([name, el.querySelector('.loader-dot')], { color: cream, duration: 420, ease: 'out(2)' }, 220)
      .call(() => { el.style.background = 'transparent' }, 660)
      // Curtain lifts off the top to reveal the studio.
      .add(curtain, { y: '-100%', duration: 820, ease: 'inOut(4)' }, 720)
    const target = handoffTarget()
    if (target) {
      // FLIP the name onto the laptop screen, then hand off to the real one. Both sides are
      // measured by their glyphs: the screen's <p> box spans the whole screen width.
      const chars = name.querySelectorAll('.loader-char')
      const box = name.getBoundingClientRect()
      const left = chars[0].getBoundingClientRect().left
      const from = { left, top: box.top, height: box.height, width: chars[chars.length - 1].getBoundingClientRect().right - left }
      const range = document.createRange()
      range.selectNodeContents(target)
      const to = range.getBoundingClientRect()
      const scale = to.width / from.width
      timeline
        .add(name, {
          // Scaling pivots on the box's top-left, so the first glyph's inset scales too.
          x: to.left - box.left - (from.left - box.left) * scale,
          y: to.top + to.height / 2 - (from.top + (from.height * scale) / 2),
          scale,
          duration: 820,
          ease: 'inOut(4)',
        }, 720)
        // Hold the real name back until the loader's lands on it, then crossfade.
        .set(target, { opacity: 0 }, 0)
        .add(name, { opacity: 0, duration: 260, ease: 'out(2)' }, 1360)
        .add(target, { opacity: 1, duration: 260, ease: 'out(2)' }, 1360)
    } else {
      timeline.add(name, { y: '-40vh', opacity: 0, duration: 700, ease: 'in(3)' }, 720)
    }
    return () => timeline.revert()
  }, [ready, introDone, onFinish])

  return (
    <div ref={root} className="loader" role="status" aria-label="Loading">
      <div className="loader-curtain" aria-hidden="true" />
      <p className="loader-name" aria-hidden="true">
        <Word text={FIRST} offset={0} className="is-first" />
        <Word text={LAST} offset={FIRST.length} className="is-last">
          <span className="loader-dot">.</span>
        </Word>
      </p>
      <div className="loader-meta" aria-hidden="true">
        <span className="loader-rule" />
        <span>Harness engineering &amp; efficient ML</span>
        <span ref={count} className="loader-count">000%</span>
      </div>
    </div>
  )
}
