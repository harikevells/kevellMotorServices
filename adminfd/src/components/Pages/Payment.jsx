import React, { useState, useEffect, useCallback } from 'react';
import { 
    Spinner
} from 'react-bootstrap';
import { Search, Eye, Trash, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import './Payment.css';

const dummyPayments = [
    { _id: '1', paymentId: 'Id001', bookingRef: 'EV2020234', customer: 'Vijay', vendor: 'Eva Bike shop', services: 'Full bike Service', amount: '300', status: 'Completed' },
    { _id: '2', paymentId: 'Id003', bookingRef: 'EV2020243', customer: 'John', vendor: 'Mk car service', services: 'Oil Services', amount: '500', status: 'Completed' },
    { _id: '3', paymentId: 'Id002', bookingRef: 'EV2020232', customer: 'Rohit', vendor: 'Iconic motor shop', services: 'Water wash services', amount: '200', status: 'Completed' },
    { _id: '4', paymentId: 'Id004', bookingRef: 'EV2020242', customer: 'Ravi', vendor: 'Ev Services', services: 'Full bike Service', amount: '500', status: 'Completed' },
    { _id: '5', paymentId: 'Id001', bookingRef: 'EV2020234', customer: 'John', vendor: 'Eva Bike shop', services: 'Full bike Service', amount: '300', status: 'Completed' },
    { _id: '6', paymentId: 'Id003', bookingRef: 'EV2020243', customer: 'Rohit', vendor: 'Mk car service', services: 'Oil Services', amount: '500', status: 'Completed' },
    { _id: '7', paymentId: 'Id002', bookingRef: 'EV2020232', customer: 'Ravi', vendor: 'Iconic motor shop', services: '4 wheeler', amount: '200', status: 'Completed' },
];

const Payment = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(6);
    const [totalPayments, setTotalPayments] = useState(0);

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/bookings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.success) {
                const liveData = response.data.bookings.map(booking => ({
                    _id: booking._id,
                    paymentId: booking._id.slice(-6).toUpperCase(), // Fallback ID
                    bookingRef: booking.bookingRef || `REF-${booking._id.slice(-4).toUpperCase()}`,
                    customer: booking.userDetails?.name || booking.user?.name || 'Anonymous',
                    vendor: booking.vendorDetails?.shopName || booking.center?.shopName || 'N/A',
                    services: booking.serviceNames?.join(', ') || 'N/A',
                    amount: booking.totalAmount,
                    status: booking.paymentStatus || 'Pending',
                    paymentMethod: booking.paymentMethod || 'N/A'
                }));

                let filtered = liveData;
                if (searchTerm) {
                    filtered = filtered.filter(p => 
                        p.bookingRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.vendor.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                }
                if (filterStatus !== 'All') {
                    filtered = filtered.filter(p => p.status.toLowerCase() === filterStatus.toLowerCase());
                }

                setPayments(filtered);
                setTotalPayments(filtered.length);
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
            setPayments([]);
            setTotalPayments(0);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, filterStatus, currentPage, rowsPerPage]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const totalPages = Math.ceil(totalPayments / rowsPerPage);
    const startRow = (currentPage - 1) * rowsPerPage + 1;
    const endRow = Math.min(currentPage * rowsPerPage, totalPayments);

    return (
        <div className="payment-page-container">
            {/* Header / Search Row */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="search-input-group">
                    <Search size={18} color="#888" />
                    <input 
                        type="text" 
                        placeholder="Search by ID, Customer or Vendor" 
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
                <select 
                    className="status-filter-select"
                    value={filterStatus} 
                    onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setCurrentPage(1);
                    }}
                >
                    <option value="All">All Status</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Not Received">Not Received</option>
                </select>
            </div>

            {/* Table */}
            <div className="order-table-container">
                <table className="custom-order-table">
                    <thead>
                        <tr>
                            <th>Payment ID</th>
                            <th>Booking REF</th>
                            <th>Customer</th>
                            <th>Vendor</th>
                            <th>Method</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="text-center py-5">
                                    <Spinner animation="border" variant="warning" />
                                </td>
                            </tr>
                        ) : payments.length > 0 ? (
                            payments
                                .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                                .map((payment) => (
                                    <tr key={payment._id}>
                                        <td className="td-booking-id">{payment.paymentId}</td>
                                        <td>{payment.bookingRef}</td>
                                        <td>{payment.customer}</td>
                                        <td>{payment.vendor}</td>
                                        <td>{payment.paymentMethod}</td>
                                        <td className="fw-bold">₹{payment.amount}</td>
                                        <td>
                                            <span className={`status-val ${payment.status.toLowerCase().replace(' ', '-')}`}>
                                                {payment.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="text-center py-5 text-muted">No payments found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer / Pagination */}
            <div className="table-footer">
                <div className="rows-per-page">
                    Show rows per page 
                    <select value={rowsPerPage} onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                    }}>
                        <option value={6}>6</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                    </select>
                </div>
                <div className="pagination-controls">
                    <div className="pagi-numbers">
                        {(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, totalPayments)} of {totalPayments}
                    </div>
                    <div className="pagi-arrows">
                        <button 
                            className="pagi-arrow" 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button 
                            className="pagi-arrow"
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
