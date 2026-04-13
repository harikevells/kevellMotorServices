import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Modal, Badge, Pagination, InputGroup, Row, Col, Spinner, Card } from 'react-bootstrap';
import { Search, Eye, User as UserIcon, Mail, MapPin } from 'lucide-react';
import axios from 'axios';
import './user.css';

const API_BASE_URL = 'http://localhost:5000/api/users';
const rowsPerPage = 20;

const UserPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('user');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fetchError, setFetchError] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
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
      params.role = 'user';

      const response = await axios.get(API_BASE_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (response.data.success) {
        setUsers(response.data.users || []);
        setTotalPages(response.data.pages || 1);
      } else {
        setFetchError('Unable to load users.');
      }
    } catch (error) {
      console.error('User fetch error:', error);
      setFetchError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter]);

  const resetFilters = () => {
    setSearchTerm('');
    setRoleFilter('user');
    setCurrentPage(1);
  };

  const handleOpenModal = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  return (
    <Container fluid className="user-management-container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">User Management</h3>
        <div className="text-muted small">Total Users: {users.length}</div>
      </div>

      <Card className="management-card mb-4 border-0">
        <Row className="g-3 align-items-center">
          <Col md={5}>
            <InputGroup>
              <InputGroup.Text className="bg-transparent border-end-0 border-gray">
                <Search size={18} className="text-gold" />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search users by name, email or phone"
                className="filter-input border-start-0"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </InputGroup>
          </Col>
          <Col md={4}>
            <Form.Select className="filter-select" value={roleFilter} disabled>
              <option value="user">User</option>
            </Form.Select>
          </Col>
          <Col md={3}>
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
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Registered</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-5">
                  <Spinner animation="border" variant="warning" />
                </td>
              </tr>
            ) : users.length > 0 ? (
              users.map((user, index) => (
                <tr key={user._id || index}>
                  <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                  <td className="text-start">
                    <div className="d-flex flex-column align-items-start">
                      <span className="fw-bold text-white">{user.name || 'Unnamed'}</span>
                      <small className="text-muted">{user.address?.city || user.role || 'No extra info'}</small>
                    </div>
                  </td>
                  <td>{user.email || 'N/A'}</td>
                  <td>{user.phone || 'N/A'}</td>
                  <td>
                    <Badge bg="dark" className="border border-secondary text-capitalize">
                      {user.role || 'user'}
                    </Badge>
                  </td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td className="text-center">
                    <Button variant="light" size="sm" className="action-btn view" onClick={() => handleOpenModal(user)}>
                      <Eye size={18} />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-5 text-muted">No users found matching your filters.</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="text-muted small">Showing {users.length} users</div>
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
          <Modal.Title className="text-gold">User Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white p-4">
          {selectedUser && (
            <Row className="g-4">
              <Col md={6}>
                <div className="detail-section h-100">
                  <h6 className="section-title"><UserIcon size={16} /> Personal Info</h6>
                  <p><strong>Name:</strong> {selectedUser.name}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Phone:</strong> {selectedUser.phone}</p>
                </div>
              </Col>
              <Col md={6}>
                <div className="detail-section h-100">
                  <h6 className="section-title"><Mail size={16} /> Account</h6>
                  <p><strong>Role:</strong> {selectedUser.role}</p>
                  <p><strong>Registered:</strong> {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'}</p>
                  <p><strong>Status:</strong> <Badge bg="secondary" pill>{selectedUser.status || 'active'}</Badge></p>
                </div>
              </Col>
              <Col md={12}>
                <div className="detail-section">
                  <h6 className="section-title"><MapPin size={16} /> Address</h6>
                  <p><strong>City:</strong> {selectedUser.address?.city || 'N/A'}</p>
                  <p><strong>State:</strong> {selectedUser.address?.state || 'N/A'}</p>
                  <p><strong>Pincode:</strong> {selectedUser.address?.pincode || 'N/A'}</p>
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

export default UserPage;
