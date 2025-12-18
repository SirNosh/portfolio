import { useEffect, useState } from 'react';
import './Cursor.css';

const Cursor = ({ isMining, hidden }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const updatePosition = (e) => {
            setPosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', updatePosition);
        return () => window.removeEventListener('mousemove', updatePosition);
    }, []);

    if (hidden) return null;

    return (
        <div
            className={`custom-cursor ${isMining ? 'mining' : ''}`}
            style={{ left: `${position.x}px`, top: `${position.y}px` }}
        >
            <img src={`${import.meta.env.BASE_URL}assets/cursors/pickaxe.png`} alt="cursor" />
        </div>
    );
};

export default Cursor;
