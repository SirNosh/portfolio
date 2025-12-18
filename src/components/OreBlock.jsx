import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './OreBlock.css';

const OreBlock = ({ type, label, href, onInteractionChange }) => {
    const [breakStage, setBreakStage] = useState(-1);
    const [isBreaking, setIsBreaking] = useState(false);
    const intervalRef = useRef(null);
    const navigate = useNavigate();

    const handleClick = () => {
        if (isBreaking) return; // Already breaking
        setIsBreaking(true);
        setBreakStage(0);
        if (onInteractionChange) onInteractionChange(true);
    };

    useEffect(() => {
        if (isBreaking) {
            intervalRef.current = setInterval(() => {
                setBreakStage((prev) => {
                    if (prev >= 9) {
                        clearInterval(intervalRef.current);
                        if (onInteractionChange) onInteractionChange(false);
                        navigate(href);
                        return 10;
                    }
                    return prev + 1;
                });
            }, 40); // 40ms per stage = 400ms total
        }
        return () => clearInterval(intervalRef.current);
    }, [isBreaking, href, navigate, onInteractionChange]);

    return (
        <div
            className="ore-block"
            onClick={handleClick}
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
