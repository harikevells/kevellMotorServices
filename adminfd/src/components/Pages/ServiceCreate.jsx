import React, { useState, useEffect } from 'react';
import { Spinner, Table, Button, Form } from 'react-bootstrap';
import { Search, Edit3, Trash2 } from 'lucide-react';
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
    const servicesPerPage = 8; // Match image pagination 1-8

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
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data.success) {
                fetchServices();
                setCurrentService(null); // Reset form
            }
        } catch (error) {
            console.error('Error saving service:', error);
            alert('Error saving service.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this service?')) {
            try {
                await axios.delete(`${API_BASE_URL}/${id}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                fetchServices();
            } catch (error) {
                console.error('Error deleting service:', error);
            }
        }
    };

    // Pagination constants
    const indexOfLastService = currentPage * servicesPerPage;
    const indexOfFirstService = indexOfLastService - servicesPerPage;
    const currentRows = services.slice(indexOfFirstService, indexOfLastService);
    const totalPages = Math.ceil(services.length / servicesPerPage);

    return (
        <div className="service-management-outer">
            {/* Embedded Form at the Top */}
            <AddService
                initialData={currentService}
                onSubmit={handleSaveService}
                onCancel={() => setCurrentService(null)}
                isLoading={isSaving}
            />

            {/* View Services Section */}
            <div className="view-services-section">
                <div className="section-header">
                    <h5 className="section-title">View Services</h5>
                    {/* <Button 
                        variant="orange" 
                        className="add-services-btn-orange"
                        onClick={() => {
                            setCurrentService(null);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                    >
                        +Add Services
                    </Button> */}
                </div>

                {/* Filter Row */}
                <div className="filter-row-custom">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon-inside" />
                        <Form.Control
                            placeholder="Search services"
                            className="search-input-custom"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Form.Select 
                        className="filter-select-custom" 
                        value={filterCategory} 
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="All">All Category</option>
                        <option value="2 Wheeler">2 Wheeler</option>
                        <option value="4 Wheeler">4 Wheeler</option>
                        <option value="Heavy">Heavy</option>
                    </Form.Select>
                    <Form.Select 
                        className="filter-select-custom" 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </Form.Select>
                </div>

                {/* Table */}
                <div className="table-container-custom">
                    <Table responsive className="table-custom">
                        <thead>
                            <tr>
                                <th>Service Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Duration</th>
                                <th>Status</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-5">
                                        <Spinner animation="border" variant="warning" />
                                    </td>
                                </tr>
                            ) : currentRows.length > 0 ? (
                                currentRows.map((service) => (
                                    <tr key={service._id}>
                                        <td>{service.serviceName}</td>
                                        <td>{service.category}</td>
                                        <td>{service.price}</td>
                                        <td>{service.duration || 'N/A'}</td>
                                        <td>
                                            <span className={service.status === 'Active' || service.status === true ? 'status-active-text' : 'text-danger'}>
                                                {service.status === true || service.status === 'Active' ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="action-icon-btn" onClick={() => {
                                                setCurrentService(service);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}>
                                                <Edit3 size={18} />
                                            </button>
                                            <button className="action-icon-btn" onClick={() => handleDelete(service._id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-5">No services found.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>

                {/* Footer / Pagination */}
                <div className="pagination-footer">
                    <div>
                        Show rows per page 
                        <select className="rows-per-page-select">
                            <option>8</option>
                        </select>
                    </div>
                    <div className="pagination-nav">
                        <span>{indexOfFirstService + 1}-{Math.min(indexOfLastService, services.length)} of {services.length}</span>
                        <div className="d-flex gap-2">
                            <button 
                                className="nav-arrow-btn" 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            >
                                &lt;
                            </button>
                            <button 
                                className="nav-arrow-btn"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                            >
                                &gt;
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceCreate;
