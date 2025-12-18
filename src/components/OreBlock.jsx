import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './OreBlock.css';

const OreBlock = ({ type, label, href, onInteractionChange }) => {
    const [breakStage, setBreakStage] = useState(-1);
    const [isMining, setIsMining] = useState(false);
    const intervalRef = useRef(null);
    const navigate = useNavigate();

    const startMining = () => {
        setIsMining(true);
        setBreakStage(0);
        if (onInteractionChange) onInteractionChange(true);
    };

    const stopMining = () => {
        setIsMining(false);
        setBreakStage(-1);
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (onInteractionChange) onInteractionChange(false);
    };

    useEffect(() => {
        if (isMining) {
            const isTouch = window.matchMedia("(hover: none)").matches;
            const speed = isTouch ? 5 : 40;

            intervalRef.current = setInterval(() => {
                setBreakStage((prev) => {
                    if (prev >= 9) {
                        clearInterval(intervalRef.current);
                        navigate(href);
                        return 10;
                    }
                    return prev + 1;
                });
            }, speed);
        } else {
            setBreakStage(-1);
        }
        return () => clearInterval(intervalRef.current);
    }, [isMining, href, navigate]);

    return (
        <div
            className="ore-block"
            onMouseDown={startMining}
            onMouseUp={stopMining}
            onMouseLeave={stopMining}
            onTouchStart={startMining}
            onTouchEnd={stopMining}
        >
            <img
                src={`${import.meta.env.BASE_URL}assets/textures/${type}_ore.png`}
                alt={`${label} ore`}
                className="ore-texture"
            />
            {breakStage >= 0 && breakStage <= 9 && (
                <img
                    src={`${import.meta.env.BASE_URL}assets/textures/destroy_stage_${breakStage}.png`}
                    alt="cracking"
                    className="crack-overlay"
                />
            )}
            <div className="ore-label">{label}</div>
        </div>
    );
};

export default OreBlock;
