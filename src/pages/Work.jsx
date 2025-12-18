import { Link } from 'react-router-dom';
import '../styles/Credits.css';

const Work = () => {
    return (
        <div className="credits-page theme-emerald">
            <div className="credits-content">
                <section className="credits-section">
                    <h1 className="credits-title">Work Experience</h1>
                </section>

                <section className="credits-section">
                    <h2 className="credits-title">MEDxAI</h2>
                    <p className="credits-text">
                        <strong>Machine Learning Engineer</strong> • <em>Aug 2024 - Jan 2025</em>
                    </p>
                    <p className="credits-text">
                        Remote
                    </p>
                    <p className="credits-text">
                        Spearheaded the development and implementation of end-to-end machine learning models using Python, TensorFlow, and PyTorch for predictive analytics and recommendation systems.
                    </p>
                    <p className="credits-text">
                        Led cross-functional teams to ensure seamless integration of scalable ML solutions into production systems.
                    </p>
                    <p className="credits-text">
                        Drove model optimization through advanced deep learning techniques, enhancing accuracy and performance.
                    </p>
                </section>

                <section className="credits-section">
                    <h2 className="credits-title">GSU Hacks</h2>
                    <p className="credits-text">
                        <strong>Treasurer & Judge</strong> • <em>Nov 2024</em>
                    </p>
                    <p className="credits-text">
                        Atlanta, GA
                    </p>
                    <p className="credits-text">
                        Managed a budget of over $2,000 in university funding for event logistics, prize distribution, and marketing for a hackathon with 100+ participants.
                    </p>
                    <p className="credits-text">
                        Served as a technical judge, evaluating project submissions based on innovation, technical complexity, and execution.
                    </p>
                </section>

                <section className="credits-section">
                    <h2 className="credits-title">Education</h2>
                    <p className="credits-text">
                        <strong>Georgia State University</strong>
                    </p>
                    <p className="credits-text">
                        <em>Bachelor of Science in Computer Science, Honors Program</em>
                    </p>
                    <p className="credits-text">
                        Expected graduation: May 2026 - Atlanta, GA
                    </p>
                </section>

                <section className="credits-section">
                    <h2 className="credits-title">Certifications</h2>
                    <p className="credits-text">
                        <strong>Machine Learning Specialization</strong>
                    </p>
                    <p className="credits-text">
                        <em>DeepLearning.AI & Stanford University</em> • Oct 2024
                    </p>
                    <p className="credits-text">
                        Mastered supervised learning, unsupervised learning, recommender systems, and reinforcement learning.
                    </p>
                    <p className="credits-text">
                        Achieved top grades: 99.60%, 100%, and 99.40%.
                    </p>
                </section>

                <Link to="/" className="credits-back">← Back to Cave</Link>
            </div>
        </div>
    );
};

export default Work;
