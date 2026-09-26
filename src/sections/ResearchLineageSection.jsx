import PaperSheet from '../components/PaperSheet/PaperSheet'
import ExternalLink from '../components/ExternalLink/ExternalLink'
import { Knot, Pin } from '../components/Pin/Knot'
import { links } from '../app/links'

export default function ResearchLineageSection() {
  return (
    <PaperSheet id="lineage" index="07" label="Lineage" titleId="lineage-title">
      <div className="sheet-grid">
        <div className="prose" data-copy>
          <h2 id="lineage-title">Different systems. The same recurring problem.</h2>
          <p>
            How should specialized components coordinate, adapt, preserve useful behavior, and decide what happens next?
          </p>
          <ol className="lineage">
            <li>
              <h3>Recurrent computation</h3>
              <p>I began by studying whether models could perform more computation per token through recurrent transformer blocks.</p>
              <p className="link-row">
                <ExternalLink href={links.more}>MoRE code</ExternalLink>
                <ExternalLink href={links.moreDemo}>Demo</ExternalLink>
              </p>
              <span className="recur">
                <Pin pin="recur-a" thread="branch" />
                <Pin pin="recur-b" thread="branch" />
                <Pin pin="recur-c" thread="branch" />
              </span>
            </li>
            <li>
              <h3>Mixture of recurrent experts</h3>
              <p>
                That led me to introduce a Mixture of Experts framework inside recurrent transformer architectures, allowing specialized components to perform iterative computation.
              </p>
            </li>
            <li>
              <h3>Continual learning and distribution shift</h3>
              <p>
                Under distribution shift, protecting the experts was not enough. The component deciding which expert to use could forget too.
              </p>
            </li>
            <li>
              <h3>Mixture of Bidders</h3>
              <p>
                MoB replaced the learned router with a stateless auction in which experts bid according to competence and forgetting cost. On Split-MNIST the paper reports 88.77% average accuracy, against 19.54% for a gated MoE and 27.96% for monolithic EWC.
              </p>
              <p className="link-row">
                <ExternalLink href={links.mobPaper}>Paper</ExternalLink>
                <ExternalLink href={links.mobCode}>Code</ExternalLink>
              </p>
            </li>
            <li>
              <h3>Entropy-based dynamic expert allocation</h3>
              <p>
                I also tested whether model uncertainty could determine how many experts a token should receive. A plausible proxy is still only a proxy. No result is claimed here.
              </p>
            </li>
            <li>
              <h3>PPO stability</h3>
              <p>
                In parallel, I studied whether persistent probe states could expose behavioral policy drift that episodic return misses. Fixed probes, action flips, margin-aware risk, and the limits of raw KL. The probes are measurement instruments, not guarantees. The repository holds the experiments and the paper artifact.
              </p>
              <p className="link-row">
                <ExternalLink href={links.ppo}>Code</ExternalLink>
              </p>
            </li>
            <li>
              <h3>Agent harnesses</h3>
              <p>
                Repeated use of different models, coding agents, subagent extensions, and orchestration harnesses shifted my attention from individual model behavior to the systems around them. Workers, reviewers, maintained artifacts, BMAD-ML, NOSH, and workflows that are allowed to run for a long time.
              </p>
            </li>
            <li>
              <h3>Agent systems</h3>
              <p>
                The recurring failures were increasingly located between model calls: unclear delegation, missing accountability, redundant work, weak verification, lost state, and poor stopping decisions.
              </p>
            </li>
            <li>
              <h3>Causal orchestration</h3>
              <p>
                The next question is not whether orchestration correlates with success. It is which orchestration decisions causally help, under which states, and at what cost.
              </p>
            </li>
          </ol>
        </div>
      </div>
      <div className="spine">
        <Knot
          pin="g-line"
          drag
          card={{
            kicker: 'LINEAGE',
            rows: [
              ['From', 'Recurrent computation'],
              ['To', 'Causal orchestration'],
            ],
            note: 'Same problem, longer horizon.',
          }}
        />
      </div>
    </PaperSheet>
  )
}
