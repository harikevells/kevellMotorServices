import React, { useState, useEffect } from 'react';
import { 
    Container, Table, Button, Form, Modal, Badge, 
    Pagination, InputGroup, Row, Col, Spinner, Card 
} from 'react-bootstrap';
import { Search, Eye, Trash, MapPin, ShieldCheck, CheckCircle, ChevronLeft, ChevronRight, UserPlus, Edit } from 'lucide-react';
import axios from 'axios';
import './vendor.css';

const API_BASE_URL = 'http://localhost:5000/api/admin/vendors';
const rowsPerPage = 6;

const Vendorlist = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [verifiedFilter, setVerifiedFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fetchError, setFetchError] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    shopName: '',
    ownerName: '',
    email: '',
    phone: '',
    city: '',
    street: '',
    state: '',
    pincode: '',
    licenseNo: '',
    gstNo: '',
    capacity: 0,
    status: '',
    isVerified: false,
    password: ''
  });

  const fetchVendors = async () => {
    setLoading(true);
    setFetchError(null);
    const token = localStorage.getItem('token');
    try {
      const params = { page: currentPage, limit: rowsPerPage };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter !== 'All') params.status = statusFilter;
      if (verifiedFilter !== 'All') params.isVerified = verifiedFilter === 'Verified';

      const response = await axios.get(API_BASE_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (response.data.success) {
        setVendors(response.data.vendors || []);
        setTotalPages(response.data.pages || 1);
      }
    } catch (error) {
      setFetchError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [currentPage, searchTerm, statusFilter, verifiedFilter]);

  const handleOpenModal = (vendor) => {
    setSelectedVendor(vendor);
    setShowDetailModal(true);
  };

  const handleOpenEditModal = (vendor) => {
    setSelectedVendor(vendor);
    setEditFormData({
      shopName: vendor.shopName || '',
      ownerName: vendor.user?.name || vendor.ownerName || '',
      email: vendor.email || vendor.user?.email || '',
      phone: vendor.phone || '',
      city: vendor.address?.city || '',
      street: vendor.address?.street || '',
      state: vendor.address?.state || '',
      pincode: vendor.address?.pincode || '',
      licenseNo: vendor.licenseNo || '',
      gstNo: vendor.gstNo || '',
      capacity: vendor.capacity || 0,
      status: vendor.status || 'pending',
      isVerified: vendor.isVerified || false,
      password: '' // Keep empty initially
    });
    setShowEditModal(true);
  };

  const handleUpdateVendor = async (e) => {
    e.preventDefault();
    if (!selectedVendor || !selectedVendor._id) {
      alert('Error: No vendor selected for update');
      return;
    }
    
    const updateUrl = `${API_BASE_URL}/${selectedVendor._id}`.replace(/([^:]\/)\/+/g, "$1");
    console.log(`[DEBUG] Updating vendor at: ${updateUrl}`);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(updateUrl, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setShowEditModal(false);
        fetchVendors();
      }
    } catch (error) {
      console.error('Error updating vendor:', error);
      const errorMsg = error.response?.data?.message || error.message;
      alert(`Failed to update vendor: ${errorMsg}`);
    }
  };

  const handleToggleVerification = async (vendorId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_BASE_URL}/${vendorId}/verify`, 
        { isVerified: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        fetchVendors();
      }
    } catch (error) {
      console.error('Error toggling verification:', error);
      alert('Failed to update verification status');
    }
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="vendor-management-container">
      {/* Search and Filters */}
      <div className="search-filter-row">
        <div className="search-input-group">
          <Search size={18} color="#888" />
          <input 
            type="text" 
            placeholder="Search vendors by name, email or phone"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="filter-select-group ms-auto">
          <select 
            className="status-filter-select" 
            value={verifiedFilter} 
            onChange={(e) => { setVerifiedFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="All">All Verification</option>
            <option value="Verified">Verified</option>
            <option value="Unverified">Unverified</option>
          </select>
        </div>
        <button 
          className="add-vendor-btn"
          onClick={() => window.dispatchEvent(new CustomEvent('changePage', { detail: 'Add Vendor' }))}
        >
          <UserPlus size={18} />
          <span>Add Vendor</span>
        </button>
      </div>

      {fetchError && (
        <div className="text-danger small mb-3">⚠️ {fetchError}</div>
      )}

      {/* Main Table */}
      <div className="vendor-table-container">
        <table className="custom-vendor-table">
          <thead>
            <tr>
              <th className="text-center">Shop Name</th>
              <th className="text-center">Owner</th>
              <th className="text-center">Email</th>
              <th className="text-center">Phone</th>
              <th className="text-center">Registered</th>
              <th className="text-center">Verified</th>
              <th className="text-center">View</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-5">
                  <Spinner animation="border" variant="warning" />
                </td>
              </tr>
            ) : vendors.length > 0 ? (
              vendors.map((vendor, index) => (
                <tr key={vendor._id || index}>
                  <td className="text-center">
                    <div className="d-flex flex-column align-items-center">
                      <span className="fw-bold text-white">{vendor.shopName || 'Unnamed Shop'}</span>
                    </div>
                  </td>
                  <td className="text-center">{vendor.user?.name || 'No owner'}</td>
                  <td className="text-center">{vendor.email || vendor.user?.email || 'N/A'}</td>
                  <td className="text-center">{vendor.phone || 'N/A'}</td>
                  <td className="text-center">{formatDate(vendor.createdAt)}</td>
                  <td className="text-center">
                    <select 
                      className={`verification-dropdown ${vendor.isVerified ? 'verified' : 'unverified'}`}
                      value={vendor.isVerified ? 'Verified' : 'Unverified'}
                      onChange={() => handleToggleVerification(vendor._id, vendor.isVerified)}
                    >
                      <option value="Verified">Verified</option>
                      <option value="Unverified">Unverified</option>
                    </select>
                  </td>
                  <td className="text-center">
                    <div className="action-icons">
                      <Eye 
                        size={20} 
                        className="action-icon" 
                        onClick={() => handleOpenModal(vendor)} 
                      />
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="action-icons">
                      <Edit 
                        size={20} 
                        className="action-icon" 
                        onClick={() => handleOpenEditModal(vendor)} 
                      />
                      <Trash size={20} className="action-icon" />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-5 text-muted">No vendors found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="table-footer">
        <div className="text-muted small">Showing {vendors.length} vendors</div>
        <div className="pagination-controls">
          <div className="pagi-numbers">
            {currentPage} of {totalPages}
          </div>
          <div className="pagi-arrows">
            <button 
              className="pagi-arrow" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              className="pagi-arrow"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered className="edit-modal">
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title className="text-gold text-white">Edit Vendor</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white p-4">
          <Form onSubmit={handleUpdateVendor}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Shop Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    className="bg-secondary text-white border-dark"
                    value={editFormData.shopName}
                    onChange={(e) => setEditFormData({...editFormData, shopName: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Owner Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    className="bg-secondary text-white border-dark"
                    value={editFormData.ownerName}
                    onChange={(e) => setEditFormData({...editFormData, ownerName: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control 
                    type="email" 
                    className="bg-secondary text-white border-dark"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Phone</Form.Label>
                  <Form.Control 
                    type="text" 
                    className="bg-secondary text-white border-dark"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>License No</Form.Label>
                  <Form.Control 
                    type="text" 
                    className="bg-secondary text-white border-dark"
                    value={editFormData.licenseNo}
                    onChange={(e) => setEditFormData({...editFormData, licenseNo: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>GST No</Form.Label>
                  <Form.Control 
                    type="text" 
                    className="bg-secondary text-white border-dark"
                    value={editFormData.gstNo}
                    onChange={(e) => setEditFormData({...editFormData, gstNo: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Capacity</Form.Label>
                  <Form.Control 
                    type="number" 
                    className="bg-secondary text-white border-dark"
                    value={editFormData.capacity}
                    onChange={(e) => setEditFormData({...editFormData, capacity: parseInt(e.target.value) || 0})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select 
                    className="bg-secondary text-white border-dark"
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="suspended">Suspended</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <hr className="border-secondary" />
                <h6 className="text-gold mb-3">Address Details</h6>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Street</Form.Label>
                  <Form.Control 
                    type="text" 
                    className="bg-secondary text-white border-dark"
                    value={editFormData.street}
                    onChange={(e) => setEditFormData({...editFormData, street: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>City</Form.Label>
                  <Form.Control 
                    type="text" 
                    className="bg-secondary text-white border-dark"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({...editFormData, city: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>State</Form.Label>
                  <Form.Control 
                    type="text" 
                    className="bg-secondary text-white border-dark"
                    value={editFormData.state}
                    onChange={(e) => setEditFormData({...editFormData, state: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Pincode</Form.Label>
                  <Form.Control 
                    type="text" 
                    className="bg-secondary text-white border-dark"
                    value={editFormData.pincode}
                    onChange={(e) => setEditFormData({...editFormData, pincode: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Verification Status</Form.Label>
                  <Form.Select 
                    className={`bg-secondary text-white border-dark ${editFormData.isVerified ? 'text-success' : 'text-danger'}`}
                    value={editFormData.isVerified ? 'Verified' : 'Unverified'}
                    onChange={(e) => setEditFormData({...editFormData, isVerified: e.target.value === 'Verified'})}
                  >
                    <option value="Verified" className="text-success">Verified</option>
                    <option value="Unverified" className="text-danger">Unverified</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>New Password (Leave blank to keep current)</Form.Label>
                  <Form.Control 
                    type="password" 
                    className="bg-secondary text-white border-dark"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                    placeholder="Enter new password"
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end mt-4">
              <Button variant="outline-light" className="me-2" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button variant="warning" type="submit">Save Changes</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered className="detail-modal">
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title className="text-gold text-white">Vendor Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white p-4">
          {selectedVendor && (
            <Row className="g-4">
              <Col md={6}>
                <div className="detail-section h-100">
                  <h6 className="section-title"><ShieldCheck size={16} /> Vendor Info</h6>
                  <p><strong>Shop:</strong> {selectedVendor.shopName}</p>
                  <p><strong>Owner:</strong> {selectedVendor.user?.name || 'N/A'}</p>
                  <p><strong>Email:</strong> {selectedVendor.email || selectedVendor.user?.email}</p>
                  <p><strong>Phone:</strong> {selectedVendor.phone}</p>
                </div>
              </Col>
              <Col md={6}>
                <div className="detail-section h-100">
                  <h6 className="section-title"><MapPin size={16} /> Location</h6>
                  <p><strong>City:</strong> {selectedVendor.address?.city || 'N/A'}</p>
                  <p><strong>State:</strong> {selectedVendor.address?.state || 'N/A'}</p>
                  <p><strong>Pincode:</strong> {selectedVendor.address?.pincode || 'N/A'}</p>
                  <p><strong>Verified:</strong> {selectedVendor.isVerified ? 'Yes' : 'No'}</p>
                </div>
              </Col>
              <Col md={12}>
                <div className="detail-section">
                  <h6 className="section-title"><CheckCircle size={16} /> Summary</h6>
                  <p><strong>Status:</strong> {selectedVendor.status}</p>
                  <p><strong>Created:</strong> {selectedVendor.createdAt ? new Date(selectedVendor.createdAt).toLocaleString() : 'N/A'}</p>
                  <p><strong>Description:</strong> {selectedVendor.description || 'No additional details available.'}</p>
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button variant="outline-light" onClick={() => setShowDetailModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Vendorlist;
