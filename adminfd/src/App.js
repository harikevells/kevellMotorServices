import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/Dashboard.css';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import DashboardView from './components/dashboard/DashboardView';
import ServiceCreate from './components/Pages/ServiceCreate';
import Ordermanagement from './components/Pages/Ordermanagement';
import Vendorlist from './components/Pages/Vendorlist';
import User from './components/Pages/User';
import Login from './components/Pages/Login';
import Notification from './components/Pages/Notification';
import Addvendor from './components/Pages/Addvendor';
import Reviews from './components/Pages/Reviews';
import Payment from './components/Pages/Payment';
import Tracking from './components/Pages/Tracking';
import SpareParts from './components/Pages/SpareParts';

function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('adminUser');
    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }

    const handlePageChange = (e) => {
      setActivePage(e.detail);
    };

    window.addEventListener('changePage', handlePageChange);
    return () => window.removeEventListener('changePage', handlePageChange);
  }, []);

  const handleLoginSuccess = (userData, token) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminUser');
    setIsAuthenticated(false);
    setUser(null);
    setActivePage('Dashboard');
  };

  const renderContent = () => {
    switch (activePage) {
      case 'Dashboard':
        return <DashboardView />;
      case 'Service Management':
        return <ServiceCreate />;
      case 'Order Management':
        return <Ordermanagement />;
      case 'Vendor Management':
        return <Vendorlist />;
      case 'Add Vendor':
        return <Addvendor />;
      case 'User Management':
        return <User />;
      case 'Notification':
        return <Notification />;
      case 'Reviews & Ratings':
        return <Reviews />;
      case 'Payment':
        return <Payment />;
      case 'Tracking':
        return <Tracking />;
      case 'Spare Parts Management':
        return <SpareParts />;
      case 'Car Management':
      case 'Transactions':
      case 'Content':
      case 'CRM':
      case 'Settings':
      case 'Reports':
      case 'Support':
      case 'Roles':
        return (
          <div className="dashboard-container">
            <div className="card" style={{ padding: '40px', textAlign: 'center', background: 'transparent', border: '1px solid var(--border)' }}>
              <h2 style={{ color: 'var(--gold)', marginBottom: '10px' }}>{activePage}</h2>
              <p style={{ color: 'var(--muted)' }}>This section is currently under development.</p>
            </div>
          </div>
        );
      default:
        return <DashboardView />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="dashboard-wrapper">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout} collapsed={sidebarCollapsed} />
      <Header activePage={activePage} onLogout={handleLogout} onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} collapsed={sidebarCollapsed} />
      <main className="main-content" style={{ marginLeft: sidebarCollapsed ? '80px' : '240px' }}>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
