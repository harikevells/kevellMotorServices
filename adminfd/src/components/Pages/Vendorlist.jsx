import React, { useState, useEffect } from 'react';
import { 
    Container, Table, Button, Form, Modal, Badge, 
    Pagination, InputGroup, Row, Col, Spinner, Card 
} from 'react-bootstrap';
import { Search, Eye, Trash, MapPin, ShieldCheck, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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
        <div className="filter-select-group">
          <select 
            className="status-filter-select" 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="All">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
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
      </div>

      {fetchError && (
        <div className="text-danger small mb-3">⚠️ {fetchError}</div>
      )}

      {/* Main Table */}
      <div className="vendor-table-container">
        <table className="custom-vendor-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Vendor</th>
              <th>Owner</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Verified</th>
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
                  <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                  <td>
                    <div className="d-flex flex-column">
                      <span className="fw-bold text-white">{vendor.shopName || 'Unnamed Shop'}</span>
                      <small className="text-muted">{vendor.address?.city || 'No location'}</small>
                    </div>
                  </td>
                  <td>{vendor.user?.name || 'No owner'}</td>
                  <td>{vendor.email || vendor.user?.email || 'N/A'}</td>
                  <td>{vendor.phone || 'N/A'}</td>
                  <td>
                    <span className={`status-indicator ${vendor.status?.toLowerCase()}`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td>
                    <span className={`status-indicator ${vendor.isVerified ? 'verified' : 'unverified'}`}>
                      {vendor.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td>
                    <div className="action-icons">
                      <Eye 
                        size={20} 
                        className="action-icon" 
                        onClick={() => handleOpenModal(vendor)} 
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

      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered className="detail-modal">
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title className="text-gold">Vendor Details</Modal.Title>
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
