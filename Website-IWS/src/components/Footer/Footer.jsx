import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import { FiArrowRight } from 'react-icons/fi';
import './Footer.css';
import logo from "../../assets/logo.png";

const Footer = () => {
  return (
    <motion.footer 
      className="footer"
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: false, amount: 0.2 }}
    >
      <div className="footer-container" style={{padding:'50px 60px 50px 60px'}}>
        
        <div className="footer-col brand-col">
          <div className="footer-logo">
            <div className="logo-icon"><img src={logo } alt="IWS Logo" className="header-logo-img" /></div>
          </div>
          <p className="footer-text">
            From daily city drives to weekend, their reflect our commitment to comfort, safety, and excellent service.
          </p>
          
          <div className="footer-newsletter">
            <h4>Subscribe Now</h4>
            <div className="footer-subscribe-form">
              <input type="email" placeholder="Enter Your Email" className="footer-subscribe-input" />
              <button className="footer-submit-btn"><FiArrowRight style={{fontSize:'23px'}}/></button>
            </div>
          </div>
        </div>
        
        <div className="footer-col links-col">
          <h4>Quick links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/services">Services</Link></li>
            <li><Link to="/subscription">Subscription</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
          </ul>
        </div>
        
        <div className="footer-col links-col">
          <h4>Our Services</h4>
          <ul>
            <li><a href="#">Repair Service</a></li>
            <li><a href="#">Online Service</a></li>
            <li><a href="#">Types Production</a></li>
            <li><a href="#">Auto Equipments</a></li>
            <li><a href="#">Hire Experts</a></li>
          </ul>
        </div>
        
        <div className="footer-col contact-col">
          <h4>Contact Information</h4>
          <ul>
            <li>
              <div className="contact-icon"><FaPhoneAlt /></div>
              <span>+91 966412353</span>
            </li>
            <li>
              <div className="contact-icon"><FaEnvelope /></div>
              <span>IWS@gmail.com</span>
            </li>
          </ul>
        </div>
        
      </div>
      
      <div className="footer-bottom">
        <p>Copyrights@2026 All Rights Reserved</p>
      </div>
    </motion.footer>
  );
};

export default Footer;
