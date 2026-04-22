import React from 'react';

const StatCard = ({ label, value }) => {
    return (
        <div className="dash-card stat-card-new">
            <span className="stat-label-new">{label}</span>
            <span className="stat-value-new">{value}</span>
        </div>
    );
};

export default StatCard;
