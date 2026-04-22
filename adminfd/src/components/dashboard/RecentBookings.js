import React from 'react';

const RecentBookings = () => {
    const bookings = [
        { id: 'Bk-1001', customer: 'Rahul', vehicle: 'Nexon Ev', service: 'Nexon Ev', date: '12/04/2026 11:30 Am', status: 'In progress' },
        { id: 'Bk-1002', customer: 'John', vehicle: 'Nexon Ev', service: 'Nexon Ev', date: '12/04/2026 11:30 Am', status: 'Completed' },
        { id: 'Bk-1003', customer: 'Kiran', vehicle: 'Nexon Ev', service: 'Nexon Ev', date: '12/04/2026 11:30 Am', status: 'Pending' },
        { id: 'Bk-1004', customer: 'Rohit', vehicle: 'Nexon Ev', service: 'Nexon Ev', date: '12/04/2026 11:30 Am', status: 'In progress' },
        { id: 'Bk-1005', customer: 'Ravi', vehicle: 'Nexon Ev', service: 'Nexon Ev', date: '12/04/2026 11:30 Am', status: 'Completed' },
    ];

    const getStatusClass = (status) => {
        switch (status) {
            case 'Completed': return 'status-completed';
            case 'Pending': return 'status-pending';
            case 'In progress': return 'status-in-progress';
            default: return '';
        }
    };

    return (
        <div className="dash-card table-card">
            <div className="table-header-row">
                <h3 className="chart-title">Recent Bookings</h3>
                <a href="#view-all" className="view-all-link">View All</a>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table className="recent-bookings-table">
                    <thead>
                        <tr>
                            <th>Booking ID</th>
                            <th>Customer</th>
                            <th>Vehicle Name</th>
                            <th>Service</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((bk) => (
                            <tr key={bk.id}>
                                <td data-label="Booking ID" className="booking-id">{bk.id}</td>
                                <td data-label="Customer">{bk.customer}</td>
                                <td data-label="Vehicle Name">{bk.vehicle}</td>
                                <td data-label="Service">{bk.service}</td>
                                <td data-label="Date">{bk.date}</td>
                                <td data-label="Status">
                                    <span className={`status-text ${getStatusClass(bk.status)}`}>
                                        {bk.status}
                                    </span>
                                </td>
                                <td data-label="Action">
                                    <a href="#view" className="action-link">View</a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentBookings;
