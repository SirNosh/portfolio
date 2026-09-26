import Chapter from '../components/Chapter/Chapter'
import { contact } from '../app/siteData'

export default function HeroSection() {
  return (
    <Chapter id="between" index="01" label="Between" tone="dark" titleId="between-title" hero>
      <div className="screen-fallback">
        <p className="screen-name">Dev Vyas</p>
        <p className="screen-role">Harness Engineering and Efficient ML Research</p>
        <p className="screen-links">
          <a href={contact.github} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </p>
      </div>
      <h1 id="between-title" className="display">
        I study what happens between the agents<span className="dot">.</span>
      </h1>
      <p className="lede">
        ML researcher and systems builder. The subject is the machinery around long-horizon model calls: who acts, who checks, and when the system should stop.
      </p>
      <dl className="spec">
        <div>
          <dt>Role</dt>
          <dd>Researcher and systems builder</dd>
        </div>
        <div>
          <dt>Focus</dt>
          <dd>Agent orchestration</dd>
        </div>
        <div>
          <dt>Now</dt>
          <dd>Causal effects of dynamic decisions</dd>
        </div>
      </dl>
    </Chapter>
  )
}
