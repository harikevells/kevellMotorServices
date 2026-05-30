import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './AboutSection.css';
import ad1 from '../../assets/Ab1.png'
import ad2 from '../../assets/Ab2.png'


const AboutSection = () => {
  const navigate = useNavigate();

  return (
    <motion.section 
      id="about" 
      className="about-section section-padding"
      initial={{ opacity: 0, x: -100 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: false, amount: 0.2 }}
    >
      <div className="about-container">
        
        <div className="about-images">
          <div className="image-wrapper img-1">
            <img src={ad1} alt="Luxury Car Front" />
          </div>
          <div className="image-wrapper img-2">
            <img src={ad2} alt="Luxury Car Side" />
          </div>
        </div>
        
        <div className="about-content">
          <div className="section-badge">About Us</div>
          <h2 className="section-title">Smart vehicle service solutions<br/>For Modern Mobility</h2>
          
          <p className="about-text">
            Comprehensive vehicle service management solutions for maintenance tracking, diagnostics, and real-time monitoring for better operational efficiency.
          </p>
          
          <ul className="about-features">
            <li>
              <span className="check-icon">✓</span>
              <div>
                <h4>1. Advanced Vehicle maintenance</h4>
                <p>Focuses on modern vehicle systems, diagnostics, and repairs for optimal performance and safety.</p>
              </div>
            </li>
            <li>
              <span className="check-icon">✓</span>
              <div>
                <h4>2. Diagnostic & Repair Services</h4>
                <p>Accurate fault detection and advanced repair solutions to keep vehicles running at their best.</p>
              </div>
            </li>
            <li>
              <span className="check-icon">✓</span>
              <div>
                <h4>3. Convenient Online Booking</h4>
                <p>Easily schedule service appointments online for a hassle-free and quick maintenance experience.</p>
              </div>
            </li>
          </ul>
          
          <button className="btn btn-primary mt-30" onClick={() => navigate('/about')}>
            <span>➜</span> Know More
          </button>
        </div>
        
      </div>
    </motion.section>
  );
};

export default AboutSection;
