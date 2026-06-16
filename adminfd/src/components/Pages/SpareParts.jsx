import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Plus,
    Search,
    Edit3,
    Trash2,
    CheckCircle,
    XCircle,
    Package,
    Zap,
    Car,
    Settings,
    X,
    ShoppingCart,
    Filter,
    ChevronLeft,
    ChevronRight,
    Eye,
    Calendar,
    Star,
    MessageCircle
} from 'lucide-react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import './SpareParts.css';

const SpareParts = () => {
    const [spareParts, setSpareParts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('Parts');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);
    const [orderCurrentPage, setOrderCurrentPage] = useState(1);
    const [ordersPerPage] = useState(5);
    const [filterStatus, setFilterStatus] = useState('All');
    const [orderUserType, setOrderUserType] = useState('User');
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    
    // Review Response State
    const [showRespondModal, setShowRespondModal] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [selectedPartId, setSelectedPartId] = useState(null);
    const [responseMessage, setResponseMessage] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        partNumber: '',
        category: 'Bike',
        amount: '',
        stockQty: '',
        brand: '',
        warranty: '',
        description: '',
        isListed: true,
        status: 'Active'
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [existingImages, setExistingImages] = useState([]);

    const fetchSpareParts = useCallback(async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/spare-parts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success) {
                setSpareParts(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching spare parts:', error);
            showMessage('error', 'Failed to fetch spare parts');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/spare-part-orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success) {
                setOrders(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            showMessage('error', 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSpareParts();
        fetchOrders();
    }, [fetchSpareParts, fetchOrders]);

    // Reset pagination when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
        setOrderCurrentPage(1);
    }, [searchTerm, filterCategory, filterStatus, orderUserType]);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleFileChange = (e) => {
        setImageFiles(prev => [...prev, ...Array.from(e.target.files)]);
        e.target.value = null;
    };

    const removeNewImage = (indexToRemove) => {
        setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const removeExistingImage = (indexToRemove) => {
        setExistingImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const token = sessionStorage.getItem('token');
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });
        if (existingImages.length > 0) {
            existingImages.forEach(img => {
                data.append('retainedImages', img);
            });
        } else {
            data.append('retainedImagesEmpty', 'true');
        }

        if (imageFiles && imageFiles.length > 0) {
            imageFiles.forEach(file => {
                data.append('images', file);
            });
        }

        try {
            const headers = {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`
            };

            if (isEditing) {
                const response = await axios.put(`http://localhost:5000/api/spare-parts/${currentId}`, data, { headers });
                if (response.data.success) {
                    showMessage('success', 'Spare part updated successfully');
                }
            } else {
                const response = await axios.post('http://localhost:5000/api/spare-parts', data, { headers });
                if (response.data.success) {
                    showMessage('success', 'Spare part added successfully');
                }
            }
            closeModal();
            fetchSpareParts();
        } catch (error) {
            console.error('Error saving spare part:', error);
            showMessage('error', error.response?.data?.message || error.response?.data?.error || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.put(`http://localhost:5000/api/spare-part-orders/${orderId}/status`,
                { status: newStatus },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (response.data.success) {
                showMessage('success', `Order status updated to ${newStatus}`);
                fetchOrders();
            }
        } catch (error) {
            console.error('Error updating status:', error);
            showMessage('error', 'Failed to update order status');
        }
    };

    const openOrderModal = (order) => {
        setCurrentOrder(order);
        setShowOrderModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this spare part?')) {
            try {
                const token = sessionStorage.getItem('token');
                const response = await axios.delete(`http://localhost:5000/api/spare-parts/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.data.success) {
                    showMessage('success', 'Spare part deleted');
                    fetchSpareParts();
                }
            } catch (error) {
                console.error('Error deleting spare part:', error);
                showMessage('error', 'Failed to delete spare part');
            }
        }
    };

    const openModal = (part = null) => {
        if (part) {
            setIsEditing(true);
            setCurrentId(part._id);
            setFormData({
                name: part.name || '',
                partNumber: part.partNumber || '',
                category: part.category || 'Bike',
                amount: part.amount || '',
                stockQty: part.stockQty || '',
                brand: part.brand || '',
                warranty: part.warranty || '',
                description: part.description || '',
                isListed: part.isListed !== undefined ? part.isListed : true,
                status: part.status || 'Active'
            });
            setExistingImages(part.images && part.images.length > 0 ? part.images : (part.image ? [part.image] : []));
        } else {
            setIsEditing(false);
            setFormData({
                name: '',
                partNumber: '',
                category: 'Bike',
                amount: '',
                stockQty: '',
                brand: '',
                warranty: '',
                description: '',
                isListed: true,
                status: 'Active'
            });
            setExistingImages([]);
        }
        setImageFiles([]);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setIsEditing(false);
        setCurrentId(null);
    };

    const handleRespondSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.post(`http://localhost:5000/api/spare-parts/${selectedPartId}/reviews/${selectedReview._id}/respond`, {
                message: responseMessage
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                showMessage('success', 'Response sent successfully!');
                setShowRespondModal(false);
                setResponseMessage('');
                fetchSpareParts(); // Refresh to show the response
            }
        } catch (error) {
            showMessage('error', error.response?.data?.error || 'Failed to send response');
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

    const filteredParts = spareParts.filter(part => {
        const matchesSearch = part.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            part.partNumber?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || part.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.sparePart?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
        const matchesUserType = orderUserType === 'All' || 
                                (orderUserType === 'User' && order.user?.role === 'user') || 
                                (orderUserType === 'Vendor' && order.user?.role === 'vendor');
        return matchesSearch && matchesStatus && matchesUserType;
    });

    const allReviews = spareParts.flatMap(part => 
        (part.reviews || []).map(review => ({ ...review, partName: part.name, partId: part._id }))
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return (
        <div className="spare-parts-page">
            {/* <div className="page-title-section">
                <h2><Settings size={28} /> Spare Parts</h2>
                <p className="page-subtitle">Manage inventory and customer orders</p>
            </div> */}

            <div className="header-actions">
                <div className="tabs-container">
                    <div
                        className={`tab-item ${activeTab === 'Parts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('Parts')}
                    >
                        <Settings size={18} /> Parts ({spareParts.length})
                    </div>
                    <div
                        className={`tab-item ${activeTab === 'Orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('Orders')}
                    >
                        <ShoppingCart size={18} /> Orders ({orders.length})
                    </div>
                    <div
                        className={`tab-item ${activeTab === 'Reviews' ? 'active' : ''}`}
                        onClick={() => setActiveTab('Reviews')}
                    >
                        <Star size={18} /> Reviews
                    </div>
                </div>

                {activeTab === 'Parts' && (
                    <button className="add-part-btn" onClick={() => openModal()}>
                        <Plus size={20} /> Add Part
                    </button>
                )}
            </div>

            <div className="search-filter-row">
                <div className="search-container">
                    <Search size={18} color="#666" />
                    <input
                        type="text"
                        placeholder={activeTab === 'Parts' ? "Search by name or part number..." : "Search by ID, name or part..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {activeTab === 'Parts' ? (
                    <div className="filter-dropdown-wrapper">
                        <Filter size={18} className="filter-icon" />
                        <select 
                            className="filter-select-custom"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            {['All', 'Bike', 'Car', 'Heavy'].map(cat => (
                                <option key={cat} value={cat}>
                                    {cat === 'All' ? 'All Categories' : cat} ({cat === 'All' ? spareParts.length : spareParts.filter(p => p.category === cat).length})
                                </option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div className="filter-dropdown-wrapper" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        
                        {/* User/Vendor Toggle Buttons */}
                        <div style={{ display: 'flex', width: '220px', background: '#111', borderRadius: '10px', border: '1px solid #333', overflow: 'hidden' }}>
                            <button 
                                onClick={() => setOrderUserType('User')}
                                style={{ flex: 1, padding: '8px 15px', background: orderUserType === 'User' ? '#f28b2c' : 'transparent', color: orderUserType === 'User' ? '#fff' : '#888', border: 'none', outline: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s', borderRight: '1px solid #333' }}
                            >
                                Customer
                            </button>
                            <button 
                                onClick={() => setOrderUserType('Vendor')}
                                style={{ flex: 1, padding: '8px 15px', background: orderUserType === 'Vendor' ? '#f28b2c' : 'transparent', color: orderUserType === 'Vendor' ? '#fff' : '#888', border: 'none', outline: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}
                            >
                                Vendor
                            </button>
                        </div>
                        
                        {/* Status Filter */}
                        <div style={{ display: 'flex', alignItems: 'center', background: '#111', borderRadius: '10px', border: '1px solid #333', padding: '0 10px' }}>
                            <Filter size={18} className="filter-icon" />
                            <select 
                                className="filter-select-custom"
                                style={{ border: 'none', background: 'transparent' }}
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                {['All', 'Pending', 'Confirmed', 'Shipped', 'Out of delivery', 'Delivered', 'Cancelled'].map(status => (
                                    <option key={status} value={status}>
                                        {status === 'All' ? 'All Status' : status} ({status === 'All' ? orders.length : orders.filter(o => o.status === status).length})
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
            ) : activeTab === 'Parts' ? (
                <>
                    <div className="spare-parts-grid">
                        {filteredParts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(part => (
                            <div className="part-card" key={part._id}>
                                <span className="card-status-badge">Active</span>
                                <div className="card-image-section">
                                    {(part.images && part.images.length > 0) ? (
                                        <img src={`http://localhost:5000${part.images[0]}`} alt={part.name} />
                                    ) : part.image ? (
                                        <img src={`http://localhost:5000${part.image}`} alt={part.name} />
                                    ) : (
                                        getCategoryIcon(part.category)
                                    )}
                                </div>
                                <div className="card-info">
                                    <div className="card-category">{part.category}</div>
                                    <h3 className="card-name">{part.name}</h3>
                                    <div className="card-part-number">{part.partNumber || '---'}</div>
                                    <div className="rating-badge-circle">
                                        <Star size={12} fill="#f59e0b" color="#f59e0b" />
                                        <span>{part.averageRating?.toFixed(1) || '0.0'}</span>
                                    </div>

                                    <div className="card-pricing-row">
                                        <div className="card-price">₹{part.amount?.toLocaleString()}</div>
                                        <div className="card-stock">
                                            <span>Stock:</span>
                                            <strong>{part.stockQty || 0}</strong>
                                        </div>
                                    </div>

                                    <div className="card-actions">
                                        <button className="btn-card-edit" onClick={() => openModal(part)}>
                                            <Edit3 size={16} /> Edit
                                        </button>
                                        <button className="btn-card-delete" onClick={() => handleDelete(part._id)}>
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </div>
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
            ) : activeTab === 'Orders' ? (
                <div className="orders-table-wrapper">
                    <table className="custom-orders-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Part Details</th>
                                <th>Customer/Vendor</th>
                                <th>Qty</th>
                                <th>Amount</th>
                                <th>Payment Status</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.slice((orderCurrentPage - 1) * ordersPerPage, orderCurrentPage * ordersPerPage).map(order => (
                                <tr key={order._id}>
                                    <td><span className="order-id-badge">#{order._id.slice(-6).toUpperCase()}</span></td>
                                    <td>
                                        <div className="small font-weight-bold">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className="small">
                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="order-part-info">
                                            {order.sparePart?.image ? (
                                                <img src={`http://localhost:5000${order.sparePart.image}`} alt="" className="table-part-img" />
                                            ) : (
                                                <Package size={24} color="#555" />
                                            )}
                                            <div>
                                                <div className="font-weight-bold">{order.sparePart?.name}</div>
                                                <div className="small">{order.sparePart?.partNumber}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="font-weight-bold">
                                            {order.user?.name}
                                            {order.user?.hasActiveSubscription && <span style={{ color: '#FFD700', marginLeft: '5px' }}>⭐</span>}
                                        </div>
                                        <div className="small">{order.user?.email}</div>
                                    </td>
                                    <td><div className="font-weight-bold">{order.quantity || 1}</div></td>
                                    <td><div className="text-primary font-weight-bold">₹{order.totalAmount}</div></td>
                                    <td>
                                        <span className={`font-weight-bold text-${order.paymentStatus === 'Paid' ? 'success' : 'warning'}`}>
                                            {order.paymentStatus || 'Pending'}
                                        </span>
                                    </td>
                                    <td>
                                        <select
                                            className={`status-select-custom status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}
                                            value={order.status}
                                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Confirmed">Confirmed</option>
                                            <option value="Shipped">Shipped</option>
                                            <option value="Out of delivery">Out of delivery</option>
                                            <option value="Delivered">Delivered</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                    <td>
                                        <button className="btn-view-order" onClick={() => openOrderModal(order)}>
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="text-center py-5">No orders found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {filteredOrders.length > ordersPerPage && (
                        <div className="pagination-wrapper mt-4">
                            <div className="pagination-info">
                                Showing {(orderCurrentPage - 1) * ordersPerPage + 1} to {Math.min(orderCurrentPage * ordersPerPage, filteredOrders.length)} of {filteredOrders.length} orders
                            </div>
                            <div className="pagination-buttons">
                                <button
                                    className="pagi-btn"
                                    disabled={orderCurrentPage === 1}
                                    onClick={() => setOrderCurrentPage(prev => prev - 1)}
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                {[...Array(Math.ceil(filteredOrders.length / ordersPerPage))].map((_, i) => (
                                    <button
                                        key={i}
                                        className={`pagi-btn ${orderCurrentPage === i + 1 ? 'active' : ''}`}
                                        onClick={() => setOrderCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    className="pagi-btn"
                                    disabled={orderCurrentPage === Math.ceil(filteredOrders.length / ordersPerPage)}
                                    onClick={() => setOrderCurrentPage(prev => prev + 1)}
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="reviews-list-container">
                    {allReviews.map((review, idx) => (
                        <div className="review-card-admin" key={idx}>
                            <div className="review-card-header">
                                <div className="reviewer-info">
                                    <div className="reviewer-avatar">
                                        {review.user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <div className="reviewer-name">{review.user?.name}</div>
                                        <div className="review-part-tag">{review.partName}</div>
                                    </div>
                                </div>
                                <div className="review-rating-stars">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star 
                                            key={star} 
                                            size={14} 
                                            fill={review.rating >= star ? "#f59e0b" : "none"} 
                                            color={review.rating >= star ? "#f59e0b" : "#444"} 
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="review-content">
                                "{review.comment}"
                            </div>
                            <div className="review-footer">
                                <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                                {review.vendorReply ? (
                                    <div className="admin-reply-box">
                                        <strong>Your Response:</strong> {review.vendorReply}
                                    </div>
                                ) : (
                                    <button 
                                        className="btn-respond-review"
                                        onClick={() => {
                                            setSelectedReview(review);
                                            setSelectedPartId(review.partId);
                                            setShowRespondModal(true);
                                        }}
                                    >
                                        <MessageCircle size={16} /> Respond
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {allReviews.length === 0 && (
                        <div className="text-center py-5">No reviews found for any parts.</div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal show={showModal} onHide={closeModal} centered className="spare-part-modal" size="lg">
                <Modal.Header className="modal-header-custom">
                    <div className="modal-title-custom">
                        <Plus size={24} className="text-primary" />
                        <span>{isEditing ? 'Update Part' : 'Add New Part'}</span>
                    </div>
                    <X size={24} className="cursor-pointer text-white" onClick={closeModal} />
                </Modal.Header>
                <Modal.Body className="p-4">
                    <form onSubmit={handleSubmit} className="form-grid">
                        <div className="form-group form-full-width">
                            <label>Part Name *</label>
                            <input
                                type="text"
                                name="name"
                                className="form-input-custom"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="e.g. Lithium-Ion Battery Cell 72V"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Part Number</label>
                            <input
                                type="text"
                                name="partNumber"
                                className="form-input-custom"
                                value={formData.partNumber}
                                onChange={handleInputChange}
                                placeholder="e.g. BAT-72V-001"
                            />
                        </div>

                        <div className="form-group">
                            <label>Category *</label>
                            <select
                                name="category"
                                className="form-input-custom form-select-custom"
                                value={formData.category}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="Bike">Bike</option>
                                <option value="Car">Car</option>
                                <option value="Heavy">Heavy</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Price (₹) *</label>
                            <input
                                type="number"
                                name="amount"
                                className="form-input-custom"
                                value={formData.amount}
                                onChange={handleInputChange}
                                placeholder="e.g. 12500"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Stock Qty *</label>
                            <input
                                type="number"
                                name="stockQty"
                                className="form-input-custom"
                                value={formData.stockQty}
                                onChange={handleInputChange}
                                placeholder="e.g. 50"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Brand</label>
                            <input
                                type="text"
                                name="brand"
                                className="form-input-custom"
                                value={formData.brand}
                                onChange={handleInputChange}
                                placeholder="e.g. Nexgen"
                            />
                        </div>

                        <div className="form-group">
                            <label>Warranty</label>
                            <input
                                type="text"
                                name="warranty"
                                className="form-input-custom"
                                value={formData.warranty}
                                onChange={handleInputChange}
                                placeholder="e.g. 1 Year"
                            />
                        </div>

                        <div className="form-group form-full-width">
                            <label>Product Images (Multiple)</label>
                            <div className="file-upload-wrapper mt-2">
                                <label className="file-upload-box d-flex flex-column align-items-center justify-content-center p-4 border border-dashed rounded bg-dark-custom cursor-pointer" style={{ borderStyle: 'dashed', borderColor: '#555', cursor: 'pointer' }}>
                                    <Plus size={32} color="#888" className="mb-2" />
                                    <span className="text-secondary">Click to upload multiple images</span>
                                    <input 
                                        type="file" 
                                        onChange={handleFileChange} 
                                        accept="image/*" 
                                        multiple 
                                        style={{ display: 'none' }} 
                                    />
                                </label>
                            </div>
                            <div className="image-preview-container mt-2 d-flex gap-2 flex-wrap">
                                {existingImages.map((img, index) => (
                                    <div key={`existing-${index}`} style={{ position: 'relative', display: 'inline-block' }}>
                                        <img src={`http://localhost:5000${img}`} alt="existing" style={{width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px'}} />
                                        <XCircle 
                                            size={20} 
                                            color="#dc3545" 
                                            style={{ position: 'absolute', top: '-8px', right: '-8px', cursor: 'pointer', background: 'white', borderRadius: '50%' }} 
                                            onClick={() => removeExistingImage(index)}
                                        />
                                    </div>
                                ))}
                                {imageFiles.map((file, index) => (
                                    <div key={`new-${index}`} style={{ position: 'relative', display: 'inline-block' }}>
                                        <img src={URL.createObjectURL(file)} alt="preview" style={{width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px'}} />
                                        <XCircle 
                                            size={20} 
                                            color="#dc3545" 
                                            style={{ position: 'absolute', top: '-8px', right: '-8px', cursor: 'pointer', background: 'white', borderRadius: '50%' }} 
                                            onClick={() => removeNewImage(index)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-group form-full-width">
                            <label>Description</label>
                            <textarea
                                name="description"
                                className="form-input-custom description-area"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Brief description of the part..."
                            ></textarea>
                        </div>

                        <div className="form-group form-full-width">
                            <div className="toggle-row">
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        name="isListed"
                                        checked={formData.isListed}
                                        onChange={handleInputChange}
                                    />
                                    <span className="slider"></span>
                                </label>
                                <span className="toggle-label">Listed (visible to customers)</span>
                            </div>
                        </div>

                        <div className="modal-footer-custom form-full-width">
                            <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                            <button type="submit" className="btn-submit-main" disabled={loading}>
                                {loading ? 'Saving...' : isEditing ? 'Update Part' : 'Add Part'}
                            </button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>

            {/* Order Details Modal */}
            <Modal show={showOrderModal} onHide={() => setShowOrderModal(false)} centered size="lg" className="order-details-modal">
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="text-white">Order Details - #{currentOrder?._id.slice(-6).toUpperCase()}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4 bg-dark-custom">
                    {currentOrder && (
                        <div className="order-full-details">
                            {/* Order Status Tracker */}
                            <div className="order-tracker mt-2 mb-5">
                                {['Pending', 'Confirmed', 'Shipped', 'Out of delivery', 'Delivered'].map((status, index) => {
                                    const statuses = ['Pending', 'Confirmed', 'Shipped', 'Out of delivery', 'Delivered'];
                                    const currentIdx = statuses.indexOf(currentOrder.status);
                                    const isCancelled = currentOrder.status === 'Cancelled';
                                    const isActive = currentIdx >= index && !isCancelled;
                                    
                                    return (
                                        <div key={status} className={`tracker-step ${isActive ? 'active' : ''}`}>
                                            <div className="tracker-dot"></div>
                                            <div className="tracker-label">{status}</div>
                                        </div>
                                    );
                                })}
                                {currentOrder.status === 'Cancelled' && (
                                    <div className="tracker-step cancelled active">
                                        <div className="tracker-dot"></div>
                                        <div className="tracker-label">Cancelled</div>
                                    </div>
                                )}
                            </div>

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="detail-group">
                                        <label>ORDER STATUS</label>
                                        <div className={`status-pill status-${currentOrder.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                            {currentOrder.status}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="detail-group">
                                        <label>ORDER DATE</label>
                                        <div className="detail-value text-white">
                                            <Calendar size={16} className="mr-2" />
                                            {new Date(currentOrder.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-secondary" />

                            <div className="row mt-4">
                                <div className="col-md-6 mb-4">
                                    <label className="small font-weight-bold">CUSTOMER DETAILS</label>
                                    <div className="detail-card">
                                        <div className="detail-row"><strong>Name:</strong> {currentOrder.user?.name}</div>
                                        <div className="detail-row"><strong>Email:</strong> {currentOrder.user?.email}</div>
                                        <div className="detail-row"><strong>Phone:</strong> {currentOrder.shippingAddress?.phone}</div>
                                        <hr className="border-secondary my-2" />
                                        <div className="detail-row small mt-2"><strong>Shipping Address:</strong></div>
                                        <div className="detail-row"><strong>Street:</strong> {currentOrder.shippingAddress?.street || currentOrder.shippingAddress?.address}</div>
                                        <div className="detail-row"><strong>District:</strong> {currentOrder.shippingAddress?.district || currentOrder.shippingAddress?.city}</div>
                                        <div className="detail-row"><strong>State:</strong> {currentOrder.shippingAddress?.state}</div>
                                        <div className="detail-row"><strong>Pincode:</strong> {currentOrder.shippingAddress?.pincode}</div>
                                    </div>
                                </div>

                                <div className="col-md-6 mb-4">
                                    <label className="small font-weight-bold">PAYMENT DETAILS</label>
                                    <div className="detail-card">
                                        <div className="detail-row"><strong>Status:</strong> <span className={`font-weight-bold text-${currentOrder.paymentStatus === 'Paid' ? 'success' : 'warning'} ml-2`}>{currentOrder.paymentStatus || 'Pending'}</span></div>
                                        <div className="detail-row"><strong>Payment ID:</strong> {currentOrder.paymentId || 'N/A'}</div>
                                        <div className="detail-row"><strong>Quantity:</strong> {currentOrder.quantity || 1}</div>
                                        <div className="detail-row"><strong>Amount:</strong> ₹{currentOrder.totalAmount}</div>
                                        {(() => {
                                            const itemTotal = currentOrder.sparePart?.amount ? 
                                                currentOrder.sparePart.amount * currentOrder.quantity :
                                                currentOrder.totalAmount - (currentOrder.deliveryCharge || 50) + (currentOrder.vendorDiscount || 0) + (currentOrder.offerDetails?.discountAmount || 0);

                                            const vDiscount = currentOrder.vendorDiscount || (currentOrder.user?.role === 'vendor' ? Math.round(itemTotal * 0.1) : 0);
                                            const offerDiscount = currentOrder.offerDetails?.discountAmount || 0;
                                            const offerCode = currentOrder.offerDetails?.offerCode || '';

                                            if (currentOrder.user?.role === 'vendor') {
                                                return (
                                                    <div className="detail-row mt-1">
                                                        <strong>Vendor Discount (10%):</strong> 
                                                        <span className={vDiscount > 0 ? "text-success ml-2 font-weight-bold" : "ml-2"}>
                                                            {vDiscount > 0 ? `-₹${vDiscount}` : `₹0`}
                                                        </span>
                                                    </div>
                                                );
                                            } else {
                                                const subDiscount = currentOrder.subscriptionDiscount || 0;
                                                return (
                                                    <>
                                                        <div className="detail-row mt-1">
                                                            <strong>Offer Discount {offerCode ? `(${offerCode})` : ''}:</strong> 
                                                            <span className={offerDiscount > 0 ? "text-success ml-2 font-weight-bold" : "ml-2"}>
                                                                {offerDiscount > 0 ? `-₹${offerDiscount}` : `₹0`}
                                                            </span>
                                                        </div>
                                                        {subDiscount > 0 && (
                                                            <div className="detail-row mt-1">
                                                                <strong>Subscription Discount:</strong> 
                                                                <span className="text-success ml-2 font-weight-bold">
                                                                    -₹{subDiscount}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            }
                                        })()}
                                    </div>

                                    {currentOrder.cancelReason && (
                                        <div className="mt-4">
                                            <label className="small font-weight-bold text-danger">CANCELLATION DETAILS</label>
                                            <div className="detail-card border-danger">
                                                <div className="detail-row text-danger"><strong>Reason:</strong> {currentOrder.cancelReason}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="row mt-4">
                                <div className="col-12">
                                    <label className="small font-weight-bold">ORDER ITEMS</label>
                                    <div className="items-list-card">
                                        <div className="order-item-detail">
                                            <div className="item-img-box">
                                                {currentOrder.sparePart?.image ? (
                                                    <img src={`http://localhost:5000${currentOrder.sparePart.image}`} alt="" />
                                                ) : (
                                                    <Package size={30} color="#555" />
                                                )}
                                            </div>
                                            <div className="item-text">
                                                <div className="item-name">{currentOrder.sparePart?.name}</div>
                                                <div className="item-qty">Quantity: {currentOrder.quantity}</div>
                                            </div>
                                        {(() => {
                                            const itemTotal = currentOrder.sparePart?.amount ? 
                                                currentOrder.sparePart.amount * currentOrder.quantity :
                                                currentOrder.totalAmount - (currentOrder.deliveryCharge || 50) + (currentOrder.vendorDiscount || 0) + (currentOrder.offerDetails?.discountAmount || 0) + (currentOrder.subscriptionDiscount || 0);

                                            return (
                                                <>
                                                    <div className="item-price">₹{itemTotal}</div>
                                                </>
                                            );
                                        })()}
                                        </div>
                                        
                                        {(() => {
                                            const itemTotal = currentOrder.sparePart?.amount ? 
                                                currentOrder.sparePart.amount * currentOrder.quantity :
                                                currentOrder.totalAmount - (currentOrder.deliveryCharge || 50) + (currentOrder.vendorDiscount || 0) + (currentOrder.offerDetails?.discountAmount || 0) + (currentOrder.subscriptionDiscount || 0);

                                            const vDiscount = currentOrder.vendorDiscount || (currentOrder.user?.role === 'vendor' ? Math.round(itemTotal * 0.1) : 0);

                                            return (
                                                <div className="item-price-breakdown">
                                                    <div className="breakdown-row">
                                                        <span>Item Subtotal (x{currentOrder.quantity})</span>
                                                        <span>₹{itemTotal}</span>
                                                    </div>
                                                    <div className="breakdown-row">
                                                        <span>Delivery Charge</span>
                                                        <span>₹{currentOrder.deliveryCharge || 50}</span>
                                                    </div>
                                                    
                                                    {(() => {
                                                        const isVendor = currentOrder.user?.role === 'vendor';
                                                        const vDiscount = currentOrder.vendorDiscount || (isVendor ? Math.round(itemTotal * 0.1) : 0);
                                                        const offerDiscount = currentOrder.offerDetails?.discountAmount || 0;
                                                        const subDiscount = currentOrder.subscriptionDiscount || 0;
                                                        const offerCode = currentOrder.offerDetails?.offerCode || '';

                                                        if (isVendor) {
                                                            return (
                                                                <div className={`breakdown-row ${vDiscount > 0 ? 'text-success' : ''}`}>
                                                                    <span>Vendor Discount (10%)</span>
                                                                    <span>{vDiscount > 0 ? `-₹${vDiscount}` : `₹0`}</span>
                                                                </div>
                                                            );
                                                        } else {
                                                            return (
                                                                <>
                                                                    {(offerDiscount > 0 || offerCode) && (
                                                                        <div className={`breakdown-row ${offerDiscount > 0 ? 'text-success' : ''}`}>
                                                                            <span>Offer Discount {offerCode ? `(${offerCode})` : ''}</span>
                                                                            <span>{offerDiscount > 0 ? `-₹${offerDiscount}` : `₹0`}</span>
                                                                        </div>
                                                                    )}
                                                                    {subDiscount > 0 && (
                                                                        <div className="breakdown-row text-success">
                                                                            <span>Subscription Discount</span>
                                                                            <span>-₹{subDiscount}</span>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            );
                                                        }
                                                    })()}

                                                    <hr className="border-secondary my-2" />
                                                    <div className="breakdown-row font-weight-bold">
                                                        <span>Grand Total</span>
                                                        <span className="text-primary">₹{currentOrder.totalAmount}</span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {currentOrder.status === 'Delivered' && (
                                <div className="delivery-info mt-4 p-3 bg-success-soft rounded">
                                    <div className="d-flex align-items-center text-success">
                                        <CheckCircle size={20} className="mr-2" />
                                        <strong>Delivered on: {new Date(currentOrder.updatedAt).toLocaleString()}</strong>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 bg-dark-custom">
                    <Button variant="secondary" onClick={() => setShowOrderModal(false)} className="rounded-pill px-4">
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Respond Modal */}
            <Modal show={showRespondModal} onHide={() => setShowRespondModal(false)} centered className="spare-part-modal">
                <Modal.Header className="modal-header-custom border-0 pb-0">
                    <div className="modal-title-custom">
                        <MessageCircle size={24} className="text-primary" />
                        <span className="text-white ml-2">Respond to Review</span>
                    </div>
                    <X size={24} className="cursor-pointer text-white" onClick={() => setShowRespondModal(false)} />
                </Modal.Header>
                <Modal.Body className="p-4 bg-dark-custom">
                    <div className="mb-4">
                        <div className="small mb-1">Review from {selectedReview?.user?.name}</div>
                        <div className="p-3 bg-dark rounded border border-secondary text-white-50 italic" style={{ fontStyle: 'italic' }}>
                            "{selectedReview?.comment}"
                        </div>
                    </div>
                    <form onSubmit={handleRespondSubmit}>
                        <div className="form-group">
                            <label className="text-white mb-2">Your Response *</label>
                            <textarea
                                className="form-control bg-dark border-secondary text-white"
                                rows="4"
                                value={responseMessage}
                                onChange={(e) => setResponseMessage(e.target.value)}
                                placeholder="Type your response here..."
                                required
                            ></textarea>
                        </div>
                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button variant="outline-secondary" onClick={() => setShowRespondModal(false)} className="rounded-pill px-4">
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary" disabled={loading} className="rounded-pill px-4">
                                {loading ? <Spinner animation="border" size="sm" /> : 'Send Response'}
                            </Button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default SpareParts;
