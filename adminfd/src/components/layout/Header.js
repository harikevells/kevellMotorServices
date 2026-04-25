import React, { useState, useEffect, useRef } from 'react';
import { Bell, LogOut, Menu, Info, CheckCircle, Trash2, FileText } from 'lucide-react';
import axios from 'axios';
import './Header.css';

const Header = ({ activePage, onLogout, onToggleSidebar, collapsed }) => {
    const storedAdmin = typeof window !== 'undefined' ? localStorage.getItem('adminUser') : null;
    const adminData = storedAdmin ? JSON.parse(storedAdmin) : {};
    const adminName = adminData.name || 'Owner';
    const adminRole = adminData.role || 'Admin';

    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    const API_URL = 'http://localhost:5000/api/notifications';
    const token = localStorage.getItem('token');

    const fetchNotifications = async () => {
        if (!token) return;
        try {
            const response = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setNotifications(response.data.data.slice(0, 5)); // Only show last 5 in dropdown
                setUnreadCount(response.data.data.filter(n => !n.isRead).length);
            }
        } catch (error) {
            console.error('Error fetching notifications for header:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id, e) => {
        e.stopPropagation();
        try {
            await axios.put(`${API_URL}/mark-read/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => 
                n._id === id ? { ...n, isRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    return (
        <header className="header-new" style={{ left: collapsed ? '80px' : '240px', width: collapsed ? 'calc(100% - 80px)' : 'calc(100% - 240px)' }}>
            <div className="header-left">
                <button 
                    type="button" 
                    className="menu-toggle-btn" 
                    onClick={(e) => { e.preventDefault(); onToggleSidebar(); }}
                >
                    <Menu size={20} />
                </button>
                <h1 className="header-title">{activePage || 'DashBoard'}</h1>
            </div>
            
            <div className="header-right">
                <div className="user-profile">
                    <div className="avatar-small">
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=f28b2c&color=fff`}
                            alt={adminName}
                        />
                    </div>
                    <span className="user-role-text">{adminRole}</span>
                </div>
                
                <div className="header-icon-group" ref={dropdownRef}>
                    <div className="header-icon-btn notification-icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                    </div>

                    {showNotifications && (
                        <div className="notification-dropdown">
                            <div className="dropdown-header">
                                <span>Notifications</span>
                                <span className="see-all" onClick={() => { setShowNotifications(false); window.dispatchEvent(new CustomEvent('changePage', { detail: 'Notification' })); }}>See All</span>
                            </div>
                            <div className="dropdown-content">
                                {notifications.length > 0 ? (
                                    notifications.map(notif => (
                                        <div key={notif._id} className={`dropdown-item ${!notif.isRead ? 'unread' : ''}`}>
                                            <div className="dropdown-item-icon">
                                                {notif.type === 'booking' || notif.type === 'registration' ? <FileText size={14} /> : <Info size={14} />}
                                            </div>
                                            <div className="dropdown-item-text">
                                                <p className="notif-title">{notif.title}</p>
                                                <p className="notif-msg">{notif.message.substring(0, 40)}...</p>
                                            </div>
                                            {!notif.isRead && (
                                                <div className="mark-read-small" onClick={(e) => handleMarkAsRead(notif._id, e)}>
                                                    <CheckCircle size={14} />
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="dropdown-empty">No new notifications</div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="header-icon-btn logout-btn" onClick={onLogout} title="Logout">
                        <LogOut size={20} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
