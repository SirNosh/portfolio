import PaperSheet from '../components/PaperSheet/PaperSheet'
import ExternalLink from '../components/ExternalLink/ExternalLink'
import { Knot, Pin } from '../components/Pin/Knot'
import { LinkageStudy } from '../components/Drawings/Studies'
import { links } from '../app/links'

const watches = [
  ['continue', 'CONTINUE', 'Progress matches the plan'],
  ['retry', 'RETRY', 'The same primitive, a fresh screen'],
  ['replan', 'REPLAN', 'The ledger is wrong, not the click'],
  ['rollback', 'ROLL BACK', 'Return to the last safe state'],
  ['stop', 'STOP', 'The constraint wins'],
]

export default function ParallaxSection() {
  return (
    <PaperSheet id="parallax" index="06" label="Parallax" titleId="parallax-title">
      <div className="sheet-grid">
        <div className="prose" data-copy>
          <h2 id="parallax-title">
            <ExternalLink href={links.parallax}>Parallax</ExternalLink>
          </h2>
          <p className="working-title">Planning in the cloud. Acting at the edge. Watching both.</p>
          <p>
            A long-horizon desktop automation architecture combining cloud planning, local visual execution, watchdog evaluation, checkpointing, recovery, rollback, and safety constraints.
          </p>
          <div className="layers">
            <article>
              <h3>Upper layer</h3>
              <p>Cloud orchestrator, planning, task ledger, progress model.</p>
            </article>
            <article>
              <h3>Lower layer</h3>
              <p>Screenshots, local visual grounding, desktop actions, rollback state.</p>
            </article>
          </div>
          <p className="link-row">
            <ExternalLink href={links.parallax}>Code</ExternalLink>
          </p>
        </div>
      </div>
      <ul className="watch-row">
        {watches.map(([pin, kicker, result]) => (
          <li key={pin}>
            <Knot
              pin={`watch-${pin}`}
              thread="branch"
              drag
              card={{
                kicker,
                rows: [
                  ['Actor', 'Watchdog'],
                  ['Result', result],
                ],
                note: 'The execution string does not get the last word.',
              }}
            />
            <span>{kicker}</span>
          </li>
        ))}
      </ul>
      <Pin pin="watch-cross" thread="branch" className="pin-bow" />
      <div className="spine">
        <Knot
          pin="g-par"
          drag
          href={links.parallax}
          card={{
            kicker: 'EDGE EXECUTION',
            rows: [
              ['Layer', 'Local visual action'],
              ['Link', 'GitHub'],
            ],
          }}
        />
        <Knot
          pin="g-watch"
          drag
          card={{
            kicker: 'WATCHDOG',
            rows: [
              ['Intersects', 'The execution string'],
              ['Decisions', 'Continue, retry, replan, roll back, stop'],
            ],
          }}
        />
      </div>
      <figure className="study-slot" data-drift>
        <LinkageStudy />
        <figcaption>A linkage, not a loom.</figcaption>
      </figure>
    </PaperSheet>
  )
}
