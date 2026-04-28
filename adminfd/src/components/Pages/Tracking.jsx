import React, { useState, useEffect } from 'react';
import { Row, Col, InputGroup, Form, Badge, Spinner } from 'react-bootstrap';
import { Search, User, MapPin, Phone, Bike, Circle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
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

const userIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #eab308; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

const vendorIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #f97316; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
           </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
});

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        0.5 - Math.cos(dLat)/2 + 
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        (1 - Math.cos(dLon))/2;
    return R * 2 * Math.asin(Math.sqrt(a));
};

const Tracking = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [loading, setLoading] = useState(false);
    const [allVendors, setAllVendors] = useState([]);
    const [routePath, setRoutePath] = useState([]);
    const [etaMinutes, setEtaMinutes] = useState(null);
    const [activeTab, setActiveTab] = useState('live');

    useEffect(() => {
        const fetchRoute = async () => {
            if (selectedVendor && selectedVendor.userLat && selectedVendor.userLng) {
                try {
                    const response = await axios.get(`https://router.project-osrm.org/route/v1/driving/${selectedVendor.lng},${selectedVendor.lat};${selectedVendor.userLng},${selectedVendor.userLat}?overview=full&geometries=geojson`);
                    if (response.data && response.data.routes && response.data.routes.length > 0) {
                        const coords = response.data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
                        setRoutePath(coords);
                        const durationSeconds = response.data.routes[0].duration;
                        setEtaMinutes(Math.round(durationSeconds / 60));
                    }
                } catch (error) {
                    console.error("Failed to fetch route from OSRM", error);
                    // Fallback to straight line
                    setRoutePath([
                        [selectedVendor.lat, selectedVendor.lng],
                        [selectedVendor.userLat, selectedVendor.userLng]
                    ]);
                    const distKm = calculateDistance(selectedVendor.lat, selectedVendor.lng, selectedVendor.userLat, selectedVendor.userLng);
                    setEtaMinutes(Math.round(distKm * 2)); // Assumes 30km/h avg speed fallback
                }
            } else {
                setRoutePath([]);
                setEtaMinutes(null);
            }
        };

        fetchRoute();
    }, [selectedVendor]);

    useEffect(() => {
        const fetchTrackingData = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/api/bookings/admin/all', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.data.success) {
                    const mappedVendors = response.data.data.map(b => ({
                        id: b._id,
                        bookingRef: b.bookingRef,
                        name: b.vendorDetails?.vendorName || b.center?.ownerName || 'Unknown Vendor',
                        role: 'Vendor',
                        status: b.status.replace(/_/g, ' ').toUpperCase(),
                        rawStatus: b.status,
                        lat: b.vendorDetails?.latitude || b.center?.location?.coordinates?.[1] || 0,
                        lng: b.vendorDetails?.longitude || b.center?.location?.coordinates?.[0] || 0,
                        address: b.vendorDetails?.address || b.center?.address?.street || 'Unknown Address',
                        userLat: b.userDetails?.latitude || 0,
                        userLng: b.userDetails?.longitude || 0,
                        userName: b.userDetails?.name || b.user?.name || 'Unknown User',
                        userPhone: b.userDetails?.phone || b.user?.phone || 'N/A'
                    })).filter(v => v.lat !== 0 && v.lng !== 0); // Only keep if vendor has location
                    
                    setAllVendors(mappedVendors);
                }
            } catch (error) {
                console.error("Failed to fetch tracking data", error);
            }
        };
        fetchTrackingData();
    }, []);

    const activeVendorsList = allVendors.filter(v => {
        if (activeTab === 'live') {
            return !['completed', 'cancelled', 'delivered'].includes(v.rawStatus);
        } else {
            return v.rawStatus === 'delivered' || v.rawStatus === 'completed';
        }
    });

    const filteredVendors = activeVendorsList.filter(v => 
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (v.bookingRef && v.bookingRef.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    useEffect(() => {
        if (activeVendorsList.length > 0) {
            setSelectedVendor(activeVendorsList[0]);
        } else {
            setSelectedVendor(null);
        }
    }, [activeTab, allVendors]);

    const handleTrack = (vendor) => {
        setLoading(true);
        setSelectedVendor(vendor);
        setTimeout(() => setLoading(false), 500);
    };

    const distanceKm = selectedVendor && selectedVendor.userLat 
        ? calculateDistance(selectedVendor.lat, selectedVendor.lng, selectedVendor.userLat, selectedVendor.userLng).toFixed(2) 
        : 0;

    return (
        <div className="tracking-page-wrapper">
            <div className="tracking-sidebar">
                <div className="sidebar-header-track">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h3 className="trackers-title">Trackers</h3>
                        <Badge bg={activeTab === 'live' ? "success" : "secondary"} className="online-badge">
                            {activeVendorsList.length} {activeTab === 'live' ? 'Active' : 'Delivered'}
                        </Badge>
                    </div>

                    <div className="custom-tracking-tabs mb-3">
                        <button 
                            className={`custom-tab-btn ${activeTab === 'live' ? 'active-live' : ''}`}
                            onClick={() => setActiveTab('live')}
                        >
                            Live Tracks
                        </button>
                        <button 
                            className={`custom-tab-btn ${activeTab === 'delivered' ? 'active-delivered' : ''}`}
                            onClick={() => setActiveTab('delivered')}
                        >
                            Delivered
                        </button>
                    </div>
                    <div className="search-box-container">
                        <Search size={18} className="search-icon-track" />
                        <Form.Control 
                            type="text" 
                            placeholder="Search vendors or booking ref..." 
                            className="search-input-track"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="vendor-list-container">
                    {filteredVendors.length > 0 ? filteredVendors.map(vendor => (
                        <div 
                            key={vendor.id} 
                            className={`vendor-item-card ${selectedVendor?.id === vendor.id ? 'active' : ''}`}
                            onClick={() => handleTrack(vendor)}
                        >
                            <div className="vendor-avatar">
                                <User size={24} />
                                <div className={`status-dot ${vendor.status === 'PENDING' ? 'offline' : 'online'}`}></div>
                            </div>
                            <div className="vendor-info-track">
                                <div className="vendor-name-row">
                                    <span className="vendor-name">{vendor.name} <small className="text-muted">({vendor.bookingRef})</small></span>
                                    <span className="track-link">Track</span>
                                </div>
                                <div className="vendor-role-status">
                                    {vendor.role} • {vendor.status}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="p-3 text-center text-muted">No active tracking found.</div>
                    )}
                </div>
            </div>

            <div className="tracking-map-area">
                <MapContainer 
                    key={selectedVendor?.id || 'map'}
                    center={selectedVendor ? [selectedVendor.lat, selectedVendor.lng] : [9.9252, 78.1198]} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                    />
                    {selectedVendor && (
                        <>
                            <Marker position={[selectedVendor.lat, selectedVendor.lng]} icon={vendorIcon}>
                                <Popup>
                                    <strong>{selectedVendor.name} (Vendor)</strong><br />
                                    {selectedVendor.address}
                                </Popup>
                            </Marker>
                            
                            {selectedVendor.userLat !== 0 && selectedVendor.userLng !== 0 && (
                                <>
                                    <Marker position={[selectedVendor.userLat, selectedVendor.userLng]} icon={userIcon}>
                                        <Popup>
                                            <strong>{selectedVendor.userName} (Customer)</strong><br />
                                            Booking Ref: {selectedVendor.bookingRef}
                                        </Popup>
                                    </Marker>
                                    <Polyline 
                                        positions={routePath.length > 0 ? routePath : [
                                            [selectedVendor.lat, selectedVendor.lng],
                                            [selectedVendor.userLat, selectedVendor.userLng]
                                        ]} 
                                        color="#3b82f6" 
                                        weight={4}
                                    />
                                </>
                            )}
                        </>
                    )}
                </MapContainer>

                {/* Floating Info Card */}
                {selectedVendor && (
                    <div className="floating-track-card">
                        <div className="card-header-row">
                            <span className="card-title-track">Vendor Tracking</span>
                            <div className="live-track-status">
                                {activeTab === 'live' ? (
                                    <>
                                        <span className="live-label">LIVE TRACK</span>
                                        <span className="status-indicator online">• Active</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="live-label" style={{ backgroundColor: '#6c757d' }}>PAST TRACK</span>
                                        <span className="status-indicator offline">• Delivered</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="tracking-details">
                            <div className="track-detail-item">
                                <div className="detail-dot current"></div>
                                <div className="detail-content">
                                    <div className="detail-label">Current Position (Vendor)</div>
                                    <div className="detail-value">Lat: {selectedVendor.lat.toFixed(4)}, Lng: {selectedVendor.lng.toFixed(4)}</div>
                                </div>
                            </div>
                            <div className="track-detail-item">
                                <div className="detail-dot destination"></div>
                                <div className="detail-content">
                                    <div className="detail-label">Destination (User)</div>
                                    <div className="detail-value">
                                        Lat: {selectedVendor.userLat ? selectedVendor.userLat.toFixed(4) : 'N/A'}, 
                                        Lng: {selectedVendor.userLng ? selectedVendor.userLng.toFixed(4) : 'N/A'}
                                    </div>
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
                                    <span className="user-name-track">{selectedVendor.userName} ({selectedVendor.userPhone})</span>
                                    {selectedVendor.userLat ? (
                                        <div className="d-flex flex-column" style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                                            <span className="user-distance text-muted small">
                                                Distance: <strong>{distanceKm} km</strong>
                                            </span>
                                            {etaMinutes !== null && (
                                                <span className="user-eta text-muted small" style={{ color: '#22c55e' }}>
                                                    ETA: <strong>{etaMinutes} mins</strong>
                                                </span>
                                            )}
                                        </div>
                                    ) : null}
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

