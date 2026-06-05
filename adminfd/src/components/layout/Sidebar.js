import './Sidebar.css';
import {
    LayoutDashboard,
    Users,
    ShoppingCart,
    Wrench,
    LogOut,
    Star,
    CreditCard,
    Map,
    Clock,
    ChevronDown,
    Wallet,
    Tag
} from 'lucide-react';
import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import fullLogo from '../../assets/logo.png';
import smallLogo from '../../assets/smallLogo.png';
import logoPdf from '../../assets/logopdf.png';

const Sidebar = ({ activePage, setActivePage, onLogout, collapsed }) => {
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [openMenus, setOpenMenus] = useState({});

    const toggleMenu = (menuName) => {
        setOpenMenus(prev => ({ ...prev, [menuName]: !prev[menuName] }));
    };

    const storedUser = typeof window !== 'undefined' ? sessionStorage.getItem('adminUser') : null;
    const userData = storedUser ? JSON.parse(storedUser) : {};
    const userRole = userData.role || 'admin';

    const mainMenuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Order Management', icon: <ShoppingCart size={20} /> },
        // Only show Service and Spare Parts for Admin
        ...(userRole === 'admin' ? [
            { name: 'Service Management', icon: <Wrench size={20} /> },
            { name: 'Spare Parts Management', icon: <Wrench size={20} /> },
            { name: 'Subscription Management', label: 'Subscription', icon: <CreditCard size={20} /> },
            { name: 'Offer Management', label: 'Offers', icon: <Tag size={20} /> },
            {
                name: 'Vendor Dropdown',
                label: 'Vendor Portal',
                icon: <Users size={20} />,
                subItems: [
                    { name: 'Vendor Management', label: 'Vendor', icon: <Users size={20} /> },
                    { name: 'Vendor Slot', label: 'Vendor Slot', icon: <Clock size={20} /> }
                ]
            }
        ] : []),
        { name: 'User Management', icon: <Users size={20} /> },
        ...(userRole !== 'admin' ? [
            { name: 'Spare Parts Shop', icon: <ShoppingCart size={20} /> }
        ] : []),
        { name: 'Reviews & Ratings', icon: <Star size={20} /> },
        {
            name: 'Payment Management',
            label: 'Revenue Control',
            icon: <CreditCard size={20} />,
            subItems: [
                { name: 'Payment', label: 'Payment', icon: <CreditCard size={20} /> },
                { name: 'Wallet', label: 'Wallet', icon: <Wallet size={20} /> }
            ]
        },
        { name: 'Tracking', icon: <Map size={20} /> },
        // Only show for Vendor
        ...(userRole === 'vendor' ? [
            { name: 'Time Slot', icon: <Clock size={20} /> },
            { name: 'Challen Bill', icon: <CreditCard size={20} /> }
        ] : []),
    ];

    return (
        <aside className={`sidebar-new ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-logo-container">
                <img
                    src={collapsed ? smallLogo : fullLogo}
                    alt="Logo"
                    className={collapsed ? 'sidebar-logo-small' : 'sidebar-logo-full'}
                />
            </div>
            <div className="nav-list">
                {mainMenuItems.map((item) => (
                    <React.Fragment key={item.name}>
                        <div
                            className={`nav-item-new ${(activePage === item.name || (item.subItems && item.subItems.some(sub => sub.name === activePage))) ? 'active' : ''}`}
                            onClick={() => {
                                if (item.subItems) {
                                    toggleMenu(item.name);
                                } else {
                                    setActivePage(item.name);
                                }
                            }}
                            title={collapsed ? (item.label || item.name) : ''}
                        >
                            <span className="nav-icon-new">{item.icon}</span>
                            {!collapsed && <span className="nav-text-new">{item.label || item.name}</span>}
                            {item.subItems && !collapsed && (
                                <ChevronDown
                                    size={16}
                                    style={{ marginLeft: 'auto', transition: 'transform 0.3s', transform: openMenus[item.name] ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                />
                            )}
                        </div>
                        {item.subItems && openMenus[item.name] && !collapsed && (
                            <div className="submenu-list" style={{ paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '-4px', marginBottom: '8px' }}>
                                {item.subItems.map(subItem => (
                                    <div
                                        key={subItem.name}
                                        className={`nav-item-new submenu-item ${activePage === subItem.name ? 'active' : ''}`}
                                        onClick={() => setActivePage(subItem.name)}
                                        title={collapsed ? (subItem.label || subItem.name) : ''}
                                        style={{ fontSize: '13px', padding: '8px 12px' }}
                                    >
                                        <span className="nav-icon-new">{subItem.icon}</span>
                                        <span className="nav-text-new">{subItem.label || subItem.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </React.Fragment>
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
                    <img src={logoPdf} alt="Logo" className="mb-3 modal-logo" style={{ maxWidth: '150px', width: '100%' }} />
                    <h5 className="text-black mb-3 font-weight-bold">Logout</h5>
                    <p className="small text-muted mb-4">Are you sure you want to logout?</p>
                    <div className="d-flex justify-content-center gap-2">
                        <Button style={{ width: '100%' }} variant="outline-dark" size="sm" className="px-4" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
                        <Button style={{ width: '100%' }} variant="danger" size="sm" className="px-4" onClick={() => { setShowLogoutModal(false); onLogout(); }}>Logout</Button>
                    </div>
                </div>
            </Modal>
        </aside>
    );
};

export default Sidebar;
