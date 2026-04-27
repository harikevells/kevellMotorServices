import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import { Form } from 'react-bootstrap';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const BookingOverview = () => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [allBookings, setAllBookings] = useState([]);
    const [filteredStats, setFilteredStats] = useState({ total: 0, completed: 0, cancelled: 0 });

    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const years = [2024, 2025, 2026];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/bookings/admin/all');
                if (response.data.success) {
                    setAllBookings(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching bookings for chart:', error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const filtered = allBookings.filter(b => {
            const d = new Date(b.createdAt);
            return d.getMonth() === parseInt(selectedMonth) && d.getFullYear() === parseInt(selectedYear);
        });

        setFilteredStats({
            total: filtered.length,
            completed: filtered.filter(b => b.status === 'delivered').length,
            cancelled: filtered.filter(b => b.status === 'cancelled').length
        });
    }, [allBookings, selectedMonth, selectedYear]);

    const data = {
        labels: ['Total', 'Completed', 'Cancelled'],
        datasets: [
            {
                data: [filteredStats.total, filteredStats.completed, filteredStats.cancelled],
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
            legend: { display: false },
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
            <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h3 className="chart-title" style={{ margin: 0 }}>Booking Overview</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Form.Select 
                        size="sm" 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        style={{ width: '80px', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid var(--border)', fontSize: '11px' }}
                    >
                        {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </Form.Select>
                    <Form.Select 
                        size="sm" 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(e.target.value)}
                        style={{ width: '80px', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid var(--border)', fontSize: '11px' }}
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </Form.Select>
                </div>
            </div>
            <div className="chart-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
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
                                {filteredStats.total > 0 ? Math.round((data.datasets[0].data[index] / filteredStats.total) * 100) : 0}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BookingOverview;
