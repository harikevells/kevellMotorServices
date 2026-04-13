import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import '../../styles/Dashboard.css'
import { 
  LayoutDashboard, 
  CarFront, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  FileText, 
  MessageSquare, 
  Settings, 
  PieChart, 
  HelpCircle, 
  ShieldCheck, 
  LogOut,
  Wrench
} from 'lucide-react';

const Sidebar = ({ activePage, setActivePage, onLogout }) => {
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const mainMenuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={16} /> },
        { name: 'Order Management', icon: <CarFront size={16} /> },
        { name: 'Service Management', icon: <Wrench size={16} /> },
        { name: 'Vendor Management', icon: <ShoppingCart size={16} /> },
        { name: 'User Management', icon: <Users size={14} /> },
        // { name: 'Transactions', icon: <DollarSign size={14} /> },
        // { name: 'Content', icon: <FileText size={14} /> },
        // { name: 'CRM', icon: <MessageSquare size={14} /> },
    ];

    const settingsItems = [
        // { name: 'Settings', icon: <Settings size={14} /> },
        // { name: 'Reports', icon: <PieChart size={14} /> },
        // { name: 'Support', icon: <HelpCircle size={14} /> },
        // { name: 'Roles', icon: <ShieldCheck size={14} /> },
    ];

    return (
        <aside className="sidebar">
            <div className="logo-container">
                <div className="logo-icon">
                    <CarFront size={20} fill="#1a0e00" stroke="#1a0e00" />
                </div>
                <span className="logo-text">Kevell Auto Services</span>
            </div>

            <div className="nav-section">
                {/* <p className="section-label">Main Menu</p> */}
                {mainMenuItems.map((item) => (
                    <div 
                        key={item.name}
                        className={`nav-item ${activePage === item.name ? 'active' : ''}`}
                        onClick={() => setActivePage(item.name)}
                    >
                        {item.icon}
                        {item.name}
                    </div>
                ))}
            </div>

            <div className="nav-section" style={{ marginTop: 'auto' }}>
                <p className="section-label">Settings</p>
                {settingsItems.map((item) => (
                    <div 
                        key={item.name}
                        className={`nav-item ${activePage === item.name ? 'active' : ''}`}
                        onClick={() => setActivePage(item.name)}
                    >
                        {item.icon}
                        {item.name}
                    </div>
                ))}
                <div className="nav-item logout" onClick={() => setShowLogoutModal(true)}>
                    <LogOut size={14} />
                    Logout
                </div>
            </div>

            <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered size="sm">
                <div className="p-4 border-0 text-center forms">
                    <h5 className="text-black mb-3">Logout</h5>
                    <p className="small text-muted mb-4">Are you sure you want to logout?</p>
                    <div className="d-flex justify-content-center gap-3">
                        <Button variant="outline-light" size="sm" className="px-3 forms2" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
                        <Button variant="danger" size="sm" className="px-3" onClick={() => { setShowLogoutModal(false); onLogout(); }}>Logout</Button>
                    </div>
                </div>
            </Modal>
        </aside>
    );
};

export default Sidebar;
