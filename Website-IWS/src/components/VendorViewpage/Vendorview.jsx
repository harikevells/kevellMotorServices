import React from 'react';
import { motion } from 'framer-motion';
import './Vendorview.css';
import vendorViewLeft from '../../assets/vendor.svg';

const Vendorview = () => {
  const listItems = [
    "Real-Time Service Monitoring",
    "Smart Booking Management",
    "Vehicle Diagnostics Tracking",
    "Customer & Fleet Management",
    "Performance Analytics Dashboard",
    "Automated Service Notifications"
  ];

  return (
    <section className="vendor-view-section section-padding">
      <div className="vendor-view-container">
        
        {/* Header Section */}
        <div className="vendor-view-header">
          <motion.h2 
            className="vendor-view-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: false, amount: 0.2 }}
          >
            Smart Vehicle Management Dashboard
          </motion.h2>
          <motion.p 
            className="vendor-view-subtitle"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: false, amount: 0.2 }}
          >
            Manage vehicle services, maintenance tracking, bookings, and real-time<br className="hide-mobile" />
            monitoring through one powerful and easy-to-use dashboard platform.
          </motion.p>
        </div>

        {/* Content Section */}
        <div className="vendor-view-content">
          
          {/* Left: Image */}
          <motion.div 
            className="vendor-view-image-wrapper"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false, amount: 0.2 }}
          >
            <img src={vendorViewLeft} alt="Dashboard Interface" className="vendor-view-image" />
            <div className="vendor-view-glow"></div>
          </motion.div>
          
          {/* Right: List */}
          <div className="vendor-view-list-container">
            <ul className="vendor-view-list">
              {listItems.map((item, index) => (
                <motion.li 
                  key={index} 
                  className="vendor-view-list-item"
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + (index * 0.1) }}
                  viewport={{ once: false, amount: 0.2 }}
                >
                  <div className="custom-list-icon">
                    <span className="dot"></span>
                    <span className="line"></span>
                  </div>
                  <span className="item-text">{item}</span>
                </motion.li>
              ))}
            </ul>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default Vendorview;
