import React, { useState, useEffect } from 'react';
import { 
    Container, Table, Button, Form, Modal, Badge, 
    Pagination, InputGroup, Row, Col, Spinner, Card
} from 'react-bootstrap';
import { Search, Eye, Trash, Filter, ChevronLeft, ChevronRight, User, MapPin, Car, Calendar, Wrench } from 'lucide-react';
import axios from 'axios';
import './order.css';

const API_BASE_URL = 'http://localhost:5000/api/bookings';

const Ordermanagement = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [fetchError, setFetchError] = useState(null);
    const [rowsPerPage, setRowsPerPage] = useState(6);

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    // Fetch Bookings from Backend
    const fetchBookings = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const query = `?search=${searchTerm}&status=${filterStatus}`;
            const response = await axios.get(`${API_BASE_URL}/admin/all${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success) {
                setBookings(response.data.data);
                setFetchError(null);
            }
        } catch (error) {
            setFetchError(`Request failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [searchTerm, filterStatus]);

    // Pagination
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = bookings.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(bookings.length / rowsPerPage);

    const getStatusClass = (status) => {
        const s = status.toLowerCase().replace(' ', '-');
        if (s === 'delivered' || s === 'completed') return 'delivered';
        if (s === 'pending') return 'pending';
        if (s === 'in-progress') return 'in-progress';
        return '';
    };

    const getStatusStyle = (status) => {
        const styles = {
            pending: { bg: 'warning', color: 'black' },
            received: { bg: 'info', color: 'white' },
            in_progress: { bg: 'primary', color: 'white' },
            completed: { bg: 'success', color: 'white' },
            cancelled: { bg: 'danger', color: 'white' }
        };
        return styles[status] || { bg: 'secondary', color: 'white' };
    };

    return (
        <div className="order-management-container">
            {/* Search and filter row */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="search-input-group">
                    <Search size={18} color="#888" />
                    <input 
                        type="text" 
                        placeholder="Search by bookings" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select 
                    className="status-filter-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="All">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {fetchError && (
                <div className="text-danger small mb-3">⚠️ {fetchError}</div>
            )}

            {/* Main Table */}
            <div className="order-table-container">
                <table className="custom-order-table">
                    <thead>
                        <tr>
                            <th>Booking Id</th>
                            <th>Customer</th>
                            <th>Vendor</th>
                            <th>Category</th>
                            <th>Services</th>
                            <th>Status</th>
                            <th>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="text-center py-5">
                                    <Spinner animation="border" variant="warning" />
                                </td>
                            </tr>
                        ) : currentRows.length > 0 ? (
                            currentRows.map((booking) => (
                                <tr key={booking._id}>
                                    <td className="td-booking-id">{booking.bookingRef}</td>
                                    <td>{booking.userDetails?.name || "N/A"}</td>
                                    <td>{booking.vendorDetails?.shopName || "N/A"}</td>
                                    <td>{booking.vehicleDetails?.vehicle_category || "N/A"}</td>
                                    <td>
                                        <div className="text-truncate" style={{ maxWidth: '200px' }}>
                                            {booking.serviceNames?.join(', ')}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-val ${getStatusClass(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-icons">
                                            <Eye 
                                                size={20} 
                                                className="action-icon" 
                                                onClick={() => { setSelectedBooking(booking); setShowDetailModal(true); }} 
                                            />
                                            <Trash size={20} className="action-icon" />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="text-center py-5 text-muted">No bookings found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer and Pagination */}
            <div className="table-footer">
                <div className="rows-per-page">
                    Show rows per page 
                    <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
                        <option value={6}>6</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                    </select>
                </div>
                <div className="pagination-controls">
                    <div className="pagi-numbers">
                        {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, bookings.length)} of {bookings.length}
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
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Detailed Booking Modal */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered className="booking-detail-modal">
                <Modal.Header closeButton className="bg-dark border-secondary">
                    <Modal.Title className="text-gold">
                        Booking Details: {selectedBooking?.bookingRef}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-dark text-white p-4">
                    {selectedBooking && (
                        <Row className="g-4">
                            {/* Customer & Vendor Info */}
                            <Col md={6}>
                                <div className="detail-section h-100">
                                    <h6 className="section-title"><User size={16} /> Customer Information</h6>
                                    <p><strong>Name:</strong> {selectedBooking.userDetails?.name}</p>
                                    <p><strong>Phone:</strong> {selectedBooking.userDetails?.phone}</p>
                                    <p><strong>Address:</strong> {selectedBooking.userDetails?.address || 'N/A'}</p>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="detail-section h-100">
                                    <h6 className="section-title"><MapPin size={16} /> Vendor Information</h6>
                                    <p><strong>Shop:</strong> {selectedBooking.vendorDetails?.shopName}</p>
                                    <p><strong>Owner:</strong> {selectedBooking.vendorDetails?.vendorName}</p>
                                    <p><strong>Phone:</strong> {selectedBooking.vendorDetails?.phone}</p>
                                    <p><strong>Location:</strong> {selectedBooking.vendorDetails?.address}</p>
                                </div>
                            </Col>

                            {/* Vehicle & Slot Info */}
                            <Col md={6}>
                                <div className="detail-section h-100">
                                    <h6 className="section-title"><Car size={16} /> Vehicle Details</h6>
                                    <p><strong>Model:</strong> {selectedBooking.vehicleDetails?.brand} {selectedBooking.vehicleDetails?.model}</p>
                                    <p><strong>Registration:</strong> {selectedBooking.vehicleDetails?.registration_no}</p>
                                    <p><strong>Year:</strong> {selectedBooking.vehicleDetails?.year}</p>
                                    <p><strong>Fuel Type:</strong> {selectedBooking.vehicleDetails?.fuel_type}</p>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="detail-section h-100">
                                    <h6 className="section-title"><Calendar size={16} /> Booking Schedule</h6>
                                    <p><strong>Date:</strong> {new Date(selectedBooking.bookingDate).toLocaleDateString()}</p>
                                    <p><strong>Time Slot:</strong> {selectedBooking.timeSlot}</p>
                                    <p><strong>Status:</strong> <Badge bg={getStatusStyle(selectedBooking.status).bg} text={getStatusStyle(selectedBooking.status).color}>{selectedBooking.status}</Badge></p>
                                    <p><strong>Created:</strong> {new Date(selectedBooking.createdAt).toLocaleString()}</p>
                                </div>
                            </Col>

                            {/* Services & Payment */}
                            <Col md={12}>
                                <div className="detail-section">
                                    <h6 className="section-title"><Wrench size={16} /> Services Requested</h6>
                                    <div className="d-flex flex-wrap gap-2 mb-3">
                                        {selectedBooking.serviceNames?.map((service, i) => (
                                            <Badge key={i} bg="secondary" className="px-3 py-2">{service}</Badge>
                                        ))}
                                    </div>
                                    <hr className="border-secondary" />
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <p className="mb-1 text-muted">Payment Method: <strong>{selectedBooking.paymentMethod}</strong></p>
                                            {selectedBooking.specialInstructions && (
                                                <p className="small italic text-warning">Note: {selectedBooking.specialInstructions}</p>
                                            )}
                                        </div>
                                        <div className="text-end">
                                            <h4 className="text-gold mb-0">Total: ₹ {selectedBooking.totalAmount}</h4>
                                            <p className="small text-muted">(Includes tax: ₹ {selectedBooking.tax})</p>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer className="bg-dark border-secondary">
                    <Button variant="outline-light" onClick={() => setShowDetailModal(false)}>
                        Close Details
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Ordermanagement;
