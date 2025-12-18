import { Link } from 'react-router-dom';
import '../styles/Credits.css';

const Projects = () => {
    return (
        <div className="credits-page theme-diamond">
            <div className="credits-content">
                <section className="credits-section">
                    <h1 className="credits-title">Projects</h1>
                </section>

                <section className="credits-section">
                    <h2 className="credits-title">
                        <a href="https://github.com/SirNosh/ChessNexus" target="_blank" rel="noopener noreferrer" style={{ color: '#55FFFF' }}>
                            ChessNexus RL Engine
                        </a>
                    </h2>
                    <p className="credits-text">
                        <em>Python - TensorFlow - RL - CUDA</em>
                    </p>
                    <p className="credits-text">
                        Building a sophisticated chess environment in Python featuring a DQN reinforcement learning agent trained via self-play.
                    </p>
                    <p className="credits-text">
                        Implementing parallel game simulation, tournament management, and real-time visualization.
                    </p>
                    <p className="credits-text">
                        Optimized for NVIDIA GPUs with CUDA 12.8, JIT compilation, and mixed-precision training.
                    </p>
                </section>

                <section className="credits-section">
                    <h2 className="credits-title">
                        <a href="https://github.com/SirNosh/QuantumVIX" target="_blank" rel="noopener noreferrer" style={{ color: '#55FFFF' }}>
                            QuantumVIX Trading System
                        </a>
                    </h2>
                    <p className="credits-text">
                        <em>Python - RL (PPO) - Black-Scholes</em>
                    </p>
                    <p className="credits-text">
                        Advanced trading system using Proximal Policy Optimization (PPO) to exploit volatility in S&P 500 futures and options.
                    </p>
                    <p className="credits-text">
                        Engineered state representation incorporating Black-Scholes volatility metrics and multi-timeframe momentum signals.
                    </p>
                </section>

                <section className="credits-section">
                    <h2 className="credits-title">
                        <a href="https://github.com/SirNosh/git-fixer" target="_blank" rel="noopener noreferrer" style={{ color: '#55FFFF' }}>
                            Git-Fixer
                        </a>
                    </h2>
                    <p className="credits-text">
                        <em>Python - CLI - PyPI</em>
                    </p>
                    <p className="credits-text">
                        Developed and published a Python library and CLI tool on PyPI to programmatically generate synthetic Git commit histories.
                    </p>
                    <p className="credits-text">
                        Features customizable date ranges and realistic commit distribution patterns.
                    </p>
                </section>

                <section className="credits-section">
                    <h2 className="credits-title">Valorant Esports Manager Bot</h2>
                    <p className="credits-text">
                        <em>Llama 3.2 - RAG - SQL - RNN</em>
                    </p>
                    <p className="credits-text">
                        Developed a RAG model using Llama 3.2, fine-tuned on 600+ YouTube video transcripts.
                    </p>
                    <p className="credits-text">
                        Engineering a data pipeline with SQL search and RNNs to analyze an 80GB esports dataset.
                    </p>
                </section>

                <section className="credits-section">
                    <h2 className="credits-title">This Portfolio</h2>
                    <p className="credits-text">
                        <em>React - Vite - CSS Animations</em>
                    </p>
                    <p className="credits-text">
                        A Minecraft-themed personal website with interactive mining mechanics.
                    </p>
                </section>

                <Link to="/" className="credits-back">Back to Cave</Link>
            </div>
        </div>
    );
};

export default Projects;
