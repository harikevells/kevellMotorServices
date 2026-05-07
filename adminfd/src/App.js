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

const pageToPathMap = {
  Dashboard: '/dashboard',
  'Service Management': '/service-management',
  'Order Management': '/order-management',
  'Vendor Management': '/vendor-management',
  'Add Vendor': '/add-vendor',
  'User Management': '/user-management',
  Notification: '/notification',
  'Reviews & Ratings': '/reviews',
  Payment: '/payment',
  Tracking: '/tracking',
  'Spare Parts Management': '/spare-parts',
  'Car Management': '/car-management',
  Transactions: '/transactions',
  Content: '/content',
  CRM: '/crm',
  Settings: '/settings',
  Reports: '/reports',
  Support: '/support',
  Roles: '/roles'
};

const pathToPageMap = Object.entries(pageToPathMap).reduce((acc, [page, path]) => {
  acc[path] = page;
  return acc;
}, {});

const normalizePath = (path) => path.replace(/\/+$/, '').toLowerCase() || '/dashboard';

const getPageFromPath = (pathname) => {
  const normalized = normalizePath(pathname);
  return pathToPageMap[normalized] || null;
};

const getPathFromPage = (page) => pageToPathMap[page] || '/dashboard';

function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Restore session on refresh (sessionStorage persists across refreshes)
    const token = sessionStorage.getItem('token');
    const savedUser = sessionStorage.getItem('adminUser');
    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }

    const routePage = getPageFromPath(window.location.pathname);
    if (routePage) {
      setActivePage(routePage);
      sessionStorage.setItem('activePage', routePage);
    } else {
      const savedPage = sessionStorage.getItem('activePage') || 'Dashboard';
      setActivePage(savedPage);
    }

    const handlePageChangeEvent = (e) => {
      const page = e.detail;
      setActivePage(page);
      sessionStorage.setItem('activePage', page);
      window.history.replaceState(null, '', getPathFromPage(page));
    };

    window.addEventListener('changePage', handlePageChangeEvent);
    return () => window.removeEventListener('changePage', handlePageChangeEvent);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const newPath = getPathFromPage(activePage);
      if (normalizePath(window.location.pathname) !== normalizePath(newPath)) {
        window.history.replaceState(null, '', newPath);
      }
      sessionStorage.setItem('activePage', activePage);
    }
  }, [activePage, isAuthenticated]);

  const handleLoginSuccess = (userData, token) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('adminUser');
    sessionStorage.removeItem('activePage');
    setIsAuthenticated(false);
    setUser(null);
    setActivePage('Dashboard');
    window.history.replaceState(null, '', '/dashboard');
  };

  const handleSetPage = (page) => {
    setActivePage(page);
    sessionStorage.setItem('activePage', page);
    window.history.replaceState(null, '', getPathFromPage(page));
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
      <Sidebar activePage={activePage} setActivePage={handleSetPage} onLogout={handleLogout} collapsed={sidebarCollapsed} />
      <Header activePage={activePage} onLogout={handleLogout} onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} collapsed={sidebarCollapsed} />
      <main className="main-content" style={{ marginLeft: sidebarCollapsed ? '80px' : '240px' }}>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
