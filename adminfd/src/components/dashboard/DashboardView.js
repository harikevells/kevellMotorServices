import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatCard from './StatCard';
import BookingOverview from './BookingOverview';
import RevenueDetails from './RevenueDetails';
import RecentBookings from './RecentBookings';

const DashboardView = () => {
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        completed: 0,
        pending: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                // Fetch all bookings to calculate stats
                const response = await axios.get('http://localhost:5000/api/bookings/admin/all');
                if (response.data.success) {
                    const bookings = response.data.data;

                    const total = bookings.length;
                    const active = bookings.filter(b => b.status === 'in_progress' || b.status === 'confirmed').length;
                    const completed = bookings.filter(b => b.status === 'completed').length;
                    const pending = bookings.filter(b => b.status === 'pending').length;

                    setStats({
                        total,
                        active,
                        completed,
                        pending
                    });
                }
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardStats();
    }, []);

    return (
        <div className="dashboard-container">
            {/* Top Row: Metric Cards */}
            <div className="dashboard-row stats-row">
                <StatCard
                    label="Total Bookings"
                    value={loading ? "..." : stats.total.toString().padStart(2, '0')}
                />
                <StatCard
                    label="Active Services"
                    value={loading ? "..." : stats.active.toString().padStart(2, '0')}
                />
                <StatCard
                    label="Completed Services"
                    value={loading ? "..." : stats.completed.toString().padStart(2, '0')}
                />
                <StatCard
                    label="Pending Services"
                    value={loading ? "..." : stats.pending.toString().padStart(2, '0')}
                />
            </div>

            {/* Middle Row: Charts */}
            <div className="dashboard-row charts-row">
                <BookingOverview />
                <RevenueDetails />
            </div>

            {/* Bottom Row: Recent Bookings */}
            <div className="dashboard-row table-row">
                <RecentBookings />
            </div>
        </div>
    );
};

export default DashboardView;
