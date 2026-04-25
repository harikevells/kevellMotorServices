import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Trash2, CheckCircle, Info, FileText } from 'lucide-react';
import './Notification.css';

const Notification = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_URL = 'http://localhost:5000/api/notifications';
    const token = localStorage.getItem('token');

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setNotifications(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (id) => {
        try {
            await axios.put(`${API_URL}/mark-read/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => 
                n._id === id ? { ...n, isRead: true } : n
            ));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleRemove = async (id) => {
        try {
            await axios.delete(`${API_URL}/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.filter(n => n._id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await axios.put(`${API_URL}/mark-all-read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };


    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    if (loading && notifications.length === 0) {
        return (
            <div className="notification-page">
                <div className="loading-spinner">Loading notifications...</div>
            </div>
        );
    }

    return (
        <div className="notification-page">
            <div className="notification-container">
                <div className="notification-header">
                
                    {notifications.some(n => !n.isRead) && (
                        <button className="mark-all-btn" onClick={handleMarkAllRead}>
                            Mark All as Read
                        </button>
                    )}
                </div>

                <div className="notification-list">
                    {notifications.length > 0 ? (
                        notifications.map((notif) => (
                            <div key={notif._id} className={`notification-card ${!notif.isRead ? 'unread' : ''}`}>
                                <div className="notification-icon-wrapper">
                                    {notif.type === 'booking' || notif.type === 'registration' ? <FileText size={20} /> : <Info size={20} />}
                                </div>
                                <div className="notification-content">
                                    <div className="notification-card-header">
                                        <h3 className="notification-card-title">{notif.title}</h3>
                                    </div>
                                    <p className="notification-card-message">{notif.message}</p>
                                    <span className="notification-card-time">{formatDate(notif.createdAt)}</span>
                                </div>
                                <div className="notification-actions">
                                    {!notif.isRead && (
                                        <button 
                                            className="action-btn btn-read" 
                                            onClick={() => handleMarkAsRead(notif._id)}
                                        >
                                            Marked as Read
                                        </button>
                                    )}
                                    <button 
                                        className="action-btn btn-remove" 
                                        onClick={() => handleRemove(notif._id)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-notifications">
                            <div className="empty-icon">
                                <Bell size={64} />
                            </div>
                            <p>No notifications found.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Notification;
