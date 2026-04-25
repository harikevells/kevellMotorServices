import React, { useState, useEffect } from 'react';
import { 
    Container, Table, Button, Form, Modal, Badge, 
    Pagination, InputGroup, Row, Col, Spinner, Card
} from 'react-bootstrap';
import { Search, Eye, Trash, User as UserIcon, Mail, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import './user.css';

const API_BASE_URL = 'http://localhost:5000/api/users';
const rowsPerPage = 6;

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
    try {
      const params = { page: currentPage, limit: rowsPerPage, role: 'user' };
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const response = await axios.get(API_BASE_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (response.data.success) {
        setUsers(response.data.users || []);
        setTotalPages(response.data.pages || 1);
      }
    } catch (error) {
      setFetchError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter]);

  const handleOpenModal = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  return (
    <div className="user-management-container">
      {/* Search and Filters */}
      <div className="search-filter-row">
        <div className="search-input-group">
          <Search size={18} color="#888" />
          <input 
            type="text" 
            placeholder="Search users by name, email or phone"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="filter-select-group">
          <select 
            className="status-filter-select" 
            value={roleFilter} 
            disabled
          >
            <option value="user">User Role</option>
          </select>
        </div>
      </div>

      {fetchError && (
        <div className="text-danger small mb-3">⚠️ {fetchError}</div>
      )}

      {/* Main Table */}
      <div className="user-table-container">
        <table className="custom-user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Gender</th>
              <th>City</th>
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
                  <td>
                    <div className="d-flex flex-column">
                      <span className="fw-bold text-white">{user.name || 'Unnamed'}</span>
                      {/* <small className="text-muted">{user.address?.city || 'No Location'}</small> */}
                    </div>
                  </td>
                  <td>{user.email || 'N/A'}</td>
                  <td>{user.phone || 'N/A'}</td>
                  <td>{user.gender || 'Other'}</td>
                  <td>{user.address?.city || 'N/A'}</td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <div className="action-icons" style={{ justifyContent: 'center' }}>
                      <Eye 
                        size={20} 
                        className="action-icon" 
                        onClick={() => handleOpenModal(user)} 
                      />
                      <Trash size={20} className="action-icon" />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-5 text-muted">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="table-footer">
        <div className="text-muted small">Showing {users.length} users</div>
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
    </div>
  );
};

export default UserPage;
