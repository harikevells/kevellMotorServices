import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';
import logo from "../../assets/logo.png"

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Set the scrolled state immediately on non-home pages so header has background
  const isHomePage = location.pathname === '/';
  const headerClass = `header ${scrolled || !isHomePage ? 'scrolled' : ''}`;

  return (
    <header className={headerClass}>
      <div className="header-container">
        <div className="logo">
          <Link to="/">
            <img src={logo} alt="IWS Logo" className="header-logo-img" />
          </Link>
        </div>
        
        <nav className={`nav-menu ${menuOpen ? 'active' : ''}`}>
          <Link to="/" onClick={() => setMenuOpen(false)} className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="/about" onClick={() => setMenuOpen(false)} className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>About Us</Link>
          <Link to="/services" onClick={() => setMenuOpen(false)} className={`nav-link ${location.pathname === '/services' ? 'active' : ''}`}>Services</Link>
          <Link to="/subscription" onClick={() => setMenuOpen(false)} className={`nav-link ${location.pathname === '/subscription' ? 'active' : ''}`}>Subscription</Link>
          <Link to="/contact" onClick={() => setMenuOpen(false)} className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}>Contact Us</Link>
        </nav>
        
        <div className="header-actions">
          <button className="btn btn-primary get-started-btn">
            <span>+</span> Get Started
          </button>
          <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <div className={`bar ${menuOpen ? 'active' : ''}`}></div>
            <div className={`bar ${menuOpen ? 'active' : ''}`}></div>
            <div className={`bar ${menuOpen ? 'active' : ''}`}></div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
