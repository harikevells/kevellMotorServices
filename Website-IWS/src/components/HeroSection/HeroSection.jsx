import React from 'react';
import './HeroSection.css';
import heroVideo from '../../assets/name.mp4';

const HeroSection = () => {
  return (
    <section id="home" className="hero-section">
      <div className="hero-background">
        <video autoPlay loop muted playsInline className="hero-video-bg" src={heroVideo}></video>
        <div className="hero-overlay"></div>
      </div>

      <div className="hero-content-container">
        <div className="hero-badge animate-fade-in-down">
          <span style={{ color: '#FF8C00' }}>●</span> SMART VEHICLE PLATFORM
        </div>

        <h1 className="hero-title animate-fade-in-up">
          Smart Vehicle Service <br /> Management Platform.
        </h1>

        <p className="hero-description animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Manage your auto service business with our digital solutions designed for auto repair shop
          owners, mechanics, and service centers. We provide software that organizes your operations,
          drives sales, increases profits, and allows you to give an excellent customer experience.
        </p>

        <div className="hero-buttons animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <button className="btn btn-primary">Download App</button>
          <button className="btn btn-outline get-started-outline">
            <span className="play-icon">▶</span> Get Started
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
