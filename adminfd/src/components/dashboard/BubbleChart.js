import React from 'react';

const BubbleChart = () => {
    return (
        <div className="card">
            <div className="chart-header">
                <span className="chart-title">Top Performing Brands</span>
                <div className="icon-btn" style={{ width: 24, height: 24 }}>⋮</div>
            </div>
            <div className="bubble-container">
                <div className="bubble rolls">
                    <span className="pct">26%</span>
                    <span className="brand">Rolls-Royce</span>
                </div>
                <div className="bubble porsche">
                    <span className="pct">17%</span>
                    <span className="brand">Porsche</span>
                </div>
                <div className="bubble ferrari">
                    <span className="pct">22%</span>
                    <span className="brand">Ferrari</span>
                </div>
                <div className="bubble bentley">
                    <span className="pct">20%</span>
                    <span className="brand">Bentley</span>
                </div>
                <div className="bubble lamborghini">
                    <span className="pct">15%</span>
                    <span className="brand">Lamborghini</span>
                </div>
            </div>
        </div>
    );
};

export default BubbleChart;
