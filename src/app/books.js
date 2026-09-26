import { links } from './links'

export const shelfBooks = [
  {
    id: 'experience',
    title: 'Work Experience',
    date: '',
    color: '#6b4f3a',
    foil: '#f7f3ec',
    pages: [
      {
        title: 'Safe Guard Products International',
        paragraphs: [
          'Vision-language work on claim images: preprocessing, targeted visual regions, and YOLO-assisted localization. I also worked on an internal agentic claims assistant that surfaced the policy that applied while a form was being filled. That assistant is internal.',
        ],
      },
      {
        title: 'MEDxAI',
        paragraphs: [
          'End-to-end machine learning for prediction and recommendation, then the part that decides whether any of it matters: production integration, reliability, and efficiency.',
        ],
      },
    ],
  },
  {
    id: 'research',
    title: 'Research',
    date: '',
    color: '#7d2e2e',
    foil: '#f7f3ec',
    pages: [
      {
        title: 'Clearing the black box between model calls',
        paragraphs: [
          'Agent systems are often evaluated by their final answer while the orchestration decisions that produced it remain opaque.',
        ],
        roles: [
          ['Worker', 'A spawned line of work'],
          ['Verifier', 'Checks the candidate before it counts'],
          ['Reviewer', 'Challenges the claim, not the vibe'],
          ['Executor', 'The action that actually lands'],
        ],
        decisions: [
          ['Delegation', 'Orchestrator. Task needs another context. Worker spawned.'],
          ['Verification', 'Verifier. Conflicting evidence. Plan revised.'],
          ['Synthesis', 'Orchestrator. Branches finished. One maintained claim.'],
          ['Rerouting', 'Orchestrator. Wrong specialist. Handoff changed.'],
          ['Recovery', 'Watchdog. Drift after an action. Retry from checkpoint.'],
          ['Stopping', 'Orchestrator. Enough evidence, or too much cost. Rollout ends.'],
        ],
        aside: 'Adding another agent is easy. Knowing when it helps is the research problem.',
      },
      {
        title: 'Which orchestration decisions actually help?',
        status: 'Paper in production',
        workingTitle: 'Causal Effects of Dynamic Orchestration Decisions in Multi-Agent LLM Systems',
        paragraphs: [
          'A controlled study of delegation, verification, and stopping in dynamic multi-agent systems. Instead of treating trace correlations as causal explanations, the experiment intervenes after the orchestrator proposes an action and before that action is executed.',
          'Which dynamic orchestration decisions causally improve task success, efficiency, and reliability in multi-agent LLM systems?',
        ],
        tiles: [
          ['Executed', 'The action the treatment allowed.'],
          ['Suppressed', 'The counterfactual that stays unmeasured.'],
        ],
        quiet: 'Repository and manuscript will be linked when the work is ready for public release.',
      },
      {
        title: 'Recurrent computation',
        paragraphs: [
          'I began by studying whether models could perform more computation per token through recurrent transformer blocks.',
        ],
        links: [
          { href: links.more, label: 'MoRE code' },
          { href: links.moreDemo, label: 'Demo' },
        ],
      },
      {
        title: 'Mixture of recurrent experts',
        paragraphs: [
          'That led me to introduce a Mixture of Experts framework inside recurrent transformer architectures, allowing specialized components to perform iterative computation.',
        ],
      },
      {
        title: 'Continual learning and distribution shift',
        paragraphs: [
          'Under distribution shift, protecting the experts was not enough. The component deciding which expert to use could forget too.',
        ],
      },
      {
        title: 'Mixture of Bidders',
        paragraphs: [
          'MoB replaced the learned router with a stateless auction in which experts bid according to competence and forgetting cost. On Split-MNIST the paper reports 88.77% average accuracy, against 19.54% for a gated MoE and 27.96% for monolithic EWC.',
        ],
        links: [
          { href: links.mobPaper, label: 'Paper' },
          { href: links.mobCode, label: 'Code' },
        ],
      },
      {
        title: 'Entropy-based dynamic expert allocation',
        paragraphs: [
          'I also tested whether model uncertainty could determine how many experts a token should receive. A plausible proxy is still only a proxy. No result is claimed here.',
        ],
      },
      {
        title: 'PPO stability',
        paragraphs: [
          'In parallel, I studied whether persistent probe states could expose behavioral policy drift that episodic return misses. Fixed probes, action flips, margin-aware risk, and the limits of raw KL. The probes are measurement instruments, not guarantees. The repository holds the experiments and the paper artifact.',
        ],
        links: [{ href: links.ppo, label: 'Code' }],
      },
      {
        title: 'Agent harnesses',
        paragraphs: [
          'Repeated use of different models, coding agents, subagent extensions, and orchestration harnesses shifted my attention from individual model behavior to the systems around them. Workers, reviewers, maintained artifacts, BMAD-ML, NOSH, and workflows that are allowed to run for a long time.',
        ],
      },
      {
        title: 'Agent systems',
        paragraphs: [
          'The recurring failures were increasingly located between model calls: unclear delegation, missing accountability, redundant work, weak verification, lost state, and poor stopping decisions.',
        ],
      },
      {
        title: 'Causal orchestration',
        paragraphs: [
          'The next question is not whether orchestration correlates with success. It is which orchestration decisions causally help, under which states, and at what cost.',
        ],
      },
    ],
  },
  {
    id: 'projects',
    title: 'Projects',
    date: '',
    color: '#243056',
    foil: '#f4efe4',
    pages: [
      {
        title: 'NOSH',
        href: links.nosh,
        status: 'Active development',
        workingTitle: 'Networked Orchestrated Science Harness',
        paragraphs: [
          'A local-first research operating environment for accountable, reproducible agent-run ML research.',
        ],
        steps: [
          'Research direction',
          'Mission definition',
          'Agent delegation',
          'Experiment execution',
          'Evidence capture',
          'Review and challenge',
          'Claim maintenance',
          'Paper production',
        ],
        more: [
          'Outputs are supposed to become maintained, evidence-linked research state. Not another transcript that disappears when the chat does.',
        ],
        quiet: 'Not release-ready. Validation, security, accessibility, device, relay, and soak-test gates are still open.',
        links: [{ href: links.nosh, label: 'Code' }],
        aside: 'Agents can move quickly. Research still has to remain true.',
      },
      {
        title: 'Parallax',
        href: links.parallax,
        workingTitle: 'Planning in the cloud. Acting at the edge. Watching both.',
        paragraphs: [
          'A long-horizon desktop automation architecture combining cloud planning, local visual execution, watchdog evaluation, checkpointing, recovery, rollback, and safety constraints.',
        ],
        layers: [
          ['Upper layer', 'Cloud orchestrator, planning, task ledger, progress model.'],
          ['Lower layer', 'Screenshots, local visual grounding, desktop actions, rollback state.'],
        ],
        tiles: [
          ['Continue', 'Progress matches the plan'],
          ['Retry', 'The same primitive, a fresh screen'],
          ['Replan', 'The ledger is wrong, not the click'],
          ['Roll back', 'Return to the last safe state'],
          ['Stop', 'The constraint wins'],
        ],
        links: [{ href: links.parallax, label: 'Code' }],
      },
      {
        title: 'BMAD-ML',
        href: links.bmad,
        workingTitle: 'Accountability before autonomy.',
        paragraphs: [
          'A structured workflow ecosystem that gives ML research agents explicit roles, maintained artifacts, review stages, and predictable output contracts.',
        ],
        decisions: [
          ['Contracts', 'Worker and reviewer roles, with boundaries.'],
          ['Artifacts', 'Structured outputs and maintained truth files.'],
          ['Gates', 'Review before a harness can be picked up again.'],
        ],
        more: [
          'BMAD-ML asked how agent work could become more structured. NOSH asks how the entire research process can become durable, accountable, and reproducible.',
        ],
        links: [{ href: links.bmad, label: 'Code' }],
        aside: 'Before the operating environment came the contracts.',
      },
    ],
  },
  {
    id: 'writings',
    title: 'Writings',
    date: '',
    color: '#1e4a40',
    foil: '#f7f3ec',
    pages: [
      {
        title: 'None as of now :P',
      },
    ],
  },
]
