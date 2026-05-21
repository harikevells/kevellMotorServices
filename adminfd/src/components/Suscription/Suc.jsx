import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { Edit2, Trash2, Plus, Check } from 'lucide-react';
import './Suc.css';

const Suc = () => {
  const [plans, setPlans] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: 'Basic',
    price: 0,
    billingCycle: 'monthly',
    features: [''],
    autoRenewal: true,
    expiryNotifications: true
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/subscriptions`);
      const data = await response.json();
      if (data.success) {
        setPlans(data.data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleShowModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        price: plan.price,
        billingCycle: plan.billingCycle,
        features: plan.features.length ? [...plan.features] : [''],
        autoRenewal: plan.autoRenewal,
        expiryNotifications: plan.expiryNotifications
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: 'Basic',
        price: 0,
        billingCycle: 'monthly',
        features: [''],
        autoRenewal: true,
        expiryNotifications: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPlan(null);
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures.length ? newFeatures : [''] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const url = editingPlan 
      ? `http://localhost:5000/api/subscriptions/${editingPlan._id}`
      : `http://localhost:5000/api/subscriptions`;
    
    const method = editingPlan ? 'PUT' : 'POST';

    // Filter out empty features
    const submitData = {
      ...formData,
      features: formData.features.filter(f => f.trim() !== '')
    };

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });
      
      const data = await response.json();
      if (data.success) {
        fetchPlans();
        handleCloseModal();
      } else {
        alert(data.message || 'Error saving plan');
      }
    } catch (error) {
      console.error('Error saving plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subscription plan?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/subscriptions/${id}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
          fetchPlans();
        } else {
          alert('Error deleting plan');
        }
      } catch (error) {
        console.error('Error deleting plan:', error);
      }
    }
  };

  return (
    <div className="subscription-container">
      <div className="subscription-header">
        <h2></h2>
        <button className="btn-venum" onClick={() => handleShowModal()}>
          <Plus size={18} style={{ marginRight: '5px' }} />
          Create Plan
        </button>
      </div>

      <div className="plans-grid">
        {plans.map(plan => (
          <div className="plan-card" key={plan._id}>
            <div className="plan-card-header">
              <h3 className="plan-name">{plan.name}</h3>
              <p className="plan-price">₹{plan.price} <span style={{fontSize: '16px', color: '#aaa'}}>/ {plan.billingCycle}</span></p>
            </div>
            
            <div className="plan-features">
              <ul>
                {plan.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
            </div>

            <div className="plan-settings">
              <div>
                {plan.autoRenewal ? <span className="custom-check">✓</span> : <span className="custom-cross">✗</span>} Auto-Renewal
              </div>
              <div>
                {plan.expiryNotifications ? <span className="custom-check">✓</span> : <span className="custom-cross">✗</span>} Expiry Notifications
              </div>
            </div>

            <div className="plan-actions">
              <button className="btn-venum-outline" onClick={() => handleShowModal(plan)}>
                <Edit2 size={16} /> Edit
              </button>
              <button className="btn-danger-venum" onClick={() => handleDelete(plan._id)}>
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        ))}
        {plans.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#aaa' }}>
            No subscription plans found. Create one to get started!
          </div>
        )}
      </div>

      <Modal show={showModal} onHide={handleCloseModal} centered contentClassName="venum-modal" size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Group>
                  <Form.Label>Plan Name</Form.Label>
                  <Form.Select 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  >
                    <option value="Basic">Basic</option>
                    <option value="Pro">Pro</option>
                    <option value="Enterprise">Enterprise</option>
                    <option value="Custom">Custom</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6 mb-3">
                <Form.Group>
                  <Form.Label>Price (₹)</Form.Label>
                  <Form.Control 
                    type="number" 
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    required
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12 mb-3">
                <Form.Group>
                  <Form.Label>Billing Cycle</Form.Label>
                  <Form.Select 
                    value={formData.billingCycle}
                    onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                    required
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="custom">Custom</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <div className="mb-4">
              <Form.Label>Features</Form.Label>
              {formData.features.map((feature, index) => (
                <div key={index} className="feature-input-group">
                  <Form.Control 
                    type="text" 
                    placeholder="Enter feature description"
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                  />
                  <Button variant="outline-danger" onClick={() => removeFeature(index)}>X</Button>
                </div>
              ))}
              <Button variant="outline-warning" size="sm" onClick={addFeature} className="mt-2">
                + Add Feature
              </Button>
            </div>

            <div className="mb-3">
              <Form.Check 
                type="switch"
                id="auto-renewal-switch"
                label="Enable Auto-Renewal"
                checked={formData.autoRenewal}
                onChange={(e) => setFormData({ ...formData, autoRenewal: e.target.checked })}
              />
            </div>

            <div className="mb-3">
              <Form.Check 
                type="switch"
                id="expiry-notification-switch"
                label="Enable Expiry Notifications"
                checked={formData.expiryNotifications}
                onChange={(e) => setFormData({ ...formData, expiryNotifications: e.target.checked })}
              />
            </div>
            
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
              <Button type="submit" className="btn-venum" disabled={loading}>
                {loading ? 'Saving...' : 'Save Plan'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Suc;
