import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Spinner, InputGroup, Image } from 'react-bootstrap';
import axios from 'axios';
import './Addservices.css';

const API_BASE_URL = 'http://localhost:5000/api/services';

const MASTER_SERVICES = [
    'Periodic Maintenance', 'Oil Change', 'Car Wash & Polish', 'Brake Repair',
    'Engine Overhaul', 'Battery Replacement', 'Tyre Rotation & Alignment',
    'AC Servicing', 'Clutch Work', 'Electrical Repair', 'Interior Cleaning'
];

/**
 * AddService Component
 * Features: Searchable dropdown, backend integration, premium branding.
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

    const [imagePreview, setImagePreview] = useState(null);
    const [validated, setValidated] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                status: initialData.status === true || initialData.status === 'Active' ? 'Active' : 'Inactive'
            });
            if (initialData.image) {
                const fullImageUrl = initialData.image.startsWith('http') 
                    ? initialData.image 
                    : `http://localhost:5000${initialData.image}`;
                setImagePreview(fullImageUrl);
            }
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
            setImagePreview(URL.createObjectURL(file));
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

        // Prepare Multi-part form data
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
        <Card className="add-service-card">
            <Card.Header className="add-service-header">
                <h5 className="mb-0">{initialData ? 'Edit Service' : 'Add New Service'}</h5>
            </Card.Header>
            <Card.Body className="p-4">
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6} className="mb-3">
                            <Form.Group controlId="serviceName">
                                <Form.Label className="form-label">Service Name *</Form.Label>
                                <Form.Control
                                    type="text"
                                    list="service-list"
                                    name="serviceName"
                                    value={formData.serviceName}
                                    onChange={handleChange}
                                    placeholder="Type or select service..."
                                    isInvalid={!!errors.serviceName}
                                    required
                                />
                                <datalist id="service-list">
                                    {MASTER_SERVICES.map((s, idx) => (
                                        <option key={idx} value={s} />
                                    ))}
                                </datalist>
                                <Form.Control.Feedback type="invalid">{errors.serviceName}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={6} className="mb-3">
                            <Form.Group controlId="category">
                                <Form.Label className="form-label">Category *</Form.Label>
                                <Form.Select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    isInvalid={!!errors.category}
                                    required
                                    className="filter-select"
                                >
                                    <option value="">Select Category</option>
                                    <option value="Bike">Bike</option>
                                    <option value="Car">Car</option>
                                    <option value="Heavy">Heavy</option>
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">{errors.category}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6} className="mb-3">
                            <Form.Group controlId="price">
                                <Form.Label className="form-label">Price *</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text>₹</InputGroup.Text>
                                    <Form.Control
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        isInvalid={!!errors.price}
                                        required
                                    />
                                </InputGroup>
                            </Form.Group>
                        </Col>

                        <Col md={6} className="mb-3">
                            <Form.Group controlId="duration">
                                <Form.Label className="form-label">Duration *</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleChange}
                                    placeholder="e.g. 2 hrs"
                                    isInvalid={!!errors.duration}
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3" controlId="description">
                        <Form.Label className="form-label">Description</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Enter service details..."
                        />
                    </Form.Group>

                    <Row className="align-items-center mb-4">
                        <Col md={8}>
                            <Form.Group controlId="image">
                                <Form.Label className="form-label">Service Image</Form.Label>
                                <Form.Control
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4} className="text-center">
                            {imagePreview && (
                                <div className="image-preview-container p-1" style={{ width: '80px', height: '80px', margin: '0 auto' }}>
                                    <Image
                                        src={imagePreview}
                                        alt="Preview"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        rounded
                                    />
                                </div>
                            )}
                        </Col>
                    </Row>

                    <Form.Group className="mb-4" controlId="status">
                        <Form.Check 
                            type="switch"
                            id="status-switch"
                            label={formData.status}
                            name="status"
                            checked={formData.status === 'Active'}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <div className="d-flex justify-content-end gap-2">
                        <Button variant="outline-secondary" onClick={onCancel}>Cancel</Button>
                        <Button variant="warning" type="submit" disabled={isLoading}>
                            {isLoading ? <Spinner size="sm" animation="border" /> : (initialData ? 'Update Service' : 'Add Service')}
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default AddService;
