import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  Title,
  Tooltip,
  Filler,
  Legend
);

const RevenueDetails = () => {
    const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                fill: true,
                label: 'Revenue',
                data: [15, 13, 16, 21, 18, 25, 34, 18, 23, 16, 14, 14],
                borderColor: '#f28b2c',
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, 'rgba(242, 139, 44, 0.4)');
                    gradient.addColorStop(1, 'rgba(242, 139, 44, 0)');
                    return gradient;
                },
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#f28b2c',
                pointBorderColor: '#fff',
                pointHoverRadius: 6,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#111',
                padding: 12,
            }
        },
        scales: {
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                    color: '#777',
                    callback: (value) => value + '%',
                },
                min: 10,
                max: 35,
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#777',
                }
            }
        }
    };

    return (
        <div className="dash-card chart-card">
            <div className="chart-header">
                <h3 className="chart-title">Revenue Details</h3>
                <span className="chart-subtitle">This Week</span>
            </div>
            <div className="chart-content">
                <Line data={data} options={options} />
            </div>
        </div>
    );
};

export default RevenueDetails;
