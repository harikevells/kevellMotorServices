import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Modal, Badge, Pagination, InputGroup, Row, Col, Spinner, Card } from 'react-bootstrap';
import { Search, Eye, MapPin, Phone, ShieldCheck, CheckCircle } from 'lucide-react';
import axios from 'axios';
import './vendor.css';

const API_BASE_URL = 'http://localhost:5000/api/admin/vendors';
const rowsPerPage = 20;

const statusStyles = {
  pending: { bg: 'warning', text: 'dark' },
  approved: { bg: 'success', text: 'white' },
  rejected: { bg: 'danger', text: 'white' },
  suspended: { bg: 'secondary', text: 'white' },
};

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
    if (!token) {
      setFetchError('Missing auth token. Please login again.');
      setLoading(false);
      return;
    }

    try {
      const params = {
        page: currentPage,
        limit: rowsPerPage,
      };

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
      } else {
        setFetchError('Unable to load vendors.');
      }
    } catch (error) {
      console.error('Vendor fetch error:', error);
      setFetchError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [currentPage, searchTerm, statusFilter, verifiedFilter]);

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setVerifiedFilter('All');
    setCurrentPage(1);
  };

  const handleOpenModal = (vendor) => {
    setSelectedVendor(vendor);
    setShowDetailModal(true);
  };

  const renderBadge = (value) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Badge bg="success" pill>Verified</Badge>
      ) : (
        <Badge bg="secondary" pill>Unverified</Badge>
      );
    }
    return (
      <Badge bg={statusStyles[value]?.bg || 'secondary'} text={statusStyles[value]?.text || 'white'} pill>
        {value || 'Unknown'}
      </Badge>
    );
  };

  return (
    <Container fluid className="vendor-management-container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">Vendor Management</h3>
        <div className="text-muted small">Total Vendors: {vendors.length}</div>
      </div>

      <Card className="management-card mb-4 border-0">
        <Row className="g-3 align-items-center">
          <Col md={5}>
            <InputGroup>
              <InputGroup.Text className="bg-transparent border-end-0 border-gray">
                <Search size={18} className="text-gold" />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search vendors by name, email or phone"
                className="filter-input border-start-0"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </InputGroup>
          </Col>
          <Col md={3}>
            <Form.Select className="filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="All">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Select className="filter-select" value={verifiedFilter} onChange={(e) => { setVerifiedFilter(e.target.value); setCurrentPage(1); }}>
              <option value="All">All Verification</option>
              <option value="Verified">Verified</option>
              <option value="Unverified">Unverified</option>
            </Form.Select>
          </Col>
          <Col md={1}>
            <Button variant="outline-dark" className="w-100 action-btn" onClick={resetFilters}>
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      {fetchError && (
        <div className="alert alert-danger mb-4 py-2 border-0" style={{ background: 'rgba(220, 53, 69, 0.2)', color: '#ff8a8a' }}>
          <small>⚠️ {fetchError}</small>
        </div>
      )}

      <div className="card management-card overflow-hidden">
        <Table responsive hover className="mb-0 align-middle">
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
                  <td className="text-start">
                    <div className="d-flex flex-column align-items-start">
                      <span className="fw-bold text-white">{vendor.shopName || 'Unnamed Shop'}</span>
                      <small className="text-muted">{vendor.address?.city || vendor.address?.state || 'No location'}</small>
                    </div>
                  </td>
                  <td>{vendor.user?.name || 'No owner'}</td>
                  <td>{vendor.email || vendor.user?.email || 'N/A'}</td>
                  <td>{vendor.phone || 'N/A'}</td>
                  <td>{renderBadge(vendor.status)}</td>
                  <td>{renderBadge(vendor.isVerified)}</td>
                  <td className="text-center">
                    <Button variant="light" size="sm" className="action-btn view" onClick={() => handleOpenModal(vendor)}>
                      <Eye size={18} />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-5 text-muted">No vendors found matching your filters.</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="text-muted small">Showing {vendors.length} vendors</div>
        <Pagination size="sm" className="mb-0">
          {[...Array(totalPages)].map((_, i) => (
            <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>
              {i + 1}
            </Pagination.Item>
          ))}
        </Pagination>
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
    </Container>
  );
};

export default Vendorlist;
