import './Sidebar.css';
import { 
  LayoutDashboard, 
  CarFront, 
  Users, 
  ShoppingCart,
  Wrench,
  LogOut
} from 'lucide-react';
import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

const Sidebar = ({ activePage, setActivePage, onLogout, collapsed }) => {
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    
    const mainMenuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Order Management', icon: <ShoppingCart size={20} /> },
        { name: 'Service Management', icon: <Wrench size={20} /> },
        { name: 'Vendor Management', icon: <ShoppingCart size={20} /> },
        { name: 'User Management', icon: <Users size={20} /> },
    ];

    return (
        <aside className={`sidebar-new ${collapsed ? 'collapsed' : ''}`}>
            <div className="nav-list">
                {mainMenuItems.map((item) => (
                    <div 
                        key={item.name}
                        className={`nav-item-new ${activePage === item.name ? 'active' : ''}`}
                        onClick={() => setActivePage(item.name)}
                        title={collapsed ? item.name : ''}
                    >
                        <span className="nav-icon-new">{item.icon}</span>
                        {!collapsed && <span className="nav-text-new">{item.name}</span>}
                    </div>
                ))}
            </div>

            <div className="sidebar-footer">
                <div className="nav-item-new logout-item" onClick={() => setShowLogoutModal(true)} title={collapsed ? 'Logout' : ''}>
                    <LogOut size={20} />
                    {!collapsed && <span className="nav-text-new">Logout</span>}
                </div>
            </div>

            <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered size="sm">
                <div className="p-4 border-0 text-center forms">
                    <h5 className="text-black mb-3 font-weight-bold">Logout</h5>
                    <p className="small text-muted mb-4">Are you sure you want to logout?</p>
                    <div className="d-flex justify-content-center gap-2">
                        <Button variant="outline-dark" size="sm" className="px-4" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
                        <Button variant="danger" size="sm" className="px-4" onClick={() => { setShowLogoutModal(false); onLogout(); }}>Logout</Button>
                    </div>
                </div>
            </Modal>
        </aside>
    );
};

export default Sidebar;
