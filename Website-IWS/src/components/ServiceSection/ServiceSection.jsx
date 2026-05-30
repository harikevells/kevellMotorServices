import React from 'react';
import { motion } from 'framer-motion';
import './ServiceSection.css';

const ServiceSection = () => {
  const steps = [
    {
      number: '01',
      title: 'Vehicle Diagnostics',
      desc: 'Advanced vehicle diagnostics with real-time monitoring and performance analysis.'
    },
    {
      number: '02',
      title: 'Service Booking Management',
      desc: 'Easy appointment scheduling and service management for customers and workshops.'
    },
    {
      number: '03',
      title: 'Maintenance Tracking',
      desc: 'Track complete maintenance history, service reminders, and repair records.'
    },
    {
      number: '04',
      title: 'Fleet Management',
      desc: 'Manage multiple vehicles efficiently with centralized dashboards and analytics.'
    }
  ];

  return (
    <motion.section 
      id="services" 
      className="service-section section-padding"
      initial={{ opacity: 0, x: 100 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: false, amount: 0.2 }}
    >
      <div className="service-container">
        
        <div className="service-info">
          <div className="section-badge" style={{ backgroundColor: '#333', color: '#fff',width:'100px', padding: '5px 15px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <span className="service-orange-dot" style={{ margin: 0 }}></span> Services
          </div>
          <h2 className="section-title">Smart Vehicle<br/>Service Process</h2>
          <p className="service-desc">
            Manage vehicle maintenance easily with our smart service platform, real-time tracking, and seamless monitoring solutions.
          </p>
        </div>
        
        <div className="service-steps">
          {steps.map((step, index) => (
            <div className="step-card" key={index}>
              <div className="step-header">
                <span className="step-number">{step.number}</span>
                <h4 className="step-title">{step.title}</h4>
              </div>
              <p className="step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
        
      </div>
    </motion.section>
  );
};

export default ServiceSection;
