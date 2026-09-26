import PaperSheet from '../components/PaperSheet/PaperSheet'
import { Knot } from '../components/Pin/Knot'
import { contact } from '../app/siteData'

export default function ContactSection() {
  return (
    <PaperSheet id="contact" index="10" label="Contact" titleId="contact-title">
      <div className="prose" data-copy>
        <h2 id="contact-title">I’m looking for research-engineering roles where agent systems are treated as systems.</h2>
        <p>Building agent systems that need more structure than another prompt?</p>
        <a className="seal-link" href={contact.mailto}>
          <span className="seal" aria-hidden="true" />
          Email me about a research-engineering role
        </a>
        <p className="quiet-links">
          <a href={contact.github} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </p>
        <p className="marginal marginal-inline">End of rollout. Beginning of another.</p>
      </div>
      <div className="spine">
        <Knot
          pin="g-seal"
          card={{
            kicker: 'COMMITTED OUTPUT',
            rows: [
              ['Action', 'Email'],
              ['To', contact.email],
            ],
          }}
        />
      </div>
    </PaperSheet>
  )
}
