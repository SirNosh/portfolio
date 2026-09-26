export const contact = {
  email: 'devyas17272@gmail.com',
  mailto: 'mailto:devyas17272@gmail.com?subject=Research%20Engineering%20Opportunity',
  github: 'https://github.com/SirNosh',
  linkedin: 'https://www.linkedin.com/in/dev-vyas172',
}

export const rail = [
  { id: 'between', num: '01', label: 'Between' },
  { id: 'black-box', num: '02', label: 'Black Box' },
  { id: 'causal', num: '03', label: 'Causal Orch' },
  { id: 'nosh', num: '04', label: 'NOSH' },
  { id: 'bmad', num: '05', label: 'BMAD-ML' },
  { id: 'parallax', num: '06', label: 'Parallax' },
  { id: 'lineage', num: '07', label: 'Lineage' },
  { id: 'experience', num: '08', label: 'Experience' },
  { id: 'writing', num: '09', label: 'Writing' },
  { id: 'contact', num: '10', label: 'Contact' },
  { id: 'again', num: '∞', label: 'Again' },
]

export const branches = [
  { id: 'worker', color: '#8a6a32', pins: ['g-delegate', 'role-worker'] },
  { id: 'verifier', color: '#3e5c68', pins: ['g-delegate', 'role-verifier'] },
  { id: 'reviewer', color: '#5e4d66', pins: ['g-delegate', 'role-reviewer'] },
  { id: 'executor', color: '#4f6844', pins: ['g-delegate', 'role-executor'] },
  { id: 'taken', color: '#8d3a2c', pins: ['g-split', 'path-taken'] },
  { id: 'faint', color: '#6b6458', pins: ['g-split', 'path-faint'], opacity: 0.38 },
  { id: 'evidence', color: '#4f6844', pins: ['g-nosh', 'nosh-evidence'] },
  { id: 'claims', color: '#8a6a32', pins: ['nosh-evidence', 'nosh-claim'] },
  { id: 'bmad-return', color: '#5e4d66', pins: ['g-bmad', 'bmad-bow', 'g-nosh'] },
  { id: 'watchdog', color: '#3e5c68', pins: ['g-par', 'watch-cross', 'g-watch'] },
  { id: 'recur', color: '#4f6844', pins: ['recur-a', 'recur-b', 'recur-c'], closed: true },
]

export const loaderLines = [
  'Untangling the dependencies.',
  'Checking which thread goes where.',
  'Almost orchestrated.',
  'Loading the models would have been easier.',
  'No agents were spawned for this loading screen.',
]
