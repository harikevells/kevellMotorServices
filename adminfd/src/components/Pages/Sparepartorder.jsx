import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    ShoppingCart,
    Package,
    Search,
    MapPin,
    Phone,
    User,
    CheckCircle,
    XCircle,
    ChevronRight,
    ChevronLeft,
    ArrowLeft,
    Clock,
    Truck,
    Zap,
    Car,
    Settings,
    Filter,
    Star,
    Eye,
    MessageCircle,
    Check
} from 'lucide-react';
import { Modal, Button, Spinner, Form } from 'react-bootstrap';
import './Sparepartorder.css';
import './SpareParts.css'; // Reuse some grid styles

const Sparepartorder = () => {
    const [parts, setParts] = useState([]);
    const [myOrders, setMyOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('Store'); // Store, MyOrders
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [selectedPart, setSelectedPart] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    const [shippingDetails, setShippingDetails] = useState({
        name: '',
        phone: '',
        address: '',
        city: '',
        pincode: ''
    });

    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [reviewPart, setReviewPart] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [isReadOnlyReview, setIsReadOnlyReview] = useState(false);
    const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
    const [selectedPartForReviews, setSelectedPartForReviews] = useState(null);

    const fetchParts = useCallback(async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/spare-parts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success) {
                // Only show listed parts for buying
                setParts(response.data.data.filter(p => p.isListed));
            }
        } catch (error) {
            console.error('Error fetching parts:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchMyOrders = useCallback(async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/spare-part-orders/my-orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success) {
                setMyOrders(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'Store') fetchParts();
        else fetchMyOrders();
    }, [activeTab, fetchParts, fetchMyOrders]);

    // Reset pagination
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCategory, activeTab]);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleBuyClick = (part) => {
        setSelectedPart(part);
        setShowBuyModal(true);
    };

    const handleOrderSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/spare-part-orders', {
                sparePartId: selectedPart._id,
                quantity: 1,
                shippingAddress: shippingDetails
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                showMessage('success', 'Order placed successfully!');
                setShowBuyModal(false);
                setShippingDetails({ name: '', phone: '', address: '', city: '', pincode: '' });
                fetchParts();
            }
        } catch (error) {
            showMessage('error', error.response?.data?.error || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    const openReviewModal = (part) => {
        const user = JSON.parse(sessionStorage.getItem('adminUser'));
        const userId = user?.id || user?._id;
        const existingReview = part.reviews?.find(r => r.user === userId || r.user?._id === userId);

        setReviewPart(part);
        setShowReviewModal(true);

        setReviewRating(5);
        setReviewComment('');
        setIsReadOnlyReview(false); // Always allow new review
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();

        if (!reviewPart?._id) {
            showMessage('error', 'Missing part information. Please try again.');
            return;
        }

        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.post(`http://localhost:5000/api/spare-parts/${reviewPart._id}/reviews`, {
                rating: reviewRating,
                comment: reviewComment
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                showMessage('success', 'Review submitted successfully!');
                setShowReviewModal(false);
                fetchMyOrders(); // Refresh orders to show updated state if needed
            }
        } catch (error) {
            console.error('Review submission error:', error.response?.data || error.message);
            showMessage('error', error.response?.data?.error || error.response?.data?.message || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    const getCategoryIcon = (category) => {
        switch (category?.toLowerCase()) {
            case 'bike': return <Zap className="placeholder-icon" size={40} />;
            case 'car': return <Car className="placeholder-icon" size={40} />;
            case 'heavy': return <Settings className="placeholder-icon" size={40} />;
            default: return <Package className="placeholder-icon" size={40} />;
        }
    };

    const filteredParts = parts.filter(part => {
        const matchesSearch = part.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            part.partNumber?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || part.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="spare-order-page">
            <div className="order-header">
                <div className="order-tabs">
                    <div
                        className={`order-tab ${activeTab === 'Store' ? 'active' : ''}`}
                        onClick={() => setActiveTab('Store')}
                    >
                        Store
                    </div>
                    <div
                        className={`order-tab ${activeTab === 'MyOrders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('MyOrders')}
                    >
                        My Orders
                    </div>
                </div>

                {activeTab === 'Store' && (
                    <div className="search-filter-row mb-0">
                        <div className="search-container">
                            <Search size={18} color="#666" />
                            <input
                                type="text"
                                placeholder="Search parts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="filter-dropdown-wrapper">
                            <Filter size={18} className="filter-icon" />
                            <select
                                className="filter-select-custom"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                {['All', 'Bike', 'Car', 'Heavy'].map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat === 'All' ? 'All Categories' : cat} ({cat === 'All' ? parts.length : parts.filter(p => p.category === cat).length})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {message.text && (
                <div className={`alert-toast ${message.type}`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                    <span>{message.text}</span>
                </div>
            )}

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                </div>
            ) : (
                <>
                    {activeTab === 'Store' ? (
                        <>
                            <div className="spare-parts-grid">
                                {filteredParts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(part => (
                                    <div className="part-card" key={part._id}>
                                        <div className="card-image-section">
                                            {part.image ? (
                                                <img src={`http://localhost:5000${part.image}`} alt={part.name} />
                                            ) : (
                                                getCategoryIcon(part.category)
                                            )}
                                        </div>
                                        <div className="card-info">
                                            <div className="card-category">{part.category}</div>
                                            <div className="card-name-row">
                                                <div className="card-name-col">
                                                    <h3 className="card-name">{part.name}</h3>
                                                </div>
                                                {part.reviews?.length > 0 && (
                                                    <div 
                                                        className="card-rating-circle clickable" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedPartForReviews(part);
                                                            setShowAllReviewsModal(true);
                                                        }}
                                                    >
                                                        <Star size={12} fill="#f59e0b" color="#f59e0b" />
                                                        <div className="rating-value">
                                                            {(part.reviews.reduce((acc, r) => acc + r.rating, 0) / part.reviews.length).toFixed(1)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="card-pricing-row">
                                                <div className="card-price">₹{part.amount?.toLocaleString()}</div>
                                                <div className="card-stock">
                                                    <span>Qty:</span>
                                                    <strong>{part.stockQty}</strong>
                                                </div>
                                            </div>
                                            <button
                                                className="buy-now-btn"
                                                onClick={() => handleBuyClick(part)}
                                                disabled={part.stockQty <= 0}
                                            >
                                                {part.stockQty > 0 ? 'Buy Now' : 'Out of Stock'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {filteredParts.length > itemsPerPage && (
                                <div className="pagination-wrapper">
                                    <div className="pagination-info">
                                        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredParts.length)} of {filteredParts.length} parts
                                    </div>
                                    <div className="pagination-buttons">
                                        <button
                                            className="pagi-btn"
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(prev => prev - 1)}
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        {[...Array(Math.ceil(filteredParts.length / itemsPerPage))].map((_, i) => (
                                            <button
                                                key={i}
                                                className={`pagi-btn ${currentPage === i + 1 ? 'active' : ''}`}
                                                onClick={() => setCurrentPage(i + 1)}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                        <button
                                            className="pagi-btn"
                                            disabled={currentPage === Math.ceil(filteredParts.length / itemsPerPage)}
                                            onClick={() => setCurrentPage(prev => prev + 1)}
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="my-orders-container">
                            <div className="my-orders-grid">
                                {myOrders.map(order => (
                                    <div className="part-card" key={order._id}>
                                        <div className={`card-status-badge status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                            {order.status}
                                        </div>
                                        <div className="card-image-section">
                                            {order.sparePart?.image ? (
                                                <img src={`http://localhost:5000${order.sparePart.image}`} alt="" />
                                            ) : (
                                                <Package size={40} className="placeholder-icon" />
                                            )}
                                        </div>
                                        <div className="card-info">
                                            <div className="card-category">{order.sparePart?.category}</div>
                                            <div className="card-name-row">
                                                <div className="card-name-col">
                                                    <h3 className="card-name">{order.sparePart?.name}</h3>
                                                </div>
                                                {order.sparePart?.reviews?.length > 0 && (
                                                    <div 
                                                        className="card-rating-circle clickable"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedPartForReviews(order.sparePart);
                                                            setShowAllReviewsModal(true);
                                                        }}
                                                    >
                                                        <Star size={10} fill="#f59e0b" color="#f59e0b" />
                                                        <div className="rating-value">
                                                            {(order.sparePart.reviews.reduce((acc, r) => acc + r.rating, 0) / order.sparePart.reviews.length).toFixed(1)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="card-part-number">Order ID: #{order._id.slice(-6).toUpperCase()}</div>

                                            <div className="card-pricing-row">
                                                <div className="card-price">₹{order.totalAmount}</div>
                                                <div className="card-stock">
                                                    <span>Qty:</span>
                                                    <strong>{order.quantity}</strong>
                                                </div>
                                            </div>

                                            {(() => {
                                                const user = JSON.parse(sessionStorage.getItem('adminUser'));
                                                const userId = user?.id || user?._id;
                                                const userReviews = order.sparePart?.reviews?.filter(r => r.user === userId || r.user?._id === userId) || [];
                                                
                                                if (userReviews.length > 0) {
                                                    return (
                                                        <div className="card-user-reviews-list">
                                                            {userReviews.map((rev, i) => (
                                                                <div key={i} className="card-user-review-preview mb-2">
                                                                    <div className="preview-stars">
                                                                        {[1, 2, 3, 4, 5].map(star => (
                                                                            <Star 
                                                                                key={star} 
                                                                                size={10} 
                                                                                fill={rev.rating >= star ? "#f59e0b" : "none"} 
                                                                                color={rev.rating >= star ? "#f59e0b" : "#444"} 
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                    <div className="preview-text">"{rev.comment}"</div>
                                                                    {rev.vendorReply && (
                                                                        <div className="preview-response-msg">
                                                                            <MessageCircle size={10} className="mr-1 text-success" />
                                                                            <span>{rev.vendorReply}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}

                                            <div className="card-actions">
                                                <button
                                                    className="btn-card-edit"
                                                    style={{ color: '#f59e0b', background: 'rgba(242, 139, 44, 0.1)' }}
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setShowOrderDetailsModal(true);
                                                    }}
                                                >
                                                    <Eye size={16} /> View
                                                </button>

                                                {order.status === 'Delivered' && (
                                                    <button
                                                        className="btn-card-edit review-btn"
                                                        style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', borderColor: '#f59e0b' }}
                                                        onClick={() => openReviewModal(order.sparePart)}
                                                    >
                                                        <Star size={16} /> Review
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {myOrders.length === 0 && (
                                <div className="text-center py-5 text-muted">
                                    You haven't placed any orders yet.
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Buy Modal */}
            <Modal show={showBuyModal} onHide={() => setShowBuyModal(false)} centered className="buy-modal">
                <Modal.Header closeButton className="border-0">
                    <Modal.Title>Shipping Details</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <Form onSubmit={handleOrderSubmit} className="address-form">
                        <Form.Group className="mb-3 full-row">
                            <Form.Label className="text-muted small">FULL NAME</Form.Label>
                            <Form.Control
                                type="text"
                                required
                                value={shippingDetails.name}
                                onChange={(e) => setShippingDetails({ ...shippingDetails, name: e.target.value })}
                                className="dark-input"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-muted small">PHONE NUMBER</Form.Label>
                            <Form.Control
                                type="text"
                                required
                                value={shippingDetails.phone}
                                onChange={(e) => setShippingDetails({ ...shippingDetails, phone: e.target.value })}
                                className="dark-input"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-muted small">PINCODE</Form.Label>
                            <Form.Control
                                type="text"
                                required
                                value={shippingDetails.pincode}
                                onChange={(e) => setShippingDetails({ ...shippingDetails, pincode: e.target.value })}
                                className="dark-input"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3 full-row">
                            <Form.Label className="text-muted small">STREET ADDRESS</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                required
                                value={shippingDetails.address}
                                onChange={(e) => setShippingDetails({ ...shippingDetails, address: e.target.value })}
                                className="dark-input"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3 full-row">
                            <Form.Label className="text-muted small">CITY</Form.Label>
                            <Form.Control
                                type="text"
                                required
                                value={shippingDetails.city}
                                onChange={(e) => setShippingDetails({ ...shippingDetails, city: e.target.value })}
                                className="dark-input"
                            />
                        </Form.Group>

                        <div className="full-row mt-3">
                            <div className="d-flex justify-content-between mb-2">
                                <span>Item Total:</span>
                                <span>₹{selectedPart?.amount}</span>
                            </div>
                            <div className="d-flex justify-content-between font-weight-bold h5">
                                <span>Grand Total:</span>
                                <span className="text-success">₹{selectedPart?.amount}</span>
                            </div>
                        </div>

                        <Button type="submit" className="buy-now-btn full-row" disabled={loading}>
                            {loading ? 'Processing...' : 'Confirm Order'}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Order Details Modal */}
            <Modal show={showOrderDetailsModal} onHide={() => setShowOrderDetailsModal(false)} centered className="order-details-modal" size="lg">
                <Modal.Header closeButton className="border-0 bg-dark-custom">
                    <Modal.Title className="text-white">Order Details</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4 bg-dark-custom">
                    {selectedOrder && (
                        <div className="order-details-content">
                            {/* Status Tracker */}
                            <div className="order-status-tracker mb-5">
                                {['Pending', 'Confirmed', 'Shipped', 'Out of delivery', 'Delivered'].map((status, index, array) => {
                                    const currentStatusIndex = array.indexOf(selectedOrder.status);
                                    const isCompleted = array.indexOf(status) <= currentStatusIndex && selectedOrder.status !== 'Cancelled';
                                    const isCurrent = status === selectedOrder.status;

                                    return (
                                        <div key={status} className={`status-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                                            <div className="step-dot">
                                                {isCompleted ? <Check size={12} strokeWidth={4} /> : (index + 1)}
                                            </div>
                                            <div className="step-label">{status}</div>
                                            {index < array.length - 1 && <div className="step-line"></div>}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="details-grid-2-col">
                                <div className="detail-section">
                                    <h6 className="section-title">ORDER SUMMARY</h6>
                                    <div className="detail-box">
                                        <div className="detail-row">
                                            <span className="label">Order ID:</span>
                                            <span className="value">#{selectedOrder._id}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Date:</span>
                                            <span className="value">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Total Amount:</span>
                                            <span className="value price">₹{selectedOrder.totalAmount}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Current Status:</span>
                                            <span className={`status-pill status-${selectedOrder.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                                {selectedOrder.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h6 className="section-title">SHIPPING ADDRESS</h6>
                                    <div className="detail-box">
                                        <div className="address-name">{selectedOrder.shippingAddress?.name}</div>
                                        <div className="address-line">{selectedOrder.shippingAddress?.address}</div>
                                        <div className="address-line">{selectedOrder.shippingAddress?.city} - {selectedOrder.shippingAddress?.pincode}</div>
                                        <div className="address-phone">Ph: {selectedOrder.shippingAddress?.phone}</div>
                                    </div>
                                </div>

                                <div className="detail-section full-width">
                                    <h6 className="section-title">ITEM DETAILS</h6>
                                    <div className="detail-box item-row">
                                        <div className="item-img-container">
                                            {selectedOrder.sparePart?.image ? (
                                                <img src={`http://localhost:5000${selectedOrder.sparePart.image}`} alt="" />
                                            ) : (
                                                <Package size={30} color="#555" />
                                            )}
                                        </div>
                                        <div className="item-info-text">
                                            <div className="item-name">{selectedOrder.sparePart?.name}</div>
                                            <div className="item-meta">Part No: {selectedOrder.sparePart?.partNumber}</div>
                                            <div className="item-qty">Quantity: <span>{selectedOrder.quantity}</span></div>
                                        </div>
                                    </div>
                                </div>

                                {(() => {
                                    const user = JSON.parse(sessionStorage.getItem('adminUser'));
                                    const userId = user?.id || user?._id;
                                    const userReviews = selectedOrder.sparePart?.reviews?.filter(r => r.user === userId || r.user?._id === userId) || [];
                                    
                                    if (userReviews.length > 0) {
                                        return (
                                            <div className="detail-section full-width">
                                                <h6 className="section-title">YOUR REVIEWS</h6>
                                                <div className="user-reviews-scroll-container">
                                                    {userReviews.map((rev, i) => (
                                                        <div key={i} className="detail-box mb-3">
                                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                                {[1, 2, 3, 4, 5].map(star => (
                                                                    <Star 
                                                                        key={star} 
                                                                        size={14} 
                                                                        fill={rev.rating >= star ? "#f59e0b" : "none"} 
                                                                        color={rev.rating >= star ? "#f59e0b" : "#444"} 
                                                                    />
                                                                ))}
                                                                <span className="ml-2 text-white font-weight-bold">{rev.rating}/5</span>
                                                            </div>
                                                            <div className="review-text-display">
                                                                "{rev.comment}"
                                                            </div>
                                                            {rev.vendorReply && (
                                                                <div className="vendor-response-box mt-3">
                                                                    <div className="response-header">
                                                                        <MessageCircle size={12} className="mr-2" />
                                                                        OFFICIAL RESPONSE
                                                                    </div>
                                                                    <div className="response-body">{rev.vendorReply}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 bg-dark-custom pt-0 px-4 pb-4">
                    <Button variant="secondary" onClick={() => setShowOrderDetailsModal(false)} className="rounded-pill px-4" style={{ background: '#2a2a2c', border: 'none' }}>
                        Close
                    </Button>

                    {selectedOrder?.status === 'Delivered' && (
                        <Button 
                            className="rounded-pill px-4"
                            style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid #f59e0b' }}
                            onClick={() => {
                                setShowOrderDetailsModal(false);
                                openReviewModal(selectedOrder.sparePart);
                            }}
                        >
                            <Star size={16} className="mr-2" /> Review Again
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>

            {/* All Reviews Modal */}
            <Modal show={showAllReviewsModal} onHide={() => setShowAllReviewsModal(false)} centered className="all-reviews-modal">
                <Modal.Header closeButton className="border-0 bg-dark text-white">
                    <Modal.Title>Customer Reviews</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-dark p-4">
                    <div className="text-center mb-4">
                        <h5 className="text-white mb-2">{selectedPartForReviews?.name}</h5>
                        <div className="d-flex align-items-center justify-content-center gap-2">
                            <Star size={18} fill="#f59e0b" color="#f59e0b" />
                            <span className="text-white h4 mb-0">
                                {selectedPartForReviews?.reviews?.length > 0 
                                    ? (selectedPartForReviews.reviews.reduce((acc, r) => acc + r.rating, 0) / selectedPartForReviews.reviews.length).toFixed(1)
                                    : '0.0'
                                }
                            </span>
                            <span className="text-muted">({selectedPartForReviews?.reviews?.length || 0} reviews)</span>
                        </div>
                    </div>

                    <div className="all-reviews-list">
                        {selectedPartForReviews?.reviews?.length > 0 ? (
                            selectedPartForReviews.reviews.map((rev, i) => (
                                <div key={i} className="review-item-card mb-3 p-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <div className="d-flex gap-1">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Star key={s} size={12} fill={rev.rating >= s ? "#f59e0b" : "none"} color={rev.rating >= s ? "#f59e0b" : "#444"} />
                                            ))}
                                        </div>
                                        <div className="small text-muted">{rev.user?.name || 'Anonymous'}</div>
                                    </div>
                                    <div className="review-comment text-white mb-3">"{rev.comment}"</div>
                                    {rev.vendorReply && (
                                        <div className="vendor-response-box">
                                            <div className="response-header">
                                                <MessageCircle size={12} className="mr-2" />
                                                OFFICIAL RESPONSE
                                            </div>
                                            <div className="response-body">{rev.vendorReply}</div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-5 text-muted">No reviews yet.</div>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0 bg-dark justify-content-center">
                    <Button variant="secondary" onClick={() => setShowAllReviewsModal(false)} className="rounded-pill px-5">
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Existing Modals */}
            <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered className="review-modal">
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="text-white">{isReadOnlyReview ? 'Your Review' : 'Rate & Review'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4 bg-dark-custom">
                    <Form onSubmit={handleReviewSubmit}>
                        <div className="text-center mb-4">
                            <h5 className="text-white mb-3">{reviewPart?.name}</h5>
                            <div className="rating-stars-container">
                                <div className="rating-stars">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={32}
                                            fill={reviewRating >= star ? "#f59e0b" : "none"}
                                            color={reviewRating >= star ? "#f59e0b" : "#333"}
                                            className={`star-icon ${reviewRating >= star ? 'active' : ''} ${isReadOnlyReview ? 'readonly' : ''}`}
                                            onClick={() => !isReadOnlyReview && setReviewRating(star)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Form.Group className="mb-4">
                            <Form.Label className="text-white small">YOUR REVIEW</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder={isReadOnlyReview ? "" : "Share your experience with this part..."}
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                className="dark-input"
                                required
                                readOnly={isReadOnlyReview}
                            />
                        </Form.Group>

                        {!isReadOnlyReview && (
                            <div className="text-center mt-4">
                                <Button type="submit" variant="primary" className="rounded-pill px-5 py-2 w-100" disabled={loading}>
                                    {loading ? <Spinner animation="border" size="sm" /> : 'Submit Review'}
                                </Button>
                            </div>
                        )}

                        <div className="text-center mt-3">
                            <Button variant="link" className="text-muted text-decoration-none" onClick={() => setShowReviewModal(false)}>
                                Close
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Sparepartorder;
