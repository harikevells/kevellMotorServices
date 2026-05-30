import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCheck } from 'react-icons/fi';
import './Sub.css';

const Sub = () => {
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const PricingCard = ({ title, price, highlighted, features }) => (
    <motion.div 
      className={`sub-pricing-card ${highlighted ? 'highlighted' : ''}`}
      variants={fadeInUp}
    >
      <div className="sub-save-badge">Save<br/>Rs 10</div>
      <h3 className="sub-card-title">{title}</h3>
      <div className="sub-price">
        <span className="currency">Rs</span> {price}
      </div>
      <div className="sub-period">Per Month</div>
      
      <div className="sub-divider"></div>
      
      <ul className="sub-features">
        {features.map((feature, idx) => (
          <li key={idx}>
            <span className="feature-text">{feature}</span>
            <FiCheck className="check-icon" />
          </li>
        ))}
      </ul>
      
      <button className="sub-subscribe-btn">
        <div className="btn-icon">
          <FiArrowRight />
        </div>
        Subscribe Now
      </button>
    </motion.div>
  );

  return (
    <div className="sub-page-wrapper">
      
      {/* Top Banner */}
      <section className="sub-banner">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Subscription Prices
        </motion.h1>
        <motion.div 
          className="sub-breadcrumb"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span>Home</span>
          <span className="dot"></span>
          <span className="active">Prices</span>
        </motion.div>
      </section>

      {/* Main Content */}
      <section className="sub-main-content">
        <div className="sub-container">
          
          {/* Row 1 */}
          <div className="sub-row">
            <motion.div 
              className="sub-left-col"
              initial="hidden"
              whileInView="visible"
              viewport={{ amount: 0.2 }}
              variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
            >
              <motion.h2 className="orange-title" variants={fadeInUp}>
                Affordable Pricing Plans
              </motion.h2>
              <motion.p variants={fadeInUp}>
                Nibh mauris cursus mattis molestie a iaculis at erat. Venenatis cras sed felis eget velit aliquet sagittis id consectetur. In est ante in nibh mauris
              </motion.p>
              <motion.ul className="sub-bullet-list" variants={fadeInUp}>
                <li><span className="bullet-dot"></span> Same Day Service</li>
                <li><span className="bullet-dot"></span> Convenient Location</li>
                <li><span className="bullet-dot"></span> Online Appointment</li>
              </motion.ul>
            </motion.div>

            <motion.div 
              className="sub-right-col"
              initial="hidden"
              whileInView="visible"
              viewport={{ amount: 0.2 }}
              variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
            >
              <PricingCard 
                title="Basic" 
                price="999" 
                features={["3 Service Booking 20%", "10% Off on Spare Parts", "Priority Support"]} 
              />
              <PricingCard 
                title="Subscription" 
                price="1999" 
                highlighted={true}
                features={["6 Service Booking 30%", "30% Off on Spare Parts", "Premium Washing & Detailing"]} 
              />
            </motion.div>
          </div>

          {/* Row 2 */}
          <div className="sub-row mt-100">
            <motion.div 
              className="sub-left-col"
              initial="hidden"
              whileInView="visible"
              viewport={{ amount: 0.2 }}
              variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
            >
              <motion.h2 className="white-title" variants={fadeInUp}>
                Specialization In<br/>What You need
              </motion.h2>
              <motion.p variants={fadeInUp}>
                Egestas integer eget aliquet nibh praesent tristique magna. Penatibus et magnis dis parturient montes nascetur ridiculus
              </motion.p>
              <motion.button className="sub-book-btn" variants={fadeInUp}>
                Book Services Now
                <div className="btn-icon-orange">
                  <FiArrowRight />
                </div>
              </motion.button>
            </motion.div>

            <motion.div 
              className="sub-right-col"
              initial="hidden"
              whileInView="visible"
              viewport={{ amount: 0.2 }}
              variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
            >
              <PricingCard 
                title="Basic" 
                price="999" 
                features={["3 Service Booking 20%", "10% Off on Spare Parts", "Priority Support"]} 
              />
              <PricingCard 
                title="Subscription" 
                price="1999" 
                features={["6 Service Booking 30%", "30% Off on Spare Parts", "Premium Washing & Detailing"]} 
              />
            </motion.div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default Sub;
