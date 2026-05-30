import React from 'react';
import { motion } from 'framer-motion';
import { FaTools, FaBolt, FaStopCircle, FaCogs } from 'react-icons/fa';
import { GiSteeringWheel, GiCarWheel } from 'react-icons/gi';
import './Aboutone.css';
import about from '../../assets/about.png';
import Aboutsec from './Aboutsec';
import Aboutthird from './Aboutthird';
import Aboutfour from './Aboutfour';

const Aboutone = () => {
  const services = [
    { title: 'Periodic Service', icon: <FaTools color="#FD8A1F" /> },
    { title: 'Battery Service', icon: <FaBolt color="#FD8A1F" /> },
    { title: 'Break Check', icon: <FaStopCircle color="#FD8A1F" /> },
    { title: 'Steering', icon: <GiSteeringWheel color="#FD8A1F" /> },
    { title: 'Tire Repair', icon: <GiCarWheel color="#FD8A1F" /> },
    { title: 'Engine Replace', icon: <FaCogs color="#FD8A1F" /> }
  ];

  return (
    <div className="aboutone-page">
      <motion.div 
        className="aboutone-top section-padding"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="aboutone-container">
          <div className="aboutone-content">
            <span className="orange-accent">About Us</span>
            <h1 className="aboutone-title">Smart Vehicle<br/>Service Made Simple</h1>
            
            <p className="aboutone-desc">
              IWS provides advanced vehicle service management solutions for workshops, service centers, and fleet operators through smart web and mobile platforms.
            </p>

            <div className="progress-bars">
              <div className="progress-item">
                <div className="progress-header">
                  <span>Smart Vehicle Monitoring</span>
                  <span>90%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{width: '90%'}}></div>
                </div>
              </div>
              
              <div className="progress-item">
                <div className="progress-header">
                  <span>Maintenance & Service Tracking</span>
                  <span>80%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{width: '80%'}}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="aboutone-image-wrapper">
            <img 
              src={about}
              alt="Brake Repair" 
              className="aboutone-main-img"
            />
          </div>
        </div>
      </motion.div>

      <motion.div 
        className="aboutone-bottom section-padding"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="aboutone-container">
          <div className="services-pill">
            <span className="dot"></span> Our Services
          </div>

          <div className="services-grid-new">
            {services.map((svc, idx) => (
              <div className="service-grid-card" key={idx}>
                <div className="service-grid-icon">{svc.icon}</div>
                <h4 className="service-grid-title">{svc.title}</h4>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
      <Aboutsec />
      <Aboutthird />
      <Aboutfour />
    </div>
  );
};

export default Aboutone;
