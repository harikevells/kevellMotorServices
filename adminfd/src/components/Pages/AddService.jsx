import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Spinner, FormCheck } from 'react-bootstrap';
import './Addservices.css';

const MASTER_SERVICES = [
    'Periodic Maintenance', 'Oil Change', 'Car Wash & Polish', 'Brake Repair',
    'Engine Overhaul', 'Battery Replacement', 'Tyre Rotation & Alignment',
    'AC Servicing', 'Clutch Work', 'Electrical Repair', 'Interior Cleaning'
];

/**
 * AddService Component
 * Redesigned to match the requested UI image.
 */
const AddService = ({ initialData, onSubmit, onCancel, isLoading }) => {
    const [formData, setFormData] = useState({
        serviceName: '',
        category: '',
        price: '',
        duration: '',
        description: '',
        image: null,
        status: 'Active'
    });

    const [validated, setValidated] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                status: initialData.status === true || initialData.status === 'Active' ? 'Active' : 'Inactive'
            });
        } else {
            // Reset form for fresh entry
            setFormData({
                serviceName: '',
                category: '',
                price: '',
                duration: '',
                description: '',
                image: null,
                status: 'Active'
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 'Active' : 'Inactive') : value
        }));
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const newErrors = {};
        if (!formData.serviceName) newErrors.serviceName = 'Service name is required';
        if (!formData.category) newErrors.category = 'Please select a category';
        if (!formData.price) newErrors.price = 'Price is required';
        if (!formData.duration) newErrors.duration = 'Duration is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setValidated(true);

        const data = new FormData();
        data.append('serviceName', formData.serviceName);
        data.append('category', formData.category);
        data.append('price', formData.price);
        data.append('duration', formData.duration);
        data.append('description', formData.description || '');
        data.append('status', formData.status);
        if (formData.image instanceof File) {
            data.append('image', formData.image);
        }

        onSubmit(data);
    };

    return (
        <div className="add-service-container">
            <h5 className="add-service-title">Add Services</h5>
            <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Row className="mb-4">
                    <Col md={6}>
                        <Form.Group controlId="category">
                            <Form.Label className="form-label-custom">Category</Form.Label>
                            <Form.Select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="select-custom"
                                required
                            >
                                <option value="">Select Category</option>
                                <option value="2 Wheeler">2 Wheeler</option>
                                <option value="4 Wheeler">4 Wheeler</option>
                                <option value="Heavy">Heavy</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group controlId="price">
                            <Form.Label className="form-label-custom">Price</Form.Label>
                            <Form.Control
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="Price"
                                className="input-custom"
                                required
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Row className="mb-4 align-items-end">
                    <Col md={6}>
                        <Form.Group controlId="serviceName">
                            <Form.Label className="form-label-custom">Services</Form.Label>
                            <Form.Control
                                type="text"
                                list="service-list"
                                name="serviceName"
                                value={formData.serviceName}
                                onChange={handleChange}
                                placeholder="Services"
                                className="input-custom"
                                required
                            />
                            <datalist id="service-list">
                                {MASTER_SERVICES.map((s, idx) => (
                                    <option key={idx} value={s} />
                                ))}
                            </datalist>
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group controlId="duration">
                            <Form.Label className="form-label-custom">Duration</Form.Label>
                            <Form.Control
                                type="text"
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                placeholder="Duration (e.g. 10 min)"
                                className="input-custom"
                                required
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group className="d-flex align-items-center mb-2" controlId="status">
                            <span className="active-toggle-label">Active</span>
                            <FormCheck 
                                type="switch"
                                id="status-switch"
                                className="custom-switch"
                                name="status"
                                checked={formData.status === 'Active'}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <div className="d-flex justify-content-center">
                    <Button variant="success" type="submit" className="submit-btn-green" disabled={isLoading}>
                        {isLoading ? <Spinner size="sm" animation="border" /> : 'Submit'}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default AddService;
