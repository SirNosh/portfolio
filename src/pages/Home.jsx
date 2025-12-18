import { useState } from 'react';
import './Home.css';
import Cursor from '../components/Cursor';
import OreBlock from '../components/OreBlock';

const Home = () => {
    const [isMining, setIsMining] = useState(false);
    const [isOnSign, setIsOnSign] = useState(false);
    const baseUrl = import.meta.env.BASE_URL;

    const handleInteraction = (miningActive) => {
        setIsMining(miningActive);
    };

    return (
        <div className="home-container">
            <Cursor isMining={isMining} hidden={isOnSign} />

            {/* Background Layers */}
            <div
                className="layer-stone"
                style={{ backgroundImage: `url('${baseUrl}assets/textures/stone.png')` }}
            ></div>
            <div className="vignette"></div>

            {/* Content */}
            <main className="content">
                <div
                    className="sign-board"
                    style={{ backgroundImage: `url('${baseUrl}assets/textures/oak_planks.png')` }}
                    onMouseEnter={() => setIsOnSign(true)}
                    onMouseLeave={() => setIsOnSign(false)}
                >
                    <div className="sign-text">Dev Vyas</div>
                    <div className="sign-subtext">ML Researcher & Engineer</div>
                    <div className="sign-links">
                        <a href="https://github.com/SirNosh" target="_blank" rel="noopener noreferrer" title="GitHub">
                            GitHub
                        </a>
                        <a href="https://linkedin.com/in/dev-vyas172" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                            LinkedIn
                        </a>
                        <a href="mailto:devyas17272@gmail.com" title="Email">
                            Email
                        </a>
                    </div>
                </div>

                <div className="ore-container">
                    <OreBlock
                        type="redstone"
                        label="Research"
                        href="/research"
                        onInteractionChange={handleInteraction}
                    />
                    <OreBlock
                        type="emerald"
                        label="Work Ex"
                        href="/work"
                        onInteractionChange={handleInteraction}
                    />
                    <OreBlock
                        type="diamond"
                        label="Projects"
                        href="/projects"
                        onInteractionChange={handleInteraction}
                    />
                </div>
            </main>
        </div>
    );
};

export default Home;
