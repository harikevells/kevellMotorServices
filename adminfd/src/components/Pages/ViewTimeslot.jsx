import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Badge, Spinner } from 'react-bootstrap';
import { User, Calendar, Clock, Store, Users, MapPin, Search } from 'lucide-react';
import './ViewTimeslot.css';

const ViewTimeslot = () => {
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [vendorSlots, setVendorSlots] = useState({});
  const [loadingSlots, setLoadingSlots] = useState({});
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoadingVendors(true);
      const token = sessionStorage.getItem('token');
      // Passing limit=1000 to get all vendors
      const response = await axios.get('http://localhost:5000/api/admin/vendors?limit=1000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setVendors(response.data.vendors);
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Failed to load vendors. Please try again later.');
    } finally {
      setLoadingVendors(false);
    }
  };

  // Fetch slots automatically when vendors are loaded
  useEffect(() => {
    if (vendors.length > 0) {
      vendors.forEach(vendor => {
        const lookupId = vendor.user?._id || vendor._id;
        // Don't refetch if already fetched or loading
        if (!vendorSlots[lookupId] && !loadingSlots[lookupId]) {
          fetchSlotsForVendor(lookupId);
        }
      });
    }
  }, [vendors]);

  const fetchSlotsForVendor = async (vendorId) => {
    try {
      setLoadingSlots(prev => ({ ...prev, [vendorId]: true }));
      const response = await axios.get(`http://localhost:5000/api/slots/${vendorId}?all=true`);
      if (response.data.success) {
        setVendorSlots(prev => ({ ...prev, [vendorId]: response.data.data }));
      }
    } catch (err) {
      console.error(`Error fetching slots for ${vendorId}:`, err);
      setVendorSlots(prev => ({ ...prev, [vendorId]: [] }));
    } finally {
      setLoadingSlots(prev => ({ ...prev, [vendorId]: false }));
    }
  };

  const getDayLabel = (dateStr) => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(dateStr);
    return daysOfWeek[d.getDay()].substring(0, 3);
  };

  const filteredVendors = useMemo(() => {
    return vendors.filter(vendor => {
      const matchSearch = (vendor.shopName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (vendor.user?.name || vendor.ownerName || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [vendors, searchTerm]);

  return (
    <div className="view-timeslot-container">
      {/* Top Filter Bar instead of text header */}
      <div className="timeslot-filter-bar mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3 flex-grow-1" style={{ maxWidth: '600px' }}>
          <div className="search-input-wrapper flex-grow-1 position-relative">
            <Search size={18} className="search-icon position-absolute top-50 translate-middle-y ms-3 text-muted" />
            <input 
              type="text" 
              className="form-control ps-5 rounded-pill border-0 shadow-sm" 
              placeholder="Search by shop or owner name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ height: '45px' }}
            />
          </div>
          <div className="date-filter-wrapper position-relative shadow-sm rounded-pill bg-white">
            <input 
              type="date" 
              className="form-control rounded-pill pe-3 ps-3 border-0" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{ height: '45px', cursor: 'pointer' }}
            />
          </div>
        </div>
        <div className="stats-badge shadow-sm">
          <Users size={20} className="stats-icon" />
          <div className="stats-info">
            <span className="stats-value">{filteredVendors.length}</span>
            <span className="stats-label">Total Vendors</span>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger shadow-sm border-0">{error}</div>}

      <div className="flat-vendors-list">
        {loadingVendors ? (
          <div className="d-flex justify-content-center align-items-center py-5 shadow-sm bg-white rounded-4">
            <Spinner animation="border" variant="primary" />
            <span className="ms-3 text-muted">Loading Vendors...</span>
          </div>
        ) : filteredVendors.length > 0 ? (
          filteredVendors.map((vendor) => {
            const lookupId = vendor.user?._id || vendor._id;
            
            // Filter slots for this vendor based on selected date
            const vendorAllSlots = vendorSlots[lookupId] || [];
            const displaySlots = filterDate 
              ? vendorAllSlots.filter(slot => slot.date === filterDate) 
              : vendorAllSlots;
            
            // Use profilePicture, fallback to shopImage or user's profile image
            let imageUrl = vendor.profilePicture || vendor.shopImage || vendor.user?.profileImage;
            if (imageUrl && !imageUrl.startsWith('http')) {
              // Ensure we have a leading slash before appending
              const slash = imageUrl.startsWith('/') ? '' : '/';
              imageUrl = `http://localhost:5000${slash}${imageUrl}`;
            }

            return (
              <div key={vendor._id} className="vendor-flat-card mb-4 shadow-sm bg-white rounded-4 overflow-hidden border-0">
                <div className="vendor-flat-header d-flex align-items-center p-3 p-md-3 border-bottom bg-light bg-opacity-50">
                  <div className="vendor-image-wrapper me-3 me-md-4 rounded-circle overflow-hidden bg-white d-flex justify-content-center align-items-center shadow-sm" style={{ width: '80px', height: '80px', flexShrink: 0 }}>
                    {imageUrl ? (
                      <img src={imageUrl} alt={vendor.shopName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={32} className="text-muted" />
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <h5 className="mb-2 fw-bold text-dark">{vendor.shopName || 'Unnamed Shop'}</h5>
                    <div className="text-muted d-flex align-items-center flex-wrap gap-3 small">
                      <span className="d-flex align-items-center gap-1"><User size={14} /> {vendor.user?.name || vendor.ownerName || 'N/A'}</span>
                      <span className="d-flex align-items-center gap-1"><MapPin size={14} /> {vendor.address?.city || 'No Location'}</span>
                    </div>
                  </div>
                  <Badge bg="white" text="dark" className="px-3 py-2 rounded-pill shadow-sm border ms-3">
                    ID: {vendor._id.slice(-6).toUpperCase()}
                  </Badge>
                </div>
                
                <div className="vendor-flat-body p-3 p-md-4">
                  <div className="d-flex align-items-center gap-2 mb-3 text-muted fw-medium" style={{ fontSize: '14px' }}>
                    <Calendar size={16} /> 
                    <span>Scheduled Slots {filterDate && <span className="text-primary fw-bold">({filterDate})</span>}</span>
                  </div>

                  {loadingSlots[lookupId] ? (
                    <div className="d-flex align-items-center py-3">
                      <Spinner animation="border" size="sm" variant="primary" />
                      <span className="ms-2 text-muted small">Fetching slots...</span>
                    </div>
                  ) : displaySlots.length > 0 ? (
                    <div className="horizontal-slots-container pb-2">
                      {displaySlots.map((slot) => (
                        <div key={slot._id} className={`flat-slot-card ${slot.isActive ? 'active' : 'inactive'}`}>
                          <div className="slot-date-row d-flex justify-content-between align-items-center mb-3">
                            <span className="badge bg-light text-secondary border px-2 py-1">{slot.date}</span>
                            <span className="badge bg-primary bg-opacity-10 text-primary px-2 py-1 border border-primary border-opacity-25">{getDayLabel(slot.date)}</span>
                          </div>
                          <div className="slot-time-val fw-bold text-dark text-center mb-3" style={{ fontSize: '15px' }}>
                            {slot.time}
                          </div>
                          <div className="slot-meta mt-auto pt-3 border-top d-flex justify-content-between text-muted" style={{ fontSize: '13px' }}>
                            <span className="d-flex flex-column align-items-center">
                               <small className="opacity-75" style={{ fontSize: '10px' }}>CAPACITY</small>
                               <strong className="text-dark">{slot.maxCapacity}</strong>
                            </span>
                            <span className="d-flex flex-column align-items-center">
                               <small className="opacity-75" style={{ fontSize: '10px' }}>BOOKED</small>
                               <strong className={slot.bookedCount >= slot.maxCapacity ? 'text-danger' : 'text-success'}>
                                 {slot.bookedCount || 0}
                               </strong>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted small py-4 d-flex flex-column justify-content-center align-items-center bg-light bg-opacity-50 rounded-3 border border-dashed">
                      <Clock size={32} className="mb-2 opacity-25" /> 
                      {filterDate ? `No slots available on ${filterDate}.` : 'No active time slots found for this vendor.'}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-5 shadow-sm bg-white rounded-4 border-0">
            <h5 className="text-muted fw-bold mb-2">No Vendors Found</h5>
            <p className="text-muted small">Try adjusting your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewTimeslot;
