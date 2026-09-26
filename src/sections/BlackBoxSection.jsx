import Chapter from '../components/Chapter/Chapter'

const roles = [
  ['#ff4b4b', 'Worker', 'A spawned line of work'],
  ['#f2c14e', 'Verifier', 'Checks the candidate before it counts'],
  ['#3ec6ff', 'Reviewer', 'Challenges the claim, not the vibe'],
  ['#3ddc97', 'Executor', 'The action that actually lands'],
]

const decisions = [
  ['Delegation', 'Orchestrator', 'Task needs another context', 'Worker spawned'],
  ['Verification', 'Verifier', 'Conflicting evidence', 'Plan revised'],
  ['Synthesis', 'Orchestrator', 'Branches finished', 'One maintained claim'],
  ['Rerouting', 'Orchestrator', 'Wrong specialist', 'Handoff changed'],
  ['Recovery', 'Watchdog', 'Drift after an action', 'Retry from checkpoint'],
  ['Stopping', 'Orchestrator', 'Enough evidence, or too much cost', 'Rollout ends'],
]

export default function BlackBoxSection() {
  return (
    <Chapter id="black-box" index="02" label="Black box" tone="light" titleId="black-box-title" book="research">
      <h2 id="black-box-title">
        Clearing the black box between model calls<span className="dot">.</span>
      </h2>
      <p className="lede">
        Agent systems are often evaluated by their final answer while the orchestration decisions that produced it remain opaque.
      </p>
      <ul className="tiles">
        {roles.map(([color, name, detail]) => (
          <li key={name} data-reveal>
            <i className="swatch" style={{ background: color }} />
            <strong>{name}</strong>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
      <dl className="spec">
        {decisions.map(([name, actor, reason, result]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>
              {actor}. {reason}. {result}.
            </dd>
          </div>
        ))}
      </dl>
      <p className="aside">Adding another agent is easy. Knowing when it helps is the research problem.</p>
    </Chapter>
  )
}
