import { Bell, LogOut, Menu } from 'lucide-react';
import './Header.css';

const Header = ({ activePage, onLogout, onToggleSidebar, collapsed }) => {
    const storedAdmin = typeof window !== 'undefined' ? localStorage.getItem('adminUser') : null;
    const adminData = storedAdmin ? JSON.parse(storedAdmin) : {};
    const adminName = adminData.name || 'Owner';
    const adminRole = adminData.role || 'Admin';

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
                
                <div className="header-icon-group">
                    <div className="header-icon-btn">
                        <Bell size={20} />
                    </div>
                    <div className="header-icon-btn logout-btn" onClick={onLogout} title="Logout">
                        <LogOut size={20} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
