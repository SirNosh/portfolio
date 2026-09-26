import PaperSheet from '../components/PaperSheet/PaperSheet'
import MarginalNote from '../components/MarginalNote/MarginalNote'
import ExternalLink from '../components/ExternalLink/ExternalLink'
import { Knot, Pin } from '../components/Pin/Knot'
import { links } from '../app/links'

export default function BmadMlSection() {
  return (
    <PaperSheet id="bmad" index="05" label="BMAD-ML" titleId="bmad-title">
      <div className="sheet-grid">
        <div className="prose" data-copy>
          <h2 id="bmad-title">
            <ExternalLink href={links.bmad}>BMAD-ML</ExternalLink>
          </h2>
          <p className="working-title">Accountability before autonomy.</p>
          <p>
            A structured workflow ecosystem that gives ML research agents explicit roles, maintained artifacts, review stages, and predictable output contracts.
          </p>
          <p>
            Worker and reviewer contracts, role boundaries, structured outputs, maintained truth files, artifact ownership, review gates. The point is that a harness can be picked up again, including by a different one.
          </p>
          <p>
            BMAD-ML asked how agent work could become more structured. NOSH asks how the entire research process can become durable, accountable, and reproducible.
          </p>
          <p className="link-row">
            <ExternalLink href={links.bmad}>Code</ExternalLink>
          </p>
        </div>
        <MarginalNote>Before the operating environment came the contracts.</MarginalNote>
      </div>
      <div className="spine">
        <Knot
          pin="g-bmad"
          drag
          href={links.bmad}
          card={{
            kicker: 'CONTRACT',
            rows: [
              ['Actor', 'Worker and reviewer'],
              ['Result', 'A maintained artifact'],
              ['Status', 'Rejoins NOSH'],
            ],
          }}
        />
        <Pin pin="bmad-bow" thread="branch" className="pin-bow" />
      </div>
    </PaperSheet>
  )
}
