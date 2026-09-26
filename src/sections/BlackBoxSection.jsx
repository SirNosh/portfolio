import PaperSheet from '../components/PaperSheet/PaperSheet'
import MarginalNote from '../components/MarginalNote/MarginalNote'
import { Knot } from '../components/Pin/Knot'
import { HandStudy } from '../components/Drawings/Studies'

const roles = [
  ['role-worker', 'Worker', 'A spawned line of work'],
  ['role-verifier', 'Verifier', 'Checks the candidate before it counts'],
  ['role-reviewer', 'Reviewer', 'Challenges the claim, not the vibe'],
  ['role-executor', 'Executor', 'The action that actually lands'],
]

const decisions = [
  ['g-delegate', 'DELEGATION', 'Orchestrator', 'Task needs another context', 'Worker spawned'],
  ['g-verify', 'VERIFICATION', 'Verifier', 'Conflicting evidence', 'Plan revised'],
  ['g-synth', 'SYNTHESIS', 'Orchestrator', 'Branches finished', 'One maintained claim'],
  ['g-reroute', 'REROUTING', 'Orchestrator', 'Wrong specialist', 'Handoff changed'],
  ['g-recover', 'RECOVERY', 'Watchdog', 'Drift after an action', 'Retry from checkpoint'],
  ['g-stop', 'STOPPING', 'Orchestrator', 'Enough evidence, or too much cost', 'Rollout ends'],
]

export default function BlackBoxSection() {
  return (
    <PaperSheet id="black-box" index="02" label="Black Box" titleId="black-box-title">
      <div className="sheet-grid">
        <div className="prose" data-copy>
          <h2 id="black-box-title">Clearing the black box between model calls.</h2>
          <p>
            Agent systems are often evaluated by their final answer while the orchestration decisions that produced it remain opaque.
          </p>
          <ul className="role-row">
            {roles.map(([pin, name, detail]) => (
              <li key={pin}>
                <Knot
                  pin={pin}
                  thread="branch"
                  drag
                  card={{
                    kicker: name.toUpperCase(),
                    rows: [
                      ['Role', name],
                      ['Meaning', detail],
                    ],
                    note: 'A new string is a new line of investigation.',
                  }}
                />
                <span>{name}</span>
              </li>
            ))}
          </ul>
        </div>
        <MarginalNote>Adding another agent is easy. Knowing when it helps is the research problem.</MarginalNote>
      </div>
      <div className="spine spine-spread">
        {decisions.map(([pin, kicker, actor, reason, result]) => (
          <Knot
            key={pin}
            pin={pin}
            drag
            card={{
              kicker,
              rows: [
                ['Actor', actor],
                ['Reason', reason],
                ['Result', result],
                ['Cost', 'Another decision, not another slogan'],
              ],
              note: 'Trace sketch. Not a logged run.',
            }}
          />
        ))}
      </div>
      <div className="study-slot study-hand" data-drift>
        <HandStudy />
      </div>
    </PaperSheet>
  )
}
