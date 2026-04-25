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
    const [rowsPerPage, setRowsPerPage] = useState(8);
    const [totalPayments, setTotalPayments] = useState(0);

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            // Simulated API call - swapping to live data if endpoint existed
            // const token = localStorage.getItem('token');
            // const response = await axios.get(`http://localhost:5000/api/payments?search=${searchTerm}&status=${filterStatus}&page=${currentPage}&limit=${rowsPerPage}`, {
            //     headers: { 'Authorization': `Bearer ${token}` }
            // });
            
            // For now, use dummy data
            let filtered = dummyPayments;
            if (searchTerm) {
                filtered = filtered.filter(p => 
                    p.bookingRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.vendor.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
            if (filterStatus !== 'All') {
                filtered = filtered.filter(p => p.status === filterStatus);
            }

            setPayments(filtered);
            setTotalPayments(filtered.length);
        } catch (error) {
            console.error('Error fetching payments:', error);
            setPayments(dummyPayments);
            setTotalPayments(dummyPayments.length);
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
            <div className="payment-search-row mb-4">
                <div className="search-input-group">
                    <Search size={18} color="#888" />
                    <input 
                        type="text" 
                        placeholder="Search" 
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
                <div className="status-filter-group">
                    <select 
                        value={filterStatus} 
                        onChange={(e) => {
                            setFilterStatus(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="All">All Status</option>
                        <option value="Completed">Completed</option>
                        <option value="Pending">Pending</option>
                        <option value="Failed">Failed</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="payment-table-container">
                <table className="custom-payment-table">
                    <thead>
                        <tr>
                            <th>Payment ID</th>
                            <th>Booking ID</th>
                            <th>Customer</th>
                            <th>Vendor</th>
                            <th>Services</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="text-center py-5">
                                    <Spinner animation="border" variant="warning" />
                                </td>
                            </tr>
                        ) : payments.length > 0 ? (
                            payments.map((payment) => (
                                <tr key={payment._id}>
                                    <td>{payment.paymentId}</td>
                                    <td>{payment.bookingRef}</td>
                                    <td>{payment.customer}</td>
                                    <td>{payment.vendor}</td>
                                    <td>{payment.services}</td>
                                    <td>{payment.amount}</td>
                                    <td>
                                        <span className={`status-text ${payment.status.toLowerCase()}`}>
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-icons">
                                            <Eye size={20} className="action-icon" />
                                            <Trash size={20} className="action-icon" />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="text-center py-5 text-muted">No payments found.</td>
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
                        <option value={8}>8</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                    </select>
                </div>
                <div className="pagination-controls">
                    <div className="pagi-numbers">
                        {totalPayments > 0 ? `${startRow}-${endRow} of ${totalPayments}` : "0-0 of 0"}
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
