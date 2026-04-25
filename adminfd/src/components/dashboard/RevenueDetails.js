import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form } from 'react-bootstrap';
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
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [revenueData, setRevenueData] = useState(new Array(12).fill(0));
    const [allBookings, setAllBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const years = [2024, 2025, 2026];

    useEffect(() => {
        const fetchAllBookings = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:5000/api/bookings/admin/all');
                if (response.data.success) {
                    setAllBookings(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching bookings for revenue:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllBookings();
    }, []);

    useEffect(() => {
        if (allBookings.length > 0) {
            const monthlyTotals = new Array(12).fill(0);
            allBookings.forEach(booking => {
                const date = new Date(booking.createdAt);
                if (date.getFullYear() === parseInt(selectedYear)) {
                    const month = date.getMonth();
                    monthlyTotals[month] += (booking.totalAmount || 0);
                }
            });
            setRevenueData(monthlyTotals);
        }
    }, [allBookings, selectedYear]);

    const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                fill: true,
                label: 'Revenue (₹)',
                data: revenueData,
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
                callbacks: {
                    label: (context) => `₹${context.raw.toLocaleString()}`
                }
            }
        },
        scales: {
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                    color: '#777',
                    callback: (value) => '₹' + value.toLocaleString(),
                },
                beginAtZero: true
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
            <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="chart-title">Revenue Details</h3>
                <Form.Select 
                    size="sm" 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(e.target.value)}
                    style={{ width: '100px', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid var(--border)', fontSize: '12px' }}
                >
                    {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </Form.Select>
            </div>
            <div className="chart-content">
                {loading ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>
                        Loading...
                    </div>
                ) : (
                    <Line data={data} options={options} />
                )}
            </div>
        </div>
    );
};

export default RevenueDetails;
