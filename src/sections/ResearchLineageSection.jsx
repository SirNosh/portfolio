import Chapter from '../components/Chapter/Chapter'
import ExternalLink from '../components/ExternalLink/ExternalLink'
import { links } from '../app/links'

export default function ResearchLineageSection() {
  return (
    <Chapter id="lineage" index="07" label="Lineage" tone="dark" titleId="lineage-title">
      <h2 id="lineage-title">
        Different systems. The same recurring problem<span className="dot">.</span>
      </h2>
      <p className="lede">
        How should specialized components coordinate, adapt, preserve useful behavior, and decide what happens next?
      </p>
      <ol className="lineage">
        <li data-reveal>
          <span className="n">01</span>
          <div>
            <h3>Recurrent computation</h3>
            <p>I began by studying whether models could perform more computation per token through recurrent transformer blocks.</p>
            <p className="link-row">
              <ExternalLink href={links.more}>MoRE code</ExternalLink>
              <ExternalLink href={links.moreDemo}>Demo</ExternalLink>
            </p>
          </div>
        </li>
        <li data-reveal>
          <span className="n">02</span>
          <div>
            <h3>Mixture of recurrent experts</h3>
            <p>
              That led me to introduce a Mixture of Experts framework inside recurrent transformer architectures, allowing specialized components to perform iterative computation.
            </p>
          </div>
        </li>
        <li data-reveal>
          <span className="n">03</span>
          <div>
            <h3>Continual learning and distribution shift</h3>
            <p>
              Under distribution shift, protecting the experts was not enough. The component deciding which expert to use could forget too.
            </p>
          </div>
        </li>
        <li data-reveal>
          <span className="n">04</span>
          <div>
            <h3>Mixture of Bidders</h3>
            <p>
              MoB replaced the learned router with a stateless auction in which experts bid according to competence and forgetting cost. On Split-MNIST the paper reports 88.77% average accuracy, against 19.54% for a gated MoE and 27.96% for monolithic EWC.
            </p>
            <p className="link-row">
              <ExternalLink href={links.mobPaper}>Paper</ExternalLink>
              <ExternalLink href={links.mobCode}>Code</ExternalLink>
            </p>
          </div>
        </li>
        <li data-reveal>
          <span className="n">05</span>
          <div>
            <h3>Entropy-based dynamic expert allocation</h3>
            <p>
              I also tested whether model uncertainty could determine how many experts a token should receive. A plausible proxy is still only a proxy. No result is claimed here.
            </p>
          </div>
        </li>
        <li data-reveal>
          <span className="n">06</span>
          <div>
            <h3>PPO stability</h3>
            <p>
              In parallel, I studied whether persistent probe states could expose behavioral policy drift that episodic return misses. Fixed probes, action flips, margin-aware risk, and the limits of raw KL. The probes are measurement instruments, not guarantees. The repository holds the experiments and the paper artifact.
            </p>
            <p className="link-row">
              <ExternalLink href={links.ppo}>Code</ExternalLink>
            </p>
          </div>
        </li>
        <li data-reveal>
          <span className="n">07</span>
          <div>
            <h3>Agent harnesses</h3>
            <p>
              Repeated use of different models, coding agents, subagent extensions, and orchestration harnesses shifted my attention from individual model behavior to the systems around them. Workers, reviewers, maintained artifacts, BMAD-ML, NOSH, and workflows that are allowed to run for a long time.
            </p>
          </div>
        </li>
        <li data-reveal>
          <span className="n">08</span>
          <div>
            <h3>Agent systems</h3>
            <p>
              The recurring failures were increasingly located between model calls: unclear delegation, missing accountability, redundant work, weak verification, lost state, and poor stopping decisions.
            </p>
          </div>
        </li>
        <li data-reveal>
          <span className="n">09</span>
          <div>
            <h3>Causal orchestration</h3>
            <p>
              The next question is not whether orchestration correlates with success. It is which orchestration decisions causally help, under which states, and at what cost.
            </p>
          </div>
        </li>
      </ol>
    </Chapter>
  )
}
