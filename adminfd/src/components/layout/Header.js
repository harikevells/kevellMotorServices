import React from 'react';
import { Bell, LogOut } from 'lucide-react';

const Header = () => {
    const storedAdmin = typeof window !== 'undefined' ? localStorage.getItem('adminUser') : null;
    const adminData = storedAdmin ? JSON.parse(storedAdmin) : {};
    const adminName = adminData.name || adminData.username || 'Admin';
    const adminRole = adminData.role || 'Super Admin';

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('adminUser');
        window.location.reload();
    };

    return (
        <header>
            <div className="header-left">
                {/* <h1>Dashboard</h1> */}
            </div>
            <div className="header-right">
                <div className="icon-btn">
                    <Bell size={18} />
                </div>
                <div className="profile-section">
                    <div className="avatar">
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=2a2d35&color=fff`}
                            alt={adminName}
                        />
                    </div>
                    <div className="profile-info">
                        <span className="profile-name">{adminName}</span>
                        <span className="profile-role">{adminRole}</span>
                    </div>
                </div>
                <div className="icon-btn logout-btn" onClick={handleLogout} title="Logout">
                    <LogOut size={18} />
                </div>
            </div>
        </header>
    );
};

export default Header;
