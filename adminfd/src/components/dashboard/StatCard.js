import React, { useEffect, useRef } from 'react';

const StatCard = ({ label, value, change, icon, type, data, spotlight }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const color = '#c9992a';
        const dpr = window.devicePixelRatio || 1;
        
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min;

        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        const step = width / (data.length - 1);
        
        data.forEach((val, i) => {
            const x = i * step;
            const y = height - ((val - min) / (range || 1) * (height - 10) + 5);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Gradient Fill
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, 'rgba(201, 153, 42, 0.2)');
        grad.addColorStop(1, 'rgba(201, 153, 42, 0)');
        ctx.fillStyle = grad;
        ctx.fill();
    }, [data]);

    return (
        <div className={`card stat-card ${spotlight ? 'card-spotlight' : ''}`} data-type={type}>
            <div className="card-top">
                <span className="stat-label">{label}</span>
                <div className="stat-icon">{icon}</div>
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-change">{change} this month</div>
            <div className="sparkline-container">
                <canvas ref={canvasRef} className="sparkline-canvas"></canvas>
            </div>
        </div>
    );
};

export default StatCard;
