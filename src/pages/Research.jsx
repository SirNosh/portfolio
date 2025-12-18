import { Link } from 'react-router-dom';
import '../styles/Credits.css';

const Research = () => {
    return (
        <div className="credits-page theme-redstone">
            <div className="credits-content">
                <section className="credits-section">
                    <h1 className="credits-title">Research</h1>
                    <p className="credits-text">
                        Publications & Ongoing Work
                    </p>
                </section>

                <section className="credits-section">
                    <h2 className="credits-title">Published</h2>
                    <p className="credits-text">
                        <strong>A Comprehensive Survey of Mixture of Experts (MoE) Architectures</strong>
                    </p>
                    <p className="credits-text">
                        <em>AIM 2026 (Accepted)</em>
                    </p>
                    <p className="credits-text">
                        Authored comprehensive 50-page survey paper on MoE architectures, tracing evolution from foundational ensemble techniques to state-of-the-art sparse computation frameworks in modern LLMs.
                    </p>
                    <p className="credits-text">
                        Synthesized research from 145+ academic sources across NeurIPS, ICML, ICLR, and EMNLP proceedings.
                    </p>
                </section>

                <section className="credits-section">
                    <h2 className="credits-title">Under Production</h2>

                    <p className="credits-text">
                        <strong>
                            <a href="https://arxiv.org/abs/2512.10969v1" target="_blank" rel="noopener noreferrer" style={{ color: '#FF8888' }}>[arXiv]</a>
                            {' '}
                            <a href="https://github.com/SirNosh/MoB" target="_blank" rel="noopener noreferrer" style={{ color: '#FF8888' }}>[GitHub]</a>
                            {' '}MoB: Mixture of Bidders Framework
                        </strong>
                    </p>
                    <p className="credits-text">
                        <em>PyTorch - VCG Auction Theory - Continual Learning</em>
                    </p>
                    <p className="credits-text">
                        Orchestrating a decentralized framework where expert networks compete for data batches via truthful VCG auctions, replacing centralized routing to foster emergent specialization.
                    </p>
                </section>

                <section className="credits-section">
                    <p className="credits-text">
                        <strong>
                            <a href="https://github.com/SirNosh/MoRE" target="_blank" rel="noopener noreferrer" style={{ color: '#FF8888' }}>[GitHub]</a>
                            {' '}
                            <a href="https://more-ao1.pages.dev/" target="_blank" rel="noopener noreferrer" style={{ color: '#FF8888' }}>[Visualizer]</a>
                            {' '}Mixture of Recurrent Experts (MoRE) Model
                        </strong>
                    </p>
                    <p className="credits-text">
                        <em>PyTorch - MoE</em>
                    </p>
                    <p className="credits-text">
                        Architecting and validating a novel MoRE model, investigating four distinct variants to enhance capabilities in multi-step and algorithmic reasoning in Recurrent Transformer architectures.
                    </p>
                </section>

                <section className="credits-section">
                    <p className="credits-text">
                        <strong>
                            <a href="https://github.com/SirNosh/Neuroplastic-COT" target="_blank" rel="noopener noreferrer" style={{ color: '#FF8888' }}>[GitHub]</a>
                            {' '}Preventing Catastrophic Forgetting in LLMs
                        </strong>
                    </p>
                    <p className="credits-text">
                        <em>Qwen 2.5 - PyTorch - EWC - SI - Avalanche</em>
                    </p>
                    <p className="credits-text">
                        Implementing EWC and SI algorithms achieving 60-80% reduction in forgetting across mathematical domains on Qwen2.5-7B.
                    </p>
                </section>

                <section className="credits-section">
                    <p className="credits-text">
                        <strong>AI-Driven Plagiarism Detection System</strong>
                    </p>
                    <p className="credits-text">
                        <em>Python - NLP - SVM - BERT</em>
                    </p>
                    <p className="credits-text">
                        Developed a comprehensive ML-based plagiarism detection system achieving 78.08% accuracy and 84.34% F1 score.
                    </p>
                </section>

                <Link to="/" className="credits-back">Back to Cave</Link>
            </div>
        </div>
    );
};

export default Research;
