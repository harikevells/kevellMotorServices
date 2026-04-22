import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const BookingOverview = () => {
    const data = {
        labels: ['Bookings', 'Completed', 'Cancelled'],
        datasets: [
            {
                data: [85, 70, 30],
                backgroundColor: ['#f28b2c', '#f7ad67', '#fdf2d0'],
                borderWidth: 0,
                hoverOffset: 4,
                cutout: '75%',
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
                titleFont: { size: 14 },
                bodyFont: { size: 13 },
            }
        },
    };

    return (
        <div className="dash-card chart-card">
            <div className="chart-header">
                <div>
                    <h3 className="chart-title">Booking Overview</h3>
                </div>
                <span className="chart-subtitle">Dec 2026</span>
            </div>
            <div className="chart-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, height: '220px' }}>
                    <Doughnut data={data} options={options} />
                </div>
                <div className="legend-right" style={{ paddingLeft: '24px' }}>
                    {data.labels.map((label, index) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
                            <div style={{ 
                                width: '12px', 
                                height: '12px', 
                                borderRadius: '50%', 
                                backgroundColor: data.datasets[0].backgroundColor[index] 
                            }}></div>
                            <span style={{ fontSize: '14px', fontWeight: '500' }}>{label}</span>
                            <span style={{ marginLeft: 'auto', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', paddingLeft: '20px' }}>
                                {data.datasets[0].data[index]}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BookingOverview;
