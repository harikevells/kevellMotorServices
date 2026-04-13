import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

// --- Custom Plugin for high-fidelity growth chart highlights ---
const growthHighlightsPlugin = {
    id: 'growthHighlightsPlugin',
    
    afterDatasetsDraw: (chart) => {
        const { ctx, chartArea } = chart;
        const meta = chart.getDatasetMeta(0); // Primary "This Year" line
        const julyIndex = 6;
        const point = meta.data && meta.data[julyIndex];

        // Only draw the July highlights if the point exists (Yearly view)
        if (!point || !chartArea || !point.skip === false) return;

        const { x: xPos, y: yPos } = point;

        ctx.save();
        
        // Ensure the drawing context is clean
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        // 1. Draw Vertical Indicator line for July
        ctx.beginPath();
        ctx.strokeStyle = '#c9992a';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);
        ctx.moveTo(xPos, yPos);
        ctx.lineTo(xPos, chartArea.bottom);
        ctx.stroke();

        // 2. Draw July Point with Glow
        ctx.beginPath();
        ctx.arc(xPos, yPos, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#c9992a';
        ctx.fill();
        ctx.strokeStyle = '#c9992a';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 3. Draw "Glassy" Tooltip Box
        const tooltipW = 100;
        const tooltipH = 45;
        const tooltipX = xPos - tooltipW / 2; // Switched to center-align for better width fit
        const tooltipY = yPos - tooltipH - 20; // Move it ABOVE the point to match ref image better

        // Reset shadow for tooltip background
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(30, 32, 41, 0.9)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        const r = 8;
        ctx.moveTo(tooltipX + r, tooltipY);
        ctx.lineTo(tooltipX + tooltipW - r, tooltipY);
        ctx.quadraticCurveTo(tooltipX + tooltipW, tooltipY, tooltipX + tooltipW, tooltipY + r);
        ctx.lineTo(tooltipX + tooltipW, tooltipY + tooltipH - r);
        ctx.quadraticCurveTo(tooltipX + tooltipW, tooltipY + tooltipH, tooltipX + tooltipW - r, tooltipY + tooltipH);
        ctx.lineTo(tooltipX + r, tooltipY + tooltipH);
        ctx.quadraticCurveTo(tooltipX, tooltipY + tooltipH, tooltipX, tooltipY + tooltipH - r);
        ctx.lineTo(tooltipX, tooltipY + r);
        ctx.quadraticCurveTo(tooltipX, tooltipY, tooltipX + r, tooltipY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Tooltip Content
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('July', tooltipX + tooltipW / 2, tooltipY + 16);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px system-ui';
        ctx.fillText('9.6k Users', tooltipX + tooltipW / 2, tooltipY + 32);

        ctx.restore();
    }
};

const UserGrowthChart = () => {
    const [period, setPeriod] = useState('yearly');

    const growthData = {
        yearly: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            thisYear: [4.5, 5.2, 6.4, 7.8, 8.8, 8.2, 9.6, 12, 11.2, 11, 13.5, 15.6],
            lastYear: [2.5, 2.2, 2.8, 4.2, 4.8, 4.2, 5.6, 5.2, 3.8, 4.8, 5, 5.2],
            backgroundBars: [4.6, 5.3, 6.5, 7.9, 8.9, 8.3, 9.7, 12.1, 11.3, 11.1, 13.6, 15.7],
            max: 16 // To match 16k in image
        },
        month: {
            labels: ['W1', 'W2', 'W3', 'W4', 'W5'],
            thisYear: [4, 6, 8, 7, 9],
            lastYear: [2, 3, 4, 3, 5],
            backgroundBars: [4.1, 6.1, 8.1, 7.1, 9.1],
            max: 10
        },
        weekly: {
            labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
            thisYear: [4, 5, 6, 8, 7, 9, 8],
            lastYear: [2, 3, 4, 5, 4, 6, 5],
            backgroundBars: [4.1, 5.1, 6.1, 8.1, 7.1, 9.1, 8.1],
            max: 10
        }
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                left: 0,
                right: 0,
                bottom: 10
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
        },
        scales: {
            x: { 
                grid: { display: false },
                offset: false, // Ensures line touches edges
                ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } }
            },
            y: { 
                grid: { color: 'rgba(255,255,255,0.05)', borderDash: [4, 4] },
                beginAtZero: true,
                max: growthData[period].max,
                ticks: { 
                    color: 'rgba(255,255,255,0.4)', 
                    font: { size: 10 },
                    stepSize: 2,
                    callback: (value) => value + 'k'
                }
            }
        }
    };

    const data = {
        labels: growthData[period].labels,
        datasets: [
            {
                type: 'line',
                label: 'This year',
                data: growthData[period].thisYear,
                borderColor: '#c9992a',
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(201, 153, 42, 0.15)');
                    gradient.addColorStop(1, 'rgba(201, 153, 42, 0)');
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2.5,
                order: 0,
            },
            {
                type: 'line',
                label: 'One year ago',
                data: growthData[period].lastYear,
                borderColor: 'rgba(255,255,255,0.15)',
                borderWidth: 1.5,
                fill: false,
                tension: 0.4,
                pointRadius: 0,
                order: 2,
            },
            {
                type: 'bar',
                label: 'Background',
                data: growthData[period].backgroundBars,
                backgroundColor: (context) => (context.index % 2 === 0 ? 'rgba(201, 153, 42, 0.04)' : 'transparent'),
                barThickness: 45, // Wide bars matching design
                order: 3,
            }
        ]
    };

    return (
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px 10' }}>
            <div className="chart-header" style={{ marginBottom: 20 }}>
                <div>
                    <span className="chart-title" style={{ fontSize: 18, fontWeight: 700, display: 'block', marginBottom: 6 }}>New User Growth</span>
                    <div className="legend">
                        <div className="legend-item"><span className="dot gold" style={{ backgroundColor: '#c9992a' }}></span> This year</div>
                        <div className="legend-item"><span className="dot white" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}></span> One year ago</div>
                    </div>
                </div>
                <div className="controls">
                    <button className={`toggle-btn ${period === 'weekly' ? 'active' : ''}`} onClick={() => setPeriod('weekly')}>Weekly</button>
                    <button className={`toggle-btn ${period === 'month' ? 'active' : ''}`} onClick={() => setPeriod('month')}>Month</button>
                    <button className={`toggle-btn ${period === 'yearly' ? 'active' : ''}`} onClick={() => setPeriod('yearly')}>Yearly</button>
                </div>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
                <Line options={options} data={data} plugins={[growthHighlightsPlugin]} key={period} />
            </div>
        </div>
    );
};

export default UserGrowthChart;
