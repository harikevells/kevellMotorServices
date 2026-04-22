import React from 'react';
import StatCard from './StatCard';
import BookingOverview from './BookingOverview';
import RevenueDetails from './RevenueDetails';
import RecentBookings from './RecentBookings';

const DashboardView = () => {
    return (
        <div className="dashboard-container">
            {/* Top Row: Metric Cards */}
            <div className="dashboard-row stats-row">
                <StatCard label="Total Bookings" value="20" />
                <StatCard label="Active Services" value="15" />
                <StatCard label="Completed Services" value="10" />
                <StatCard label="Pending Services" value="05" />
            </div>

            {/* Middle Row: Charts */}
            <div className="dashboard-row charts-row">
                <BookingOverview />
                <RevenueDetails />
            </div>

            {/* Bottom Row: Table */}
            <div className="dashboard-row table-row">
                <RecentBookings />
            </div>
        </div>
    );
};

export default DashboardView;
