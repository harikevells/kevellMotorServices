import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// --- Custom Plugin for Isometric 3D columns and Background bars ---
const isometricPlugin = {
    id: 'isometricPlugin',
    
    // 1. Draw vertical background bars before anything else
    beforeDraw: (chart) => {
        const { ctx, chartArea, scales: { x } } = chart;
        const meta = chart.getDatasetMeta(0);
        const barWidth = meta.data[0]?.width || 30; // Use actual bar width if available

        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        
        x.ticks.forEach((tick, index) => {
            const xPos = x.getPixelForTick(index) - barWidth / 2;
            ctx.fillRect(xPos, chartArea.top, barWidth, chartArea.bottom - chartArea.top);
        });
        ctx.restore();
    },

    // 2. Draw 3D tops and special label after datasets are drawn
    afterDatasetsDraw: (chart) => {
        const { ctx, data } = chart;
        const meta = chart.getDatasetMeta(0);
        
        meta.data.forEach((element, index) => {
            const { x, y, width } = element;
            const topHeight = width * 0.25; // Height of the isometric cap
            
            ctx.save();
            
            // --- Draw Isometric Cap (Diamond/Rhombus) ---
            const isJuly = index === 6;
            ctx.fillStyle = isJuly ? '#dab67a' : 'rgba(255, 255, 255, 0.15)';
            
            ctx.beginPath();
            ctx.moveTo(x, y - topHeight);           // Top
            ctx.lineTo(x + width / 2, y);           // Right
            ctx.lineTo(x, y + topHeight);           // Bottom (overlaps front face top)
            ctx.lineTo(x - width / 2, y);           // Left
            ctx.closePath();
            ctx.fill();

            // --- Draw the "July 78 Sales" pointer ---
            if (isJuly) {
                const labelX = x + width + 20;
                const labelY = y - topHeight - 10;

                // Dashed line
                ctx.setLineDash([3, 3]);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, y - topHeight);
                ctx.lineTo(labelX - 10, labelY + 5);
                ctx.stroke();

                // Text Label
                ctx.setLineDash([]);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 13px system-ui';
                ctx.fillText('78 Sales', labelX, labelY + 5);
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.font = '9px system-ui';
                ctx.fillText('Jul 2025', labelX, labelY + 18);
            }

            ctx.restore();
        });
    }
};

const SalesChart = () => {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                top: 40,
                right: 10 // Reduced from 60 to make graph full width
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: true,
                backgroundColor: '#1e2029',
                titleColor: '#e8b84b',
                bodyColor: '#ccc',
                padding: 10,
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
            }
        },
        scales: {
            x: { 
                grid: { display: false },
                ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 9.5 } }
            },
            y: { 
                grid: { color: 'rgba(255,255,255,0.06)' }, 
                beginAtZero: true,
                max: 100,
                ticks: { 
                    color: 'rgba(255,255,255,0.35)', 
                    font: { size: 9.5 },
                    stepSize: 20
                }
            }
        }
    };

    const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
            data: [45, 38, 52, 60, 48, 65, 78, 55, 62, 45, 58, 63],
            backgroundColor: (context) => {
                const chart = context.chart;
                const { ctx, chartArea } = chart;
                if (!chartArea) return null;
                
                const grad = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                if (context.index === 6) {
                    grad.addColorStop(0, 'rgba(201, 153, 42, 0.2)');
                    grad.addColorStop(1, '#e8b84b');
                } else {
                    grad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
                    grad.addColorStop(1, 'rgba(255, 255, 255, 0.15)');
                }
                return grad;
            },
            borderColor: (context) => (context.index === 6 ? '#e8b84b' : 'rgba(255,255,255,0.1)'),
            borderWidth: 1,
            borderRadius: 0, // 3D look doesn't need standard radius
            // Removing barThickness to allow auto-expansion
        }]
    };

    return (
        <div className="card sales-trend-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="chart-header">
                <span className="chart-title">Monthly Sales Trend</span>
                <div className="icon-btn" style={{ width: 24, height: 24 }}>⋯</div>
            </div>
            <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: '280px' }}>
                <Bar options={options} data={data} plugins={[isometricPlugin]} />
            </div>
        </div>
    );
};

export default SalesChart;
