import GameOfLife from './components/GameOfLife';
import './App.css';

function App() {
  return (
    <div className="app">
      <GameOfLife />

      {/* ─── Hero ─── */}
      <header className="hero">
        <h1 className="hero-title">Dev Vyas</h1>
        <p className="hero-subtitle">
          <em>ML Researcher &amp; Engineer</em>
        </p>

        <nav className="toc">
          <a href="#research">Research</a>
          <a href="#projects">Projects</a>
          <a href="#work">Work Experience</a>
        </nav>

        <div className="social-links">
          <a href="https://github.com/SirNosh" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://linkedin.com/in/dev-vyas172" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="mailto:devyas17272@gmail.com">Email</a>
        </div>
      </header>

      <hr className="divider" />

      {/* ─── Research ─── */}
      <section id="research" className="section">
        <h2 className="section-heading">Research</h2>
        <p className="section-intro">Publications &amp; Ongoing Work</p>

        <article className="entry">
          <h3 className="entry-title">
            A Comprehensive Survey of Mixture of Experts (MoE) Architectures
          </h3>
          <p className="entry-meta">
            <em>AIM 2026 (Accepted)</em>
          </p>
          <p>
            Authored comprehensive 50-page survey paper on MoE architectures,
            tracing evolution from foundational ensemble techniques to
            state-of-the-art sparse computation frameworks in modern LLMs.
          </p>
          <p>
            Synthesized research from 145+ academic sources across NeurIPS, ICML,
            ICLR, and EMNLP proceedings.
          </p>
        </article>

        <article className="entry">
          <h3 className="entry-title">
            <a href="https://arxiv.org/abs/2512.10969v1" target="_blank" rel="noopener noreferrer">[arXiv]</a>{' '}
            <a href="https://github.com/SirNosh/MoB" target="_blank" rel="noopener noreferrer">[GitHub]</a>{' '}
            MoB: Mixture of Bidders Framework
          </h3>
          <p className="entry-meta">
            <span className="mono">PyTorch · VCG Auction Theory · Continual Learning</span>
          </p>
          <p>
            Orchestrating a decentralized framework where expert networks compete
            for data batches via truthful VCG auctions, replacing centralized
            routing to foster emergent specialization.
          </p>
        </article>

        <article className="entry">
          <h3 className="entry-title">
            <a href="https://github.com/SirNosh/MoRE" target="_blank" rel="noopener noreferrer">[GitHub]</a>{' '}
            <a href="https://more-ao1.pages.dev/" target="_blank" rel="noopener noreferrer">[Visualizer]</a>{' '}
            Mixture of Recurrent Experts (MoRE) Model
          </h3>
          <p className="entry-meta">
            <span className="mono">PyTorch · MoE</span>
          </p>
          <p>
            Architecting and validating a novel MoRE model, investigating four
            distinct variants to enhance capabilities in multi-step and
            algorithmic reasoning in Recurrent Transformer architectures.
          </p>
        </article>

        <article className="entry">
          <h3 className="entry-title">
            <a href="https://github.com/SirNosh/Neuroplastic-COT" target="_blank" rel="noopener noreferrer">[GitHub]</a>{' '}
            Preventing Catastrophic Forgetting in LLMs
          </h3>
          <p className="entry-meta">
            <span className="mono">Qwen 2.5 · PyTorch · EWC · SI · Avalanche</span>
          </p>
          <p>
            Implementing EWC and SI algorithms achieving 60–80% reduction in
            forgetting across mathematical domains on Qwen2.5-7B.
          </p>
        </article>

        <article className="entry">
          <h3 className="entry-title">AI-Driven Plagiarism Detection System</h3>
          <p className="entry-meta">
            <span className="mono">Python · NLP · SVM · BERT</span>
          </p>
          <p>
            Developed a comprehensive ML-based plagiarism detection system
            achieving 78.08% accuracy and 84.34% F1 score.
          </p>
        </article>
      </section>

      <hr className="divider" />

      {/* ─── Projects ─── */}
      <section id="projects" className="section">
        <h2 className="section-heading">Projects</h2>

        <article className="entry">
          <h3 className="entry-title">
            <a href="https://github.com/SirNosh/ChessNexus" target="_blank" rel="noopener noreferrer">
              ChessNexus RL Engine
            </a>
          </h3>
          <p className="entry-meta">
            <span className="mono">Python · TensorFlow · RL · CUDA</span>
          </p>
          <p>
            Building a sophisticated chess environment featuring a DQN
            reinforcement learning agent trained via self-play. Implementing
            parallel game simulation, tournament management, and real-time
            visualization. Optimized for NVIDIA GPUs with CUDA 12.8, JIT
            compilation, and mixed-precision training.
          </p>
        </article>

        <article className="entry">
          <h3 className="entry-title">
            <a href="https://github.com/SirNosh/QuantumVIX" target="_blank" rel="noopener noreferrer">
              QuantumVIX Trading System
            </a>
          </h3>
          <p className="entry-meta">
            <span className="mono">Python · RL (PPO) · Black-Scholes</span>
          </p>
          <p>
            Advanced trading system using Proximal Policy Optimization to exploit
            volatility in S&amp;P 500 futures and options. Engineered state
            representation incorporating Black-Scholes volatility metrics and
            multi-timeframe momentum signals.
          </p>
        </article>

        <article className="entry">
          <h3 className="entry-title">
            <a href="https://github.com/SirNosh/git-fixer" target="_blank" rel="noopener noreferrer">
              Git-Fixer
            </a>
          </h3>
          <p className="entry-meta">
            <span className="mono">Python · CLI · PyPI</span>
          </p>
          <p>
            Developed and published a Python library and CLI tool on PyPI to
            programmatically generate synthetic Git commit histories. Features
            customizable date ranges and realistic commit distribution patterns.
          </p>
        </article>

        <article className="entry">
          <h3 className="entry-title">Valorant Esports Manager Bot</h3>
          <p className="entry-meta">
            <span className="mono">Llama 3.2 · RAG · SQL · RNN</span>
          </p>
          <p>
            Developed a RAG model using Llama 3.2, fine-tuned on 600+ YouTube
            video transcripts. Engineering a data pipeline with SQL search and
            RNNs to analyze an 80GB esports dataset.
          </p>
        </article>
      </section>

      <hr className="divider" />

      {/* ─── Work Experience ─── */}
      <section id="work" className="section">
        <h2 className="section-heading">Work Experience</h2>

        <article className="entry">
          <h3 className="entry-title">MEDxAI</h3>
          <p className="entry-meta">
            <strong>Machine Learning Engineer</strong> · <em>Aug 2024 – Jan 2025</em> · Remote
          </p>
          <p>
            Spearheaded the development and implementation of end-to-end machine
            learning models using Python, TensorFlow, and PyTorch for predictive
            analytics and recommendation systems.
          </p>
          <p>
            Led cross-functional teams to ensure seamless integration of scalable
            ML solutions into production systems. Drove model optimization through
            advanced deep learning techniques, enhancing accuracy and performance.
          </p>
        </article>

        <article className="entry">
          <h3 className="entry-title">GSU Hacks</h3>
          <p className="entry-meta">
            <strong>Treasurer &amp; Judge</strong> · <em>Nov 2024</em> · Atlanta, GA
          </p>
          <p>
            Managed a budget of over $2,000 in university funding for event
            logistics, prize distribution, and marketing for a hackathon with 100+
            participants. Served as a technical judge, evaluating project
            submissions based on innovation, technical complexity, and execution.
          </p>
        </article>

        <article className="entry">
          <h3 className="entry-title">Education</h3>
          <p className="entry-meta">
            <strong>Georgia State University</strong> · <em>Bachelor of Science in Computer Science, Honors Program</em>
          </p>
          <p>Expected graduation: May 2026 — Atlanta, GA</p>
        </article>

        <article className="entry">
          <h3 className="entry-title">Certifications</h3>
          <p className="entry-meta">
            <strong>Machine Learning Specialization</strong> · <em>DeepLearning.AI &amp; Stanford University</em> · Oct 2024
          </p>
          <p>
            Mastered supervised learning, unsupervised learning, recommender
            systems, and reinforcement learning. Achieved top grades: 99.60%,
            100%, and 99.40%.
          </p>
        </article>
      </section>

      {/* ─── Footer ─── */}
      <footer className="footer">
        <p>© 2026 Dev Vyas</p>
      </footer>
    </div>
  );
}

export default App;
