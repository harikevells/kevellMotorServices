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
        street: '',
        district: '',
        state: '',
        pincode: ''
    });

    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [reviewPart, setReviewPart] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewVendorReply, setReviewVendorReply] = useState('');
    const [isReadOnlyReview, setIsReadOnlyReview] = useState(false);
    const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
    const [selectedPartForReviews, setSelectedPartForReviews] = useState(null);

    // Cancel Order States
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState(null);
    const [cancelReason, setCancelReason] = useState('');

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
        
        const userStr = sessionStorage.getItem('adminUser');
        if (userStr) {
            try {
                const userObj = JSON.parse(userStr);
                setShippingDetails({
                    name: userObj.ownerName || userObj.shopName || userObj.name || '',
                    phone: userObj.phone || userObj.whatsappNumber || '',
                    street: userObj.address?.street || '',
                    district: userObj.address?.city || userObj.address?.district || '',
                    state: userObj.address?.state || '',
                    pincode: userObj.address?.pincode || ''
                });
            } catch (e) {
                console.error("Error parsing adminUser", e);
            }
        }
        
        setShowBuyModal(true);
    };

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => {
                resolve(true);
            };
            script.onerror = () => {
                resolve(false);
            };
            document.body.appendChild(script);
        });
    };

    const handleOrderSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const user = JSON.parse(sessionStorage.getItem('adminUser') || '{}');

            // Calculate amount with 10% vendor discount and delivery charge
            const itemTotal = selectedPart.amount * 1;
            const discount = itemTotal * 0.10;
            const amount = (itemTotal - discount) + 50;

            const response = await axios.post('http://localhost:5000/api/spare-part-orders', {
                sparePartId: selectedPart._id,
                quantity: 1,
                totalAmount: amount,
                shippingAddress: shippingDetails,
                vendorDiscount: discount
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                const orderId = response.data.data._id;

                const res = await loadRazorpay();
                if (!res) {
                    showMessage('error', 'Razorpay SDK failed to load. Are you online?');
                    setLoading(false);
                    return;
                }

                const options = {
                    key: 'rzp_test_SfkV0cySd3CwyQ',
                    amount: Math.round(amount * 100),
                    currency: 'INR',
                    name: 'IWS',
                    description: `Payment for ${selectedPart.name}`,
                    image: 'https://i.imgur.com/3g7nmJC.png',
                    handler: async function (response) {
                        try {
                            await axios.put(`http://localhost:5000/api/spare-part-orders/${orderId}/payment`, {
                                paymentId: response.razorpay_payment_id,
                                paymentStatus: 'Paid'
                            }, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });

                            showMessage('success', 'Order and Payment Successful!');
                            setShowBuyModal(false);
                            setShippingDetails({ name: '', phone: '', street: '', district: '', state: '', pincode: '' });
                            fetchParts();
                            setActiveTab('MyOrders');
                        } catch (err) {
                            showMessage('error', 'Payment successful but failed to update order.');
                        }
                    },
                    prefill: {
                        name: shippingDetails.name,
                        email: user.email || 'customer@example.com',
                        contact: shippingDetails.phone
                    },
                    theme: {
                        color: '#f28b2c'
                    }
                };

                const paymentObject = new window.Razorpay(options);
                paymentObject.on('payment.failed', async function (response) {
                    try {
                        await axios.put(`http://localhost:5000/api/spare-part-orders/${orderId}/payment`, {
                            paymentStatus: 'Failed'
                        }, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        showMessage('error', 'Payment Failed');
                    } catch (err) {
                        console.error('Failed to update failed payment status', err);
                    }
                });

                paymentObject.open();
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

        if (existingReview) {
            setReviewRating(existingReview.rating);
            setReviewComment(existingReview.comment || '');
            setReviewVendorReply(existingReview.vendorReply || '');
            setIsReadOnlyReview(true);
        } else {
            setReviewRating(5);
            setReviewComment('');
            setReviewVendorReply('');
            setIsReadOnlyReview(false);
        }
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

    const handleCancelClick = (order) => {
        setOrderToCancel(order);
        setCancelReason('');
        setShowCancelModal(true);
    };

    const handleCancelSubmit = async () => {
        if (!cancelReason.trim()) {
            showMessage('error', 'Please provide a reason for cancellation.');
            return;
        }

        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.put(`http://localhost:5000/api/spare-part-orders/${orderToCancel._id}/cancel`, {
                cancelReason
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                showMessage('success', 'Order cancelled successfully!');
                setShowCancelModal(false);
                fetchMyOrders();
            }
        } catch (error) {
            console.error('Cancellation error:', error.response?.data || error.message);
            showMessage('error', error.response?.data?.error || 'Failed to cancel order');
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

                                                {(order.status === 'Pending' || order.status === 'Confirmed') && (
                                                    <button
                                                        className="btn-card-edit"
                                                        style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }}
                                                        onClick={() => handleCancelClick(order)}
                                                    >
                                                        <XCircle size={16} /> Cancel
                                                    </button>
                                                )}

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
                                <div className="text-center py-5">
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
                            <Form.Label className="small">FULL NAME</Form.Label>
                            <Form.Control
                                type="text"
                                required
                                value={shippingDetails.name}
                                onChange={(e) => setShippingDetails({ ...shippingDetails, name: e.target.value })}
                                className="dark-input"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="small">PHONE NUMBER</Form.Label>
                            <Form.Control
                                type="text"
                                required
                                value={shippingDetails.phone}
                                onChange={(e) => setShippingDetails({ ...shippingDetails, phone: e.target.value })}
                                className="dark-input"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="small">PINCODE</Form.Label>
                            <Form.Control
                                type="text"
                                required
                                value={shippingDetails.pincode}
                                onChange={(e) => setShippingDetails({ ...shippingDetails, pincode: e.target.value })}
                                className="dark-input"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3 full-row">
                            <Form.Label className="small">STREET / AREA</Form.Label>
                            <Form.Control
                                type="text"
                                required
                                value={shippingDetails.street}
                                onChange={(e) => setShippingDetails({ ...shippingDetails, street: e.target.value })}
                                className="dark-input"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="small">DISTRICT</Form.Label>
                            <Form.Control
                                type="text"
                                required
                                value={shippingDetails.district}
                                onChange={(e) => setShippingDetails({ ...shippingDetails, district: e.target.value })}
                                className="dark-input"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="small">STATE</Form.Label>
                            <Form.Control
                                type="text"
                                required
                                value={shippingDetails.state}
                                onChange={(e) => setShippingDetails({ ...shippingDetails, state: e.target.value })}
                                className="dark-input"
                            />
                        </Form.Group>

                        <div className="full-row mt-3 p-3 bg-dark rounded border border-secondary">
                            <div className="d-flex justify-content-between mb-2">
                                <span className="">Item Total:</span>
                                <span>₹{selectedPart?.amount}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-success">Vendor Discount (10%):</span>
                                <span className="text-success">-₹{(selectedPart?.amount * 0.10).toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2 border-bottom border-secondary pb-2">
                                <span className="text-white">Delivery Charge:</span>
                                <span>₹50</span>
                            </div>
                            <div className="d-flex justify-content-between font-weight-bold h5 mt-2">
                                <span className="text-white">Grand Total:</span>
                                <span className="text-success">₹{((selectedPart?.amount * 0.90) + 50).toFixed(2)}</span>
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
                                {selectedOrder.status === 'Cancelled' ? (
                                    ['Pending', 'Cancelled'].map((status, index, array) => {
                                        const isCompleted = index === 0;
                                        const isCurrent = index === 1;
                                        return (
                                            <div key={status} className={`status-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current cancelled' : ''}`}>
                                                <div className="step-dot" style={isCurrent ? { background: '#ef4444', borderColor: '#ef4444', color: 'white', boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)' } : {}}>
                                                    {isCompleted ? <Check size={12} strokeWidth={4} /> : <XCircle size={16} strokeWidth={3} />}
                                                </div>
                                                <div className="step-label" style={isCurrent ? { color: '#ef4444' } : {}}>{status}</div>
                                                {index < array.length - 1 && <div className="step-line" style={{ background: '#ef4444' }}></div>}
                                            </div>
                                        );
                                    })
                                ) : (
                                    ['Pending', 'Confirmed', 'Shipped', 'Out of delivery', 'Delivered'].map((status, index, array) => {
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
                                    })
                                )}
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
                                            <span className="label">Item Total:</span>
                                            <span className="value">₹{selectedOrder.sparePart?.amount * selectedOrder.quantity}</span>
                                        </div>
                                        {selectedOrder.vendorDiscount > 0 && (
                                            <div className="detail-row">
                                                <span className="label">Vendor Discount:</span>
                                                <span className="value text-success">-₹{selectedOrder.vendorDiscount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="detail-row">
                                            <span className="label">Delivery Charge:</span>
                                            <span className="value">₹{selectedOrder.deliveryCharge || 50}</span>
                                        </div>
                                        <div className="detail-row font-weight-bold border-top border-secondary pt-2 mt-2">
                                            <span className="label">Grand Total:</span>
                                            <span className="value price">₹{selectedOrder.totalAmount}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Payment Status:</span>
                                            <span className={`status-pill status-${selectedOrder.paymentStatus?.toLowerCase() || 'pending'}`}>
                                                {selectedOrder.paymentStatus || 'Pending'}
                                            </span>
                                        </div>
                                        {selectedOrder.paymentId && (
                                            <div className="detail-row">
                                                <span className="label">Payment ID:</span>
                                                <span className="value">{selectedOrder.paymentId}</span>
                                            </div>
                                        )}
                                        <div className="detail-row">
                                            <span className="label">Current Status:</span>
                                            <span className={`status-pill status-${selectedOrder.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                                {selectedOrder.status}
                                            </span>
                                        </div>
                                        {selectedOrder.status === 'Cancelled' && selectedOrder.cancelReason && (
                                            <div className="detail-row mt-2 pt-3 border-top border-secondary">
                                                <span className="label text-danger" style={{ fontWeight: '600' }}>Cancel Reason:</span>
                                                <span className="value text-danger" style={{ textAlign: 'right', maxWidth: '65%', fontSize: '13px' }}>
                                                    {selectedOrder.cancelReason}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h6 className="section-title">SHIPPING ADDRESS</h6>
                                    <div className="detail-box">
                                        <div className="address-name">{selectedOrder.shippingAddress?.name}</div>
                                        <div className="address-line">{selectedOrder.shippingAddress?.street}</div>
                                        <div className="address-line">{selectedOrder.shippingAddress?.district}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}</div>
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
                                                                        <MessageCircle size={12} className="ml-3" />
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
                            <span className="">({selectedPartForReviews?.reviews?.length || 0} reviews)</span>
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
                                        <div className="small">{rev.user?.name || 'Anonymous'}</div>
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
                            <div className="text-center py-5">No reviews yet.</div>
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

                        {isReadOnlyReview && reviewVendorReply && (
                            <div className="vendor-response-box mt-3 p-3 rounded" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                                <div className="response-header d-flex align-items-center mb-2" style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 'bold', gap: '8px' }}>
                                    <MessageCircle size={14} className="mr-2" />
                                    OFFICIAL RESPONSE
                                </div>
                                <div className="response-body text-white" style={{ fontSize: '14px' }}>{reviewVendorReply}</div>
                            </div>
                        )}

                        {!isReadOnlyReview && (
                            <div className="text-center mt-4">
                                <Button type="submit" variant="primary" className="rounded-pill px-5 py-2 w-100" disabled={loading}>
                                    {loading ? <Spinner animation="border" size="sm" /> : 'Submit Review'}
                                </Button>
                            </div>
                        )}

                        <div className="text-center mt-3">
                            <Button variant="link" className="text-decoration-none" onClick={() => setShowReviewModal(false)}>
                                Close
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Cancel Modal */}
            <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered className="cancel-modal">
                <Modal.Header closeButton className="border-0 bg-dark text-white">
                    <Modal.Title>Cancel Order</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-dark p-4">
                    <p className="text-white mb-3">Are you sure you want to cancel this order? Please provide a reason.</p>
                    <Form.Group>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Enter cancellation reason..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="dark-input text-white"
                        />
                    </Form.Group>
                    <div className="mt-4 d-flex justify-content-end gap-2">
                        <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
                            Close
                        </Button>
                        <Button variant="danger" onClick={handleCancelSubmit} disabled={loading || !cancelReason.trim()}>
                            {loading ? 'Cancelling...' : 'Confirm Cancel'}
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Sparepartorder;
