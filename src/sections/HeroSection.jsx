import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import PaperSheet from '../components/PaperSheet/PaperSheet'
import MarginalNote from '../components/MarginalNote/MarginalNote'
import { Knot, Pin } from '../components/Pin/Knot'
import { CompassStudy } from '../components/Drawings/Studies'

const gapCard = {
  kicker: 'PRIMARY TRAJECTORY',
  rows: [
    ['Actor', 'Orchestrator'],
    ['Meaning', 'The objective moving through the system'],
    ['State', 'Rest path'],
  ],
  note: 'Pull it. It returns.',
}

export default function HeroSection({ loop = false }) {
  const hint = useRef(null)
  const id = loop ? 'again' : 'between'
  const group = loop ? 'loop' : 'hero'
  const gutter = loop ? 'g-loop' : 'g-hero'

  useEffect(() => {
    if (loop) return undefined
    const node = hint.current
    if (!node) return undefined
    const onScroll = () => {
      if (window.scrollY < 28) return
      animate(node, { opacity: 0, duration: 280, ease: 'out(2)' })
      window.removeEventListener('scroll', onScroll)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [loop])

  return (
    <PaperSheet
      id={id}
      index={loop ? '∞' : '01'}
      label={loop ? 'Again' : 'Between'}
      titleId={`${id}-title`}
      className="chapter-hero"
      hidden={loop}
    >
      <div className="hero-layout">
        <div>
          <h1 id={`${id}-title`} className="display">
            <span className="line">I study what happens</span>
            <span className="line line-gap">
              <span>between</span>
              <span className="gap-pins">
                <Pin pin={`${group}-in`} thread="stitch" group={group} />
                <Knot
                  pin={`${group}-gap`}
                  thread="stitch"
                  group={group}
                  hero={!loop}
                  drag
                  card={gapCard}
                />
                <Pin pin={`${group}-out`} thread="stitch" group={group} />
              </span>
              <span>agents.</span>
            </span>
          </h1>
          <p className="role">Agent orchestration researcher and systems builder.</p>
          <p className="prose" data-copy>
            I build and causally analyze harnesses for long-horizon agent systems, focusing on how they delegate, verify, coordinate, recover, aggregate, and stop.
          </p>
          <p ref={loop ? undefined : hint} className="scroll-hint">
            {loop ? '\u00a0' : 'Scroll. The thread knows where it is going.'}
          </p>
        </div>
        <MarginalNote>The model gets the credit. The harness gets the blame.</MarginalNote>
      </div>
      <figure className="study-slot" data-drift>
        <CompassStudy />
        <figcaption>Direction, not destination.</figcaption>
      </figure>
      <span className="spine">
        <Pin pin={gutter} />
      </span>
    </PaperSheet>
  )
}
