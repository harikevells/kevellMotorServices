import React from 'react';

const QuickStats = () => {
    return (
        <div className="quick-stats-grid">
            <div className="mini-stat">
                <span className="mini-label">Avg Sale Price</span>
                <span className="mini-value">$89.4K</span>
                <span className="mini-change up">+3.2%</span>
            </div>
            <div className="mini-stat">
                <span className="mini-label">New Listings</span>
                <span className="mini-value">147</span>
                <span className="mini-change up">+18%</span>
            </div>
            <div className="mini-stat">
                <span className="mini-label">Conversion</span>
                <span className="mini-value">6.4%</span>
                <span className="mini-change down">-0.8%</span>
            </div>
            <div className="mini-stat">
                <span className="mini-label">Enquiries</span>
                <span className="mini-value">2,318</span>
                <span className="mini-change up">+7%</span>
            </div>
        </div>
    );
};

export default QuickStats;
