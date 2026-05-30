import React from 'react';
import { motion } from 'framer-motion';
import { FaGooglePlay, FaApple } from 'react-icons/fa';
import appLeftImg from '../../assets/Appleftimage.png';
import './App.css';

const AppSection = () => {
  const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <section className="home-app-section">
      <div className="home-app-container">
        
        {/* Top Header */}
        <motion.div 
          className="home-app-header-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUpVariant}
        >
          <div className="home-app-badge-wrapper">
            <span className="home-app-badge"><span className="home-app-orange-dot"></span> Download</span>
          </div>
          <h2>Smart Mobile App Experience</h2>
          <p>
            A comprehensive vehicle maintenance software, powerful mobile application, beneficial connected car services and informative reports are the best solutions we present for your experience.
          </p>

          <div className="home-app-store-buttons">
            <button className="store-btn play-store">
              <FaGooglePlay className="store-icon" />
              <div className="store-text">
                <span className="small-text">GET IT ON</span>
                <span className="large-text">Google Play</span>
              </div>
            </button>
            <button className="store-btn app-store">
              <FaApple className="store-icon" />
              <div className="store-text">
                <span className="small-text">Download on the</span>
                <span className="large-text">App Store</span>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Bottom Content / Image */}
        <motion.div 
          className="home-app-image-container"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <img src={appLeftImg} alt="Mobile App UI" className="home-app-centered-image" />
        </motion.div>

      </div>
    </section>
  );
};

export default AppSection;
