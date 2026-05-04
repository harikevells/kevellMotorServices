import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle,
    Package,
    Bike,
    Car,
    Truck,
    X,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import './SpareParts.css';

const SpareParts = () => {
    const [spareParts, setSpareParts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        category: 'Bike',
        name: '',
        amount: '',
        status: 'Available'
    });
    const [currentId, setCurrentId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(6);
    const [filterCategory, setFilterCategory] = useState('All');

    const fetchSpareParts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/api/spare-parts');
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

    useEffect(() => {
        fetchSpareParts();
    }, [fetchSpareParts]);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEditing) {
                const response = await axios.put(`http://localhost:5000/api/spare-parts/${currentId}`, formData);
                if (response.data.success) {
                    showMessage('success', 'Spare part updated successfully');
                }
            } else {
                const response = await axios.post('http://localhost:5000/api/spare-parts', formData);
                if (response.data.success) {
                    showMessage('success', 'Spare part added successfully');
                }
            }
            closeModal();
            fetchSpareParts();
        } catch (error) {
            console.error('Error saving spare part:', error);
            showMessage('error', error.response?.data?.error || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this spare part?')) {
            try {
                const response = await axios.delete(`http://localhost:5000/api/spare-parts/${id}`);
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
                category: part.category,
                name: part.name,
                amount: part.amount,
                status: part.status
            });
        } else {
            setIsEditing(false);
            setFormData({
                category: 'Bike',
                name: '',
                amount: '',
                status: 'Available'
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setIsEditing(false);
        setCurrentId(null);
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Bike': return <Bike size={18} />;
            case 'Car': return <Car size={18} />;
            case 'Heavy': return <Truck size={18} />;
            default: return <Package size={18} />;
        }
    };

    // Pagination Logic
    const filteredParts = spareParts.filter(part => {
        const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            part.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || part.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredParts.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(filteredParts.length / rowsPerPage);

    // Reset to first page when searching or filtering
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCategory]);

    return (
        <div className="spare-parts-page">
            <div className="header-container">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="search-input-group">
                        <Search size={18} color="#888" />
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="status-filter-select"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        style={{ marginLeft: '15px' }}
                    >
                        <option value="All">All Categories</option>
                        <option value="Bike">Bike</option>
                        <option value="Car">Car</option>
                        <option value="Heavy">Heavy</option>
                    </select>
                </div>
                <button className="add-btn" onClick={() => openModal()}>
                    <Plus size={20} />
                    <span>Add New Part</span>
                </button>
            </div>

            {message.text && (
                <div className={`alert-toast ${message.type}`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Search Bar matching Ordermanagement */}


            {/* Main Table matching custom-order-table */}
            <div className="order-table-container">
                <table className="custom-order-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Spare Part Name</th>
                            <th>Amount (₹)</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="text-center py-5">
                                    <Spinner animation="border" variant="warning" />
                                </td>
                            </tr>
                        ) : currentRows.length > 0 ? (
                            currentRows.map(part => (
                                <tr key={part._id}>
                                    <td>
                                        <div className="category-badge">
                                            {getCategoryIcon(part.category)}
                                            <span>{part.category}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: '600' }}>{part.name}</td>
                                    <td className="amount-cell">₹{part.amount}</td>
                                    <td>
                                        <span className={`status-pill ${part.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                            {part.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <Edit2
                                                size={18}
                                                className="action-icon"
                                                onClick={() => openModal(part)}
                                            />
                                            <Trash2
                                                size={18}
                                                className="action-icon delete-icon"
                                                onClick={() => handleDelete(part._id)}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-5 text-muted">No spare parts found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer and Pagination matching Ordermanagement */}
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
                        {filteredParts.length > 0 ? indexOfFirstRow + 1 : 0}-{Math.min(indexOfLastRow, filteredParts.length)} of {filteredParts.length}
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

            {/* Modal matching theme */}
            <Modal show={showModal} onHide={closeModal} centered className="spare-part-modal">
                <Modal.Header className="bg-dark border-secondary">
                    <Modal.Title className="text-warning">
                        {isEditing ? 'Edit Spare Part' : 'Add New Spare Part'}
                    </Modal.Title>
                    <button className="close-btn" onClick={closeModal}><X size={24} /></button>
                </Modal.Header>
                <Modal.Body className="bg-dark p-4">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group mb-4">
                            <label>Category</label>
                            <div className="category-select">
                                {['Bike', 'Car', 'Heavy'].map(cat => (
                                    <div
                                        key={cat}
                                        className={`cat-option ${formData.category === cat ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, category: cat })}
                                    >
                                        {getCategoryIcon(cat)}
                                        <span>{cat}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="form-group mb-3">
                            <label>Spare Part Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="e.g. Engine Oil, Brake Pad"
                                required
                            />
                        </div>
                        <div className="form-group mb-3">
                            <label>Amount (₹)</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleInputChange}
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div className="form-group mb-4">
                            <label>Status</label>
                            <select name="status" value={formData.status} onChange={handleInputChange}>
                                <option value="Available">Available</option>
                                <option value="Out of Stock">Out of Stock</option>
                            </select>
                        </div>
                        <div className="modal-footer pt-3">
                            <Button variant="outline-light" onClick={closeModal} className="px-4">Cancel</Button>
                            <Button type="submit" variant="warning" className="px-4 fw-bold" disabled={loading}>
                                {loading ? 'Saving...' : isEditing ? 'Update Part' : 'Add Part'}
                            </Button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default SpareParts;
