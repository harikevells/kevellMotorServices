import React from 'react';
import { motion } from 'framer-motion';
import featureRightImg from '../../assets/featuresectionright.png';
import './FeaturesSection.css';

const FeaturesSection = () => {
  const features = [
    { title: 'Real - Time\nMonitoring', desc: '' },
    { title: 'Vehicle\nScheduling', desc: '' },
    { title: 'Platform level\nAnalytics', desc: '' },
    { title: 'Custom vehicle\nservice', desc: '' },
    { title: 'Smart\nNotifications', desc: '' },
    { title: 'Fleet\nManagement', desc: '' }
  ];

  return (
    <motion.section 
      className="features-section"
      initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
      whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: false, amount: 0.2 }}
    >
      <div className="features-container section-padding">
        
        <div className="features-content">
          <div className="section-badge" style={{ backgroundColor: '#333', color: '#fff', padding: '5px 15px', borderRadius: '20px', display: 'inline-block' }}>
            <span style={{ color: '#FF8C00' }}>●</span> Features
          </div>
          <h2 className="section-title">Smart Vehicle Management Platform</h2>
          <p className="features-desc">
            Advanced vehicle service repair, maintenance tracking, and service management solutions for your vehicles.
          </p>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div className="feature-item" key={index}>
                <h5>{feature.title}</h5>
              </div>
            ))}
          </div>
        </div>
        
      </div>
      
      {/* Decorative Right Graphic */}
      <div className="features-graphic">
        <div className="dark-shape"></div>
        <div className="orange-shape"></div>
        <img 
          src={featureRightImg} 
          alt="Sports Car Showcase" 
          className="car-image"
        />
      </div>
    </motion.section>
  );
};

export default FeaturesSection;
