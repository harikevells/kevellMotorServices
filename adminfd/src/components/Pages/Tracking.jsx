import React, { useState, useEffect } from 'react';
import { Row, Col, InputGroup, Form, Badge, Spinner } from 'react-bootstrap';
import { Search, User, MapPin, Phone, Bike, Circle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Tracking.css';

// Fix for default marker icon in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const Tracking = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [loading, setLoading] = useState(false);

    const vendors = [
        { id: 1, name: 'Vijay', role: 'Vendor', status: 'Offline', lat: 11.0168, lng: 76.9558, address: 'Coimbatore, TN' },
        { id: 2, name: 'Rohit', role: 'Vendor', status: 'Offline', lat: 9.9252, lng: 78.1198, address: 'Madurai, TN' },
        { id: 3, name: 'Ravi', role: 'Vendor', status: 'Offline', lat: 9.9352, lng: 78.1298, address: 'Trichy, TN' },
        { id: 4, name: 'Suresh', role: 'Vendor', status: 'Offline', lat: 13.0827, lng: 80.2707, address: 'Chennai, TN' },
    ];

    const filteredVendors = vendors.filter(v => 
        v.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        if (vendors.length > 0) {
            setSelectedVendor(vendors[0]);
        }
    }, []);

    const handleTrack = (vendor) => {
        setLoading(true);
        setSelectedVendor(vendor);
        setTimeout(() => setLoading(false), 500);
    };

    return (
        <div className="tracking-page-wrapper">
            <div className="tracking-sidebar">
                <div className="sidebar-header-track">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h3 className="trackers-title">Trackers</h3>
                        <Badge bg="success" className="online-badge">0 Online</Badge>
                    </div>
                    <div className="search-box-container">
                        <Search size={18} className="search-icon-track" />
                        <Form.Control 
                            type="text" 
                            placeholder="Search vendors..." 
                            className="search-input-track"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="vendor-list-container">
                    {filteredVendors.map(vendor => (
                        <div 
                            key={vendor.id} 
                            className={`vendor-item-card ${selectedVendor?.id === vendor.id ? 'active' : ''}`}
                            onClick={() => handleTrack(vendor)}
                        >
                            <div className="vendor-avatar">
                                <User size={24} />
                                <div className="status-dot offline"></div>
                            </div>
                            <div className="vendor-info-track">
                                <div className="vendor-name-row">
                                    <span className="vendor-name">{vendor.name}</span>
                                    <span className="track-link">Track</span>
                                </div>
                                <div className="vendor-role-status">
                                    {vendor.role} • {vendor.status}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="tracking-map-area">
                <MapContainer 
                    center={[9.9252, 78.1198]} 
                    zoom={12} 
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                    />
                    {selectedVendor && (
                        <Marker position={[selectedVendor.lat, selectedVendor.lng]}>
                            <Popup>
                                <strong>{selectedVendor.name}</strong><br />
                                {selectedVendor.address}
                            </Popup>
                        </Marker>
                    )}
                </MapContainer>

                {/* Floating Info Card */}
                {selectedVendor && (
                    <div className="floating-track-card">
                        <div className="card-header-row">
                            <span className="card-title-track">Vendor Tracking</span>
                            <div className="live-track-status">
                                <span className="live-label">LIVE TRACK</span>
                                <span className="status-indicator offline">• Offline</span>
                            </div>
                        </div>

                        <div className="tracking-details">
                            <div className="track-detail-item">
                                <div className="detail-dot current"></div>
                                <div className="detail-content">
                                    <div className="detail-label">Current Position</div>
                                    <div className="detail-value">Lat: {selectedVendor.lat.toFixed(4)}, Lng: {selectedVendor.lng.toFixed(4)}</div>
                                </div>
                            </div>
                            <div className="track-detail-item">
                                <div className="detail-dot destination"></div>
                                <div className="detail-content">
                                    <div className="detail-label">Destination</div>
                                    <div className="detail-value">N/A</div>
                                </div>
                            </div>
                        </div>

                        <div className="delivery-info">
                            <div className="delivering-label">DELIVERING TO</div>
                            <div className="delivering-row">
                                <div className="user-icon-bg">
                                    <User size={20} color="#fff" />
                                </div>
                                <div className="delivering-to-info">
                                    <span className="user-name-track">N/A (N/A)</span>
                                </div>
                                <div className="delivery-actions">
                                    <div className="action-circle"><Phone size={14} /></div>
                                    <div className="action-circle"><Bike size={14} /></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tracking;
