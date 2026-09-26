import PaperSheet from '../components/PaperSheet/PaperSheet'
import MarginalNote from '../components/MarginalNote/MarginalNote'
import ExternalLink from '../components/ExternalLink/ExternalLink'
import { Knot, Pin } from '../components/Pin/Knot'
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
    <PaperSheet id="nosh" index="04" label="NOSH" titleId="nosh-title">
      <div className="sheet-grid">
        <div className="prose" data-copy>
          <p className="status">Active development</p>
          <h2 id="nosh-title">
            <ExternalLink href={links.nosh}>NOSH</ExternalLink>
          </h2>
          <p className="working-title">Networked Orchestrated Science Harness</p>
          <p>A local-first research operating environment for accountable, reproducible agent-run ML research.</p>
          <ol className="steps">
            {steps.map((step) => (
              <li key={step}>{step}</li>
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
          <div className="inline-pins">
            <Pin pin="nosh-evidence" thread="branch" />
            <span>Evidence</span>
            <Pin pin="nosh-claim" thread="branch" />
            <span>Claim</span>
          </div>
        </div>
        <MarginalNote>Agents can move quickly. Research still has to remain true.</MarginalNote>
      </div>
      <div className="spine">
        <Knot
          pin="g-nosh"
          drag
          href={links.nosh}
          card={{
            kicker: 'NOSH',
            rows: [
              ['Status', 'Active development'],
              ['Handoff', 'Mission to evidence to claim'],
              ['Link', 'GitHub'],
            ],
          }}
        />
      </div>
    </PaperSheet>
  )
}
