import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RecentBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/bookings/admin/all');
                if (response.data.success) {
                    // Sort by newest first and limit to 6 items
                    const sorted = response.data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    setBookings(sorted.slice(0, 6));
                }
            } catch (error) {
                console.error('Error fetching recent bookings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRecent();
    }, []);

    const getStatusClass = (status) => {
        const s = status.toLowerCase();
        if (s === 'completed') return 'status-completed';
        if (s === 'pending') return 'status-pending';
        if (s === 'in_progress' || s === 'confirmed' || s === 'received') return 'status-in-progress';
        return '';
    };

    const formatStatusText = (status) => {
        if (status === 'in_progress') return 'In Progress';
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const navigateToOrderManagement = (e) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('changePage', { detail: 'Order Management' }));
    };

    return (
        <div className="dash-card table-card">
            <div className="table-header-row">
                <h3 className="chart-title">Recent Bookings</h3>
                <a href="#view-all" onClick={navigateToOrderManagement} className="view-all-link">View All</a>
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
                            <th>Time</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                        ) : bookings.length > 0 ? (
                            bookings.map((bk) => (
                                <tr key={bk._id}>
                                    <td data-label="Booking ID" className="booking-id">{bk.bookingRef}</td>
                                    <td data-label="Customer">{bk.userDetails?.name || 'Unknown'}</td>
                                    <td data-label="Vehicle Name">{bk.vehicleDetails?.model || 'N/A'}</td>
                                    <td data-label="Service">{bk.serviceNames?.[0] || 'Service'}{bk.serviceNames?.length > 1 ? ` (+${bk.serviceNames.length - 1})` : ''}</td>
                                    <td data-label="Date">{formatDate(bk.createdAt)}</td>
                                    <td data-label="Time">{formatTime(bk.createdAt)}</td>
                                    <td data-label="Status">
                                        <span className={`status-text ${getStatusClass(bk.status)}`}>
                                            {formatStatusText(bk.status)}
                                        </span>
                                    </td>
                                    <td data-label="Action">
                                        <a href="#view" className="action-link">View</a>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No bookings found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentBookings;
