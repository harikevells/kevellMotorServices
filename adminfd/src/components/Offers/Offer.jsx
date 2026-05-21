import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { Edit2, Trash2, Plus, TrendingUp, Tag, Activity, Clock, CheckCircle } from 'lucide-react';
import './Offer.css';
import axios from 'axios';

const Offer = () => {
  const [offers, setOffers] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalOffers: 0,
    totalRedeemed: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    offerTitle: '',
    shopName: 'Platform Offer',
    discountType: 'percentage',
    discount: '',
    couponCode: '',
    planTier: 'Basic',
    category: 'General',
    startDate: '',
    endDate: '',
    usageLimitPerUser: 1,
    totalRedemptionLimit: '',
    minimumBookingValue: 0,
    activeStatus: true
  });

  const [saving, setSaving] = useState(false);

  const fetchOffersAndAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch Analytics
      const analyticsRes = await axios.get('http://localhost:5000/api/offers/analytics', { headers });
      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.data);
      }

      // Fetch Offers
      const offersRes = await axios.get('http://localhost:5000/api/offers?limit=50', { headers });
      if (offersRes.data.success) {
        setOffers(offersRes.data.offers);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffersAndAnalytics();
  }, [fetchOffersAndAnalytics]);

  const handleShowModal = (offer = null) => {
    if (offer) {
      setEditingOffer(offer);
      setFormData({
        offerTitle: offer.offerTitle,
        shopName: offer.shopName,
        discountType: offer.discountType || 'percentage',
        discount: offer.discount,
        couponCode: offer.couponCode || '',
        planTier: offer.planTier || 'Basic',
        category: offer.category,
        startDate: new Date(offer.startDate).toISOString().split('T')[0],
        endDate: new Date(offer.endDate).toISOString().split('T')[0],
        usageLimitPerUser: offer.usageLimitPerUser || 1,
        totalRedemptionLimit: offer.totalRedemptionLimit || '',
        minimumBookingValue: offer.minimumBookingValue || 0,
        activeStatus: offer.activeStatus
      });
    } else {
      setEditingOffer(null);
      setFormData({
        offerTitle: '',
        shopName: 'Platform Offer',
        discountType: 'percentage',
        discount: '',
        couponCode: '',
        planTier: 'Basic',
        category: 'General',
        startDate: '',
        endDate: '',
        usageLimitPerUser: 1,
        totalRedemptionLimit: '',
        minimumBookingValue: 0,
        activeStatus: true
      });
    }
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'OFFER-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, couponCode: code }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const token = sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const payload = { ...formData };
      if (!payload.couponCode) {
        payload.couponCode = `OFFER-${Math.floor(Math.random() * 100000)}`;
      }

      const url = editingOffer 
        ? `http://localhost:5000/api/offers/${editingOffer._id}`
        : `http://localhost:5000/api/offers`;
      
      const method = editingOffer ? 'put' : 'post';

      const response = await axios[method](url, payload, { headers });
      
      if (response.data.success) {
        setShowModal(false);
        fetchOffersAndAnalytics();
      }
    } catch (error) {
      console.error('Error saving offer:', error);
      alert(error.response?.data?.message || 'Error saving offer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this promotional offer?')) {
      try {
        const token = sessionStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const response = await axios.delete(`http://localhost:5000/api/offers/${id}`, { headers });
        
        if (response.data.success) {
          fetchOffersAndAnalytics();
        }
      } catch (error) {
        console.error('Error deleting offer:', error);
        alert('Failed to delete offer');
      }
    }
  };

  return (
    <div className="offer-container">
      {/* Header */}
      <div className="offer-header">
        <h2></h2>
        <button className="btn-venum" onClick={() => handleShowModal()}>
          <Plus size={18} /> Create Campaign
        </button>
      </div>

      {/* Analytics Dashboard */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="label"><Activity size={16} /> Total Active Offers</div>
          <div className="value">{analytics.totalOffers}</div>
        </div>
        <div className="analytics-card">
          <div className="label"><CheckCircle size={16} /> Total Redemptions</div>
          <div className="value">{analytics.totalRedeemed}</div>
        </div>
        <div className="analytics-card">
          <div className="label"><TrendingUp size={16} /> Revenue Generated</div>
          <div className="value">₹{analytics.totalRevenue.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Offers Grid */}
      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="warning" />
        </div>
      ) : (
        <div className="offers-grid">
          {offers.length === 0 ? (
            <p className="text-center text-muted w-100 py-5">No promotional offers found.</p>
          ) : (
            offers.map(offer => (
              <div className="offer-card" key={offer._id}>
                <span className="offer-tier-badge">{offer.planTier || 'Basic'} Plan</span>
                <h3 className="offer-title">{offer.offerTitle}</h3>
                <div className="offer-shop">For: {offer.shopName || 'Platform Wide'}</div>
                
                <div className="offer-discount">
                  {offer.discountType === 'flat' ? '₹' : ''}
                  {offer.discount}
                  {offer.discountType === 'percentage' ? '%' : ''} 
                  <span>OFF</span>
                </div>

                <div className="offer-code-box">
                  {offer.couponCode || 'NO-CODE'}
                </div>

                <div className="offer-stats">
                  <div className="stat-row">
                    <span className="stat-label">Category:</span>
                    <span className="stat-value">{offer.category}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Expires:</span>
                    <span className="stat-value">{new Date(offer.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Redeemed:</span>
                    <span className="stat-value">{offer.timesRedeemed || 0} times</span>
                  </div>
                </div>

                <div className="offer-actions">
                  <button className="btn-venum-outline" onClick={() => handleShowModal(offer)}>
                    <Edit2 size={16} /> Edit
                  </button>
                  <button className="btn-danger-venum" onClick={() => handleDelete(offer._id)}>
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered className="venum-modal" size="lg">
        <div className="modal-content-venum">
          <div className="modal-header">
            <h5 className="modal-title font-weight-bold">
              {editingOffer ? 'Edit Promotional Offer' : 'Create New Offer Campaign'}
            </h5>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="plan-tier-selector">
                {['Basic', 'Pro', 'Enterprise'].map(tier => (
                  <div 
                    key={tier} 
                    className={`tier-btn ${formData.planTier === tier ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, planTier: tier }))}
                  >
                    {tier} Plan
                  </div>
                ))}
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <Form.Label>Offer Title</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="offerTitle" 
                    value={formData.offerTitle} 
                    onChange={handleChange} 
                    required 
                    placeholder="e.g. Summer Servicing Sale"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Label>Target Shop / Platform</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="shopName" 
                    value={formData.shopName} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-4 mb-3">
                  <Form.Label>Discount Type</Form.Label>
                  <Form.Select name="discountType" value={formData.discountType} onChange={handleChange}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </Form.Select>
                </div>
                <div className="col-md-4 mb-3">
                  <Form.Label>Discount Value</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="discount" 
                    value={formData.discount} 
                    onChange={handleChange} 
                    required 
                    min="0"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <Form.Label>Coupon Code</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control 
                      type="text" 
                      name="couponCode" 
                      value={formData.couponCode} 
                      onChange={handleChange} 
                      placeholder="Optional"
                    />
                    <Button variant="outline-warning" onClick={generateCouponCode} style={{borderColor: '#f28b2c', color: '#f28b2c'}}>
                      Auto
                    </Button>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    name="startDate" 
                    value={formData.startDate} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Label>Expiry Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    name="endDate" 
                    value={formData.endDate} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-4 mb-3">
                  <Form.Label>Usage Limit / User</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="usageLimitPerUser" 
                    value={formData.usageLimitPerUser} 
                    onChange={handleChange} 
                    min="1"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <Form.Label>Total Redemptions Limit</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="totalRedemptionLimit" 
                    value={formData.totalRedemptionLimit} 
                    onChange={handleChange} 
                    placeholder="Unlimited"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <Form.Label>Min Booking Value (₹)</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="minimumBookingValue" 
                    value={formData.minimumBookingValue} 
                    onChange={handleChange} 
                    min="0"
                  />
                </div>
              </div>

              <div className="mb-3">
                <Form.Label>Applicable Category</Form.Label>
                <Form.Control 
                  type="text" 
                  name="category" 
                  value={formData.category} 
                  onChange={handleChange} 
                  required 
                  placeholder="e.g. Service, Spare Parts, General"
                />
              </div>

              <Form.Check 
                type="switch"
                id="activeStatus"
                name="activeStatus"
                label="Offer Active Status"
                checked={formData.activeStatus}
                onChange={handleChange}
                className="text-white mt-3"
              />
            </div>
            
            <div className="modal-footer">
              <Button variant="outline-secondary" onClick={() => setShowModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="warning" type="submit" disabled={saving} style={{backgroundColor: '#f28b2c', borderColor: '#f28b2c', color: '#fff', fontWeight: 'bold'}}>
                {saving ? 'Saving...' : (editingOffer ? 'Update Campaign' : 'Publish Offer')}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Offer;
