import React from 'react';
import StatCard from './StatCard';
import SalesChart from './SalesChart';
import UserGrowthChart from './UserGrowthChart';
import BubbleChart from './BubbleChart';

const DashboardView = () => {
    return (
        <div className="dashboard-container">
            {/* Top Row: Stats (2x2) + Sales Trend */}
            <div className="top-section">
                <div className="stats-2x2">
                    <StatCard 
                        label="Total Cars Listed" 
                        value="1,248" 
                        change="+8%" 
                        icon="🏎️" 
                        type="cars" 
                        data={[30, 45, 38, 52, 48, 60, 55, 70, 65, 80]} 
                        spotlight={true}
                    />
                    <StatCard 
                        label="Active Users" 
                        value="3,492" 
                        change="+5%" 
                        icon="👥" 
                        type="users" 
                        data={[50, 40, 45, 35, 30, 40, 45, 55, 50, 60]} 
                    />
                    <StatCard 
                        label="Total Transactions" 
                        value="892" 
                        change="+12%" 
                        icon="💳" 
                        type="transactions" 
                        data={[20, 30, 25, 35, 40, 38, 45, 50, 55, 65]} 
                    />
                    <StatCard 
                        label="Revenue" 
                        value="$142,560" 
                        change="+10%" 
                        icon="💰" 
                        type="revenue" 
                        data={[40, 60, 50, 70, 65, 85, 80, 95, 90, 110]} 
                    />
                </div>
                <div className="sales-trend-container">
                    <SalesChart />
                </div>
            </div>

            {/* Bottom Row: User Growth + Bubble Chart */}
            <div className="bottom-section">
                <div className="growth-chart-container">
                    <UserGrowthChart />
                </div>
                <div className="bubble-chart-container">
                    <BubbleChart />
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
