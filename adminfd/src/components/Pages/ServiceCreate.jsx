import React, { useState, useEffect } from 'react';
import { 
    Container, Table, Button, Form, Modal, Badge, 
    Pagination, InputGroup, Row, Col, Image, Spinner, Card
} from 'react-bootstrap';
import { Search, Plus, Edit2, Trash2, Filter, Loader } from 'lucide-react';
import axios from 'axios';
import AddService from './AddService';
import './Viewservices.css';

const API_BASE_URL = 'http://localhost:5000/api/services';

const ServiceCreate = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const servicesPerPage = 5;

    const [showFormModal, setShowFormModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [currentService, setCurrentService] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch Services from Backend
    const fetchServices = async () => {
        setLoading(true);
        try {
            const query = `?search=${searchTerm}&category=${filterCategory}&status=${filterStatus}`;
            const response = await axios.get(`${API_BASE_URL}${query}`);
            if (response.data.success) {
                setServices(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, [searchTerm, filterCategory, filterStatus]);

    // Action Handlers
    const handleSaveService = async (formData) => {
        setIsSaving(true);
        try {
            const url = currentService ? `${API_BASE_URL}/${currentService._id}` : API_BASE_URL;
            const method = currentService ? 'put' : 'post';
            
            const response = await axios[method](url, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Placeholder for auth
                }
            });

            if (response.data.success) {
                fetchServices();
                setShowFormModal(false);
            }
        } catch (error) {
            console.error('Error saving service:', error);
            alert('Error saving service. Please check console.');
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`${API_BASE_URL}/${currentService._id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            fetchServices();
            setShowDeleteModal(false);
        } catch (error) {
            console.error('Error deleting service:', error);
        }
    };

    const toggleStatus = async (id) => {
        try {
            await axios.patch(`${API_BASE_URL}/${id}/toggle`, {}, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            fetchServices();
        } catch (error) {
            console.error('Error toggling status:', error);
        }
    };

    // Pagination constants
    const indexOfLastService = currentPage * servicesPerPage;
    const indexOfFirstService = indexOfLastService - servicesPerPage;
    const currentRows = services.slice(indexOfFirstService, indexOfLastService);
    const totalPages = Math.ceil(services.length / servicesPerPage);

    return (
        <Container fluid className="service-management-container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold mb-0" style={{ color: 'var(--gold-primary)' }}>Service Management</h3>
                <Button variant="warning" onClick={() => { setCurrentService(null); setShowFormModal(true); }} className="d-flex align-items-center gap-2">
                    <Plus size={20} /> Add Service
                </Button>
            </div>

            <Card className="management-card mb-4">
                <Row className="g-3">
                    <Col md={4}>
                        <InputGroup>
                            <InputGroup.Text className="bg-transparent border-end-0" style={{ borderColor: 'var(--gray-border)' }}>
                                <Search size={18} className="text-gold" />
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Search services..."
                                className="filter-input border-start-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </Col>
                    <Col md={3}>
                        <Form.Select className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                            <option value="All">All Categories</option>
                            <option value="Bike">Bike</option>
                            <option value="Car">Car</option>
                            <option value="Heavy">Heavy</option>
                        </Form.Select>
                    </Col>
                    <Col md={3}>
                        <Form.Select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="All">All Statuses</option>
                            <option value="Active">Active Only</option>
                            <option value="Inactive">Inactive Only</option>
                        </Form.Select>
                    </Col>
                    <Col md={2}>
                        <Button variant="outline-dark" className="w-100 action-btn" onClick={() => { setSearchTerm(''); setFilterCategory('All'); setFilterStatus('All'); }}>
                            Clear
                        </Button>
                    </Col>
                </Row>
            </Card>

            <div className="card management-card overflow-hidden">
                <Table responsive hover className="mb-0 align-middle">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Service Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Duration</th>
                            <th>Status</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="text-center py-5">
                                    <Spinner animation="border" variant="warning" />
                                </td>
                            </tr>
                        ) : currentRows.length > 0 ? (
                            currentRows.map((service, index) => (
                                <tr key={service._id}>
                                    <td>{indexOfFirstService + index + 1}</td>
                                    <td className="fw-bold">{service.serviceName || service.name || 'Unnamed Service'}</td>
                                    <td>
                                        <Badge className={`badge-${service.category.toLowerCase()}`}>
                                            {service.category}
                                        </Badge>
                                    </td>
                                    <td className="fw-bold text-white">₹ {service.price}</td>
                                    <td>{service.duration}</td>
                                    <td>
                                        <Form.Check 
                                            type="switch"
                                            id={`toggle-${service._id}`}
                                            checked={service.status}
                                            onChange={() => toggleStatus(service._id)}
                                        />
                                    </td>
                                    <td className="text-center">
                                        <div className="d-flex justify-content-center gap-2">
                                            <Button variant="light" size="sm" className="action-btn edit" onClick={() => { setCurrentService(service); setShowFormModal(true); }}>
                                                <Edit2 size={14} />
                                            </Button>
                                            <Button variant="light" size="sm" className="action-btn delete" onClick={() => { setCurrentService(service); setShowDeleteModal(true); }}>
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="text-center py-5 text-muted">No services found.</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="text-muted small">Showing {currentRows.length} of {services.length} entries</div>
                <Pagination size="sm">
                    {[...Array(totalPages)].map((_, i) => (
                        <Pagination.Item key={i+1} active={i+1 === currentPage} onClick={() => setCurrentPage(i+1)}>
                            {i+1}
                        </Pagination.Item>
                    ))}
                </Pagination>
            </div>

            <Modal show={showFormModal} onHide={() => setShowFormModal(false)} size="lg" centered>
                <Modal.Body className="p-0 border-0 bg-transparent">
                    <AddService 
                        initialData={currentService}
                        onSubmit={handleSaveService}
                        onCancel={() => setShowFormModal(false)}
                        isLoading={isSaving}
                    />
                </Modal.Body>
            </Modal>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered size="sm">
                <div className="management-card p-3 border-0">
                    <h6 className="text-white mb-3">Delete Service?</h6>
                    <p className="small text-muted mb-4">Are you sure you want to remove {currentService?.serviceName}?</p>
                    <div className="d-flex justify-content-end gap-2">
                        <Button variant="outline-light" size="sm" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                        <Button variant="danger" size="sm" onClick={confirmDelete}>Delete</Button>
                    </div>
                </div>
            </Modal>
        </Container>
    );
};

export default ServiceCreate;
