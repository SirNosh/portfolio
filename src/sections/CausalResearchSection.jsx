import Chapter from '../components/Chapter/Chapter'

export default function CausalResearchSection() {
  return (
    <Chapter id="causal" index="03" label="Causal orch" tone="dark" titleId="causal-title" book="research">
      <p className="status">Paper in production</p>
      <h2 id="causal-title">
        Which orchestration decisions actually help<span className="dot">?</span>
      </h2>
      <p className="working-title">
        Causal Effects of Dynamic Orchestration Decisions in Multi-Agent LLM Systems
      </p>
      <p className="lede">
        A controlled study of delegation, verification, and stopping in dynamic multi-agent systems. Instead of treating trace correlations as causal explanations, the experiment intervenes after the orchestrator proposes an action and before that action is executed.
      </p>
      <p>
        Which dynamic orchestration decisions causally improve task success, efficiency, and reliability in multi-agent LLM systems?
      </p>
      <pre className="code">
        <code>
          <span className="tok-muted"># illustrative. not a logged run.</span>
          {'\n'}
          <span className="tok-key">proposed</span> <span className="tok-str">&quot;delegate to verifier&quot;</span>
          {'\n'}
          <span className="tok-key">eligibility</span> <span className="tok-str">&quot;conflicting evidence&quot;</span>
          {'\n'}
          <span className="tok-key">treatment</span> <span className="tok-red">execute | suppress</span>
          {'\n'}
          <span className="tok-key">outcome</span> <span className="tok-muted">unmeasured, so far</span>
        </code>
      </pre>
      <ul className="tiles">
        <li data-reveal>
          <strong>Executed</strong>
          <span>The action the treatment allowed.</span>
        </li>
        <li data-reveal>
          <strong>Suppressed</strong>
          <span>The counterfactual that stays unmeasured.</span>
        </li>
      </ul>
      <p className="quiet">Repository and manuscript will be linked when the work is ready for public release.</p>
    </Chapter>
  )
}
