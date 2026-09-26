import Chapter from '../components/Chapter/Chapter'
import ExternalLink from '../components/ExternalLink/ExternalLink'
import { links } from '../app/links'

const watches = [
  ['Continue', 'Progress matches the plan'],
  ['Retry', 'The same primitive, a fresh screen'],
  ['Replan', 'The ledger is wrong, not the click'],
  ['Roll back', 'Return to the last safe state'],
  ['Stop', 'The constraint wins'],
]

export default function ParallaxSection() {
  return (
    <Chapter id="parallax" index="06" label="Parallax" tone="light" titleId="parallax-title" book="projects">
      <h2 id="parallax-title">
        <ExternalLink href={links.parallax}>Parallax</ExternalLink>
      </h2>
      <p className="working-title">Planning in the cloud. Acting at the edge. Watching both.</p>
      <p className="lede">
        A long-horizon desktop automation architecture combining cloud planning, local visual execution, watchdog evaluation, checkpointing, recovery, rollback, and safety constraints.
      </p>
      <div className="layers">
        <article data-reveal>
          <h3>Upper layer</h3>
          <p>Cloud orchestrator, planning, task ledger, progress model.</p>
        </article>
        <article data-reveal>
          <h3>Lower layer</h3>
          <p>Screenshots, local visual grounding, desktop actions, rollback state.</p>
        </article>
      </div>
      <ul className="tiles">
        {watches.map(([name, detail]) => (
          <li key={name} data-reveal>
            <strong>{name}</strong>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
      <p className="link-row">
        <ExternalLink href={links.parallax}>Code</ExternalLink>
      </p>
    </Chapter>
  )
}
