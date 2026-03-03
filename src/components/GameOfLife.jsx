import { useEffect, useRef } from 'react';
import './GameOfLife.css';

const CELL_SIZE = 12;
const ALIVE_COLOR = 'rgba(22, 163, 74, 0.18)';
const TICK_MS = 250; // ~4 fps

function createGrid(cols, rows) {
    const grid = new Uint8Array(cols * rows);
    for (let i = 0; i < grid.length; i++) {
        grid[i] = Math.random() < 0.08 ? 1 : 0; // sparse seeding
    }
    return grid;
}

function step(grid, cols, rows) {
    const next = new Uint8Array(cols * rows);
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            let neighbors = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = (x + dx + cols) % cols;
                    const ny = (y + dy + rows) % rows;
                    neighbors += grid[ny * cols + nx];
                }
            }
            const idx = y * cols + x;
            if (grid[idx]) {
                next[idx] = neighbors === 2 || neighbors === 3 ? 1 : 0;
            } else {
                next[idx] = neighbors === 3 ? 1 : 0;
            }
        }
    }
    return next;
}

const GameOfLife = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animId;
        let lastTick = 0;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resize();
        window.addEventListener('resize', resize);

        const cols = Math.ceil(canvas.width / CELL_SIZE);
        const rows = Math.ceil(canvas.height / CELL_SIZE);
        let grid = createGrid(cols, rows);

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = ALIVE_COLOR;
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    if (grid[y * cols + x]) {
                        ctx.fillRect(
                            x * CELL_SIZE + 1,
                            y * CELL_SIZE + 1,
                            CELL_SIZE - 2,
                            CELL_SIZE - 2
                        );
                    }
                }
            }
        };

        const loop = (time) => {
            animId = requestAnimationFrame(loop);
            if (time - lastTick >= TICK_MS) {
                grid = step(grid, cols, rows);
                draw();
                lastTick = time;
            }
        };

        draw();
        animId = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return <canvas ref={canvasRef} className="game-of-life" />;
};

export default GameOfLife;
