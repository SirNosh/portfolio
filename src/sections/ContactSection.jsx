import Chapter from '../components/Chapter/Chapter'
import { contact } from '../app/siteData'

export default function ContactSection() {
  return (
    <Chapter id="contact" index="10" label="Contact" tone="dark" titleId="contact-title">
      <h2 id="contact-title">
        I’m looking for research-engineering roles where agent systems are treated as systems<span className="dot">.</span>
      </h2>
      <p className="lede">Building agent systems that need more structure than another prompt?</p>
      <a className="cta" href={contact.mailto}>
        Email me about a research-engineering role
      </a>
      <p className="quiet-links">
        <a href={contact.github} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">
          LinkedIn
        </a>
      </p>
    </Chapter>
  )
}
