import Chapter from '../components/Chapter/Chapter'
import ExternalLink from '../components/ExternalLink/ExternalLink'
import { links } from '../app/links'

const steps = [
  'Research direction',
  'Mission definition',
  'Agent delegation',
  'Experiment execution',
  'Evidence capture',
  'Review and challenge',
  'Claim maintenance',
  'Paper production',
]

export default function NoshSection() {
  return (
    <Chapter id="nosh" index="04" label="NOSH" tone="light" titleId="nosh-title">
      <p className="status">Active development</p>
      <h2 id="nosh-title">
        <ExternalLink href={links.nosh}>NOSH</ExternalLink>
      </h2>
      <p className="working-title">Networked Orchestrated Science Harness</p>
      <p className="lede">
        A local-first research operating environment for accountable, reproducible agent-run ML research.
      </p>
      <ol className="steps">
        {steps.map((step, index) => (
          <li key={step} data-reveal>
            <span>{String(index + 1).padStart(2, '0')}</span>
            {step}
          </li>
        ))}
      </ol>
      <p>
        Outputs are supposed to become maintained, evidence-linked research state. Not another transcript that disappears when the chat does.
      </p>
      <p className="quiet">
        Not release-ready. Validation, security, accessibility, device, relay, and soak-test gates are still open.
      </p>
      <p className="link-row">
        <ExternalLink href={links.nosh}>Code</ExternalLink>
      </p>
      <p className="aside">Agents can move quickly. Research still has to remain true.</p>
    </Chapter>
  )
}
