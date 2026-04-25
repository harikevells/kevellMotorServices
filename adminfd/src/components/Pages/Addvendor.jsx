import React, { useState } from 'react';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import './Addvendor.css';

const Addvendor = () => {
    const [formData, setFormData] = useState({
        shopName: '',
        ownerName: '',
        email: '',
        phone: '',
        licenseNo: '',
        gstNo: '',
        capacity: '',
        street: '',
        city: '',
        state: '',
        pincode: '',
        password: '',
        role: 'vendor'
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/auth/register', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setMessage({ type: 'success', text: 'Vendor added successfully!' });
                // Reset form
                setFormData({
                    shopName: '',
                    ownerName: '',
                    email: '',
                    phone: '',
                    licenseNo: '',
                    gstNo: '',
                    capacity: '',
                    street: '',
                    city: '',
                    state: '',
                    pincode: '',
                    password: '',
                    role: 'vendor'
                });
                // Optionally navigate back to list
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('changePage', { detail: 'Vendor Management' }));
                }, 2000);
            }
        } catch (error) {
            console.error('Error adding vendor:', error);
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'Failed to add vendor. Please try again.' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-vendor-page">
            <div className="add-vendor-container">
                <div className="title-section">
                    <ArrowLeft 
                        size={24} 
                        className="back-arrow" 
                        onClick={() => window.dispatchEvent(new CustomEvent('changePage', { detail: 'Vendor Management' }))} 
                    />
                    <h2 className="page-title">Add Vendor</h2>
                </div>
                
                {message.text && (
                    <div className={`alert-message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="vendor-form">
                    <div className="form-section">
                        <div className="form-row">
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    name="shopName" 
                                    placeholder="Vendor Name" 
                                    value={formData.shopName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    name="ownerName" 
                                    placeholder="Owner" 
                                    value={formData.ownerName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <input 
                                    type="email" 
                                    name="email" 
                                    placeholder="Email" 
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    name="phone" 
                                    placeholder="Phone" 
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    name="licenseNo" 
                                    placeholder="License No" 
                                    value={formData.licenseNo}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    name="gstNo" 
                                    placeholder="GST No" 
                                    value={formData.gstNo}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    name="capacity" 
                                    placeholder="Capacity(Vehicle/Day)" 
                                    value={formData.capacity}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <input 
                                    type="password" 
                                    name="password" 
                                    placeholder="Password" 
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3 className="section-subtitle">Service center Address</h3>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    name="street" 
                                    placeholder="Street" 
                                    value={formData.street}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    name="city" 
                                    placeholder="City" 
                                    value={formData.city}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    name="state" 
                                    placeholder="State" 
                                    value={formData.state}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    name="pincode" 
                                    placeholder="Pin code" 
                                    value={formData.pincode}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Vendor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Addvendor;
