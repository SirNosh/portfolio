import PaperSheet from '../components/PaperSheet/PaperSheet'
import { Knot, Pin } from '../components/Pin/Knot'

const illustrative = {
  kicker: 'INTERVENTION',
  rows: [
    ['Proposed action', 'Delegate to verifier'],
    ['Eligibility', 'State has conflicting evidence'],
    ['Treatment', 'Execute or suppress'],
    ['Resulting action', 'Assigned at the knot'],
    ['Cost', 'One held-out call'],
    ['Outcome effect', 'Unmeasured, so far'],
  ],
  note: 'Illustrative trace. Not an experimental result.',
}

export default function CausalResearchSection() {
  return (
    <PaperSheet id="causal" index="03" label="Causal Orch" titleId="causal-title">
      <div className="sheet-grid">
        <div className="prose" data-copy>
          <p className="status">Paper in production</p>
          <h2 id="causal-title">Which orchestration decisions actually help?</h2>
          <p className="working-title">
            Causal Effects of Dynamic Orchestration Decisions in Multi-Agent LLM Systems
          </p>
          <p>
            A controlled study of delegation, verification, and stopping in dynamic multi-agent systems. Instead of treating trace correlations as causal explanations, the experiment intervenes after the orchestrator proposes an action and before that action is executed.
          </p>
          <p>
            Which dynamic orchestration decisions causally improve task success, efficiency, and reliability in multi-agent LLM systems?
          </p>
          <p className="quiet">
            Repository and manuscript will be linked when the work is ready for public release.
          </p>
          <div className="split">
            <div>
              <Pin pin="path-taken" thread="branch" />
              <strong>Executed</strong>
              <span>The action the treatment allowed.</span>
            </div>
            <div>
              <Pin pin="path-faint" thread="branch" />
              <strong>Suppressed</strong>
              <span>The counterfactual that stays faint.</span>
            </div>
          </div>
        </div>
      </div>
      <div className="spine">
        <Knot pin="g-causal" drag card={illustrative} />
        <Knot pin="g-split" drag card={illustrative} />
      </div>
    </PaperSheet>
  )
}
