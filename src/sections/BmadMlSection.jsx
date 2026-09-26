import Chapter from '../components/Chapter/Chapter'
import ExternalLink from '../components/ExternalLink/ExternalLink'
import { links } from '../app/links'

export default function BmadMlSection() {
  return (
    <Chapter id="bmad" index="05" label="BMAD-ML" tone="dark" titleId="bmad-title">
      <h2 id="bmad-title">
        <ExternalLink href={links.bmad}>BMAD-ML</ExternalLink>
      </h2>
      <p className="working-title">Accountability before autonomy.</p>
      <p className="lede">
        A structured workflow ecosystem that gives ML research agents explicit roles, maintained artifacts, review stages, and predictable output contracts.
      </p>
      <dl className="spec">
        <div>
          <dt>Contracts</dt>
          <dd>Worker and reviewer roles, with boundaries.</dd>
        </div>
        <div>
          <dt>Artifacts</dt>
          <dd>Structured outputs and maintained truth files.</dd>
        </div>
        <div>
          <dt>Gates</dt>
          <dd>Review before a harness can be picked up again.</dd>
        </div>
      </dl>
      <p>
        BMAD-ML asked how agent work could become more structured. NOSH asks how the entire research process can become durable, accountable, and reproducible.
      </p>
      <p className="link-row">
        <ExternalLink href={links.bmad}>Code</ExternalLink>
      </p>
      <p className="aside">Before the operating environment came the contracts.</p>
    </Chapter>
  )
}
