import React, { useState, useEffect } from 'react';
import { 
    Container, Table, Button, Form, Modal, Badge, 
    Pagination, InputGroup, Row, Col, Spinner, Card
} from 'react-bootstrap';
import { Search, Eye, Filter, Calendar, MapPin, Phone, User, Car, Wrench, Clock, CheckCircle } from 'lucide-react';
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
    const rowsPerPage = 10;

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
            console.log("FETCH SUCCESS. Data length:", response.data.data?.length);
            if (response.data.success) {
                setBookings(response.data.data);
                setFetchError(null);
            }
        } catch (error) {
            console.error('FETCH ERROR:', error.message);
            setFetchError(`Request failed: ${error.message}. Ensure backend is at ${API_BASE_URL}`);
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
        <Container fluid className="order-management-container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold mb-0" style={{ color: 'var(--gold-primary)' }}>Order Management</h3>
                <div className="text-muted small">Total Bookings: {bookings.length}</div>
            </div>

            <Card className="management-card mb-4 border-0">
                <Row className="g-3">
                    <Col md={6}>
                        <InputGroup>
                            <InputGroup.Text className="bg-transparent border-end-0 border-gray">
                                <Search size={18} className="text-gold" />
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Search by Booking Reference (e.g. EV2026...)"
                                className="filter-input border-start-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </Col>
                    <Col md={4}>
                        <Form.Select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="All">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="received">Received</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </Form.Select>
                    </Col>
                    <Col md={2}>
                        <Button variant="outline-dark" className="w-100 action-btn" onClick={() => { setSearchTerm(''); setFilterStatus('All'); }}>
                            Refresh
                        </Button>
                    </Col>
                </Row>
            </Card>

            {fetchError && (
                <div className="alert alert-danger mb-4 py-2 border-0" style={{ background: 'rgba(220, 53, 69, 0.2)', color: '#ff8a8a' }}>
                    <small>⚠️ {fetchError}</small>
                </div>
            )}

            <div className="card management-card overflow-hidden">
                <Table responsive hover className="mb-0 align-middle">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Booking Ref</th>
                            <th>Customer</th>
                            <th>Vendor</th>
                            <th>Category</th>
                            <th>Services</th>
                            <th>Status</th>
                            <th className="text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="text-center py-5">
                                    <Spinner animation="border" variant="warning" />
                                </td>
                            </tr>
                        ) : currentRows.length > 0 ? (
                            currentRows.map((booking, index) => (
                                <tr key={booking._id}>
                                    <td>{indexOfFirstRow + index + 1}</td>
                                    <td className="fw-bold text-white">{booking.bookingRef}</td>
                                    <td>
                                        <div className="d-flex flex-column">
                                            <span className="fw-bold text-gold">{booking.userDetails?.name || "No Name"}</span>
                                            {/* <span className="small text-muted">{booking.userDetails?.phone || "No Phone"}</span> */}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="d-flex flex-column">
                                            <span className="fw-bold">{booking.vendorDetails?.shopName || "No Shop"}</span>
                                            {/* <span className="small text-muted">{booking.vendorDetails?.vendorName || "No Owner"}</span> */}
                                        </div>
                                    </td>
                                    <td>
                                        <Badge bg="dark" className="border border-secondary text-capitalize">
                                            {booking.vehicleDetails?.vehicle_category || "N/A"}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="text-truncate" style={{ maxWidth: '250px' }} title={booking.serviceNames?.join(', ')}>
                                            {booking.serviceNames?.join(', ')}
                                        </div>
                                    </td>
                                    <td>
                                        <Badge 
                                            bg={getStatusStyle(booking.status).bg} 
                                            text={getStatusStyle(booking.status).color}
                                            className="text-capitalize px-3 py-2"
                                        >
                                            {booking.status}
                                        </Badge>
                                    </td>
                                    <td className="text-center">
                                        <Button 
                                            variant="light" 
                                            size="sm" 
                                            className="action-btn view" 
                                            onClick={() => { setSelectedBooking(booking); setShowDetailModal(true); }}
                                        >
                                            <Eye size={18} />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="text-center py-5 text-muted">No bookings found matching your criteria.</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="text-muted small">Showing {currentRows.length} of {bookings.length} entries</div>
                <Pagination size="sm">
                    {[...Array(totalPages)].map((_, i) => (
                        <Pagination.Item key={i+1} active={i+1 === currentPage} onClick={() => setCurrentPage(i+1)}>
                            {i+1}
                        </Pagination.Item>
                    ))}
                </Pagination>
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
        </Container>
    );
};

export default Ordermanagement;
