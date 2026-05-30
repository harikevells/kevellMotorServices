import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import contactUsRightImg from '../../assets/contactusrightimage.png';
import './Contactus.css';

const Contactus = () => {
  const fadeUpVariant = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const imageVariant = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.8 } }
  };

  return (
    <section className="contactus-wrapper">
      <div className="contactus-container">
        
        {/* --- Top Section --- */}
        <div className="contact-top">
          <motion.div 
            className="contact-top-left"
            initial="hidden"
            whileInView="visible"
            viewport={{ amount: 0.2 }}
            variants={fadeUpVariant}
          >
            <h2>Get In Touch</h2>
            <p>Whether you need smart vehicle monitoring, have a question about service management, or need technical assistance, our team is here to support you.</p>
            <div className="orange-u-shape"></div>
          </motion.div>

          <motion.div 
            className="contact-top-right"
            initial="hidden"
            whileInView="visible"
            viewport={{ amount: 0.2 }}
            variants={imageVariant}
          >
            <div className="contact-image-wrapper">
              <img src={contactUsRightImg} alt="Mechanic" />
              <div className="orange-circle-decor"></div>
              <div className="dark-square-decor"></div>
            </div>
          </motion.div>
        </div>

        {/* --- Middle Form & Info Section --- */}
        <div className="contact-middle">
          <motion.div 
            className="contact-form-container"
            initial="hidden"
            whileInView="visible"
            viewport={{ amount: 0.2 }}
            variants={fadeUpVariant}
          >
            <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" placeholder="Enter Your Name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="Enter Your Email" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder=""></textarea>
              </div>
              <button type="submit" className="submit-btn">Submit</button>
            </form>
          </motion.div>

          <motion.div 
            className="contact-info-text"
            initial="hidden"
            whileInView="visible"
            viewport={{ amount: 0.2 }}
            variants={fadeUpVariant}
          >
            <span className="subtitle">CONNECT WITH OUR TEAM</span>
            <h3>Where you can find us.</h3>
            <p>If you have questions about how IWS can meet your specific vehicle management needs, or how to get started, schedule a call with us.</p>
            
            <div className="subscribe-section">
              <h4>Subscribe Now</h4>
              <div className="subscribe-input-wrapper">
                <input type="email" placeholder="Enter Your Email" />
                <button className="subscribe-btn"><FiArrowRight /></button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* --- Bottom Cards Section --- */}
        <motion.div 
          className="contact-cards"
          initial="hidden"
          whileInView="visible"
          viewport={{ amount: 0.2 }}
          variants={staggerContainer}
        >
          <motion.div className="contact-card" variants={fadeUpVariant}>
            <h4>Address</h4>
            <p>19 Frisk Drive, Middletown, NJ,<br/>3348 United States</p>
            <p>31 S Division Street, Montour, IA,<br/>50133 United States</p>
          </motion.div>

          <motion.div className="contact-card" variants={fadeUpVariant}>
            <div className="card-row">
              <h4>Email</h4>
              <p>iws@gmail.com</p>
            </div>
            <div className="card-row mt-4">
              <h4>Website</h4>
              <p>+91 98364563</p>
            </div>
          </motion.div>

          <motion.div className="contact-card" variants={fadeUpVariant}>
            <h4>Customer Support</h4>
            <p>+91 98364563</p>
            <p>+91 98364563</p>
          </motion.div>
        </motion.div>
      </div>

      {/* --- Map Section --- */}
      <motion.div 
        className="contact-map-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ amount: 0.2 }}
        variants={fadeUpVariant}
      >
        <div className="map-badge-wrapper">
          <span className="map-badge"><div className="orange-dot"></div> Our Location</span>
        </div>
        <h3>Explore Our Locations</h3>
        <div className="map-image-container">
          <iframe 
            src="https://maps.google.com/maps?q=KEVELL+CORP,+Madurai&t=&z=15&ie=UTF8&iwloc=B&output=embed" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen="" 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="Kevell Corp Location"
          ></iframe>
        </div>
      </motion.div>
    </section>
  );
};

export default Contactus;
