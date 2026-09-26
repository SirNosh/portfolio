import Chapter from '../components/Chapter/Chapter'

export default function HeroSection() {
  return (
    <Chapter id="between" index="01" label="Between" tone="dark" titleId="between-title" hero>
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
