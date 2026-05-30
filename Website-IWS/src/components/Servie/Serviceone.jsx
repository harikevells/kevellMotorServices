import React from 'react';
import { motion } from 'framer-motion';
import './Serviceone.css';
import serviceRightImg from '../../assets/serviceright.png';

const Serviceone = () => {
  const timelineData = [
    {
      title: 'Register Your Vehicle',
      desc: 'Add vehicle details and user information to start tracking and receiving service features through our interactive management.'
    },
    {
      title: 'Schedule Services',
      desc: 'Book maintenance services, diagnostics, and get alerts regarding running costs, saving time and extending car limits.'
    },
    {
      title: 'Monitor Vehicle Performance',
      desc: 'Track real-time vehicle diagnostics, engine health, service status, and service updates instantly.'
    },
    {
      title: 'Receive Smart Alerts',
      desc: 'Easily schedule maintenance monitoring, performance notifications, and critical service alerts in real-time.'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.9, x: 50 },
    visible: { opacity: 1, scale: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <section className="service-one-container">
      <div className="service-one-content">
        <motion.div 
          className="service-one-left"
          initial="hidden"
          whileInView="visible"
          viewport={{ amount: 0.2 }}
          variants={containerVariants}
        >
          <motion.div className="service-one-header" variants={itemVariants}>
            <h2>How Our Vehicle<br />Platform Works</h2>
            <p>Easily manage vehicle maintenance, diagnostics, and service tracking through our smart and user-friendly platform with real-time monitoring and automated service solutions.</p>
          </motion.div>

          <div className="service-timeline">
            {timelineData.map((item, index) => (
              <motion.div className="timeline-item" key={index} variants={itemVariants}>
                <div className="timeline-marker-container">
                  <div className="timeline-circle"></div>
                  {index !== timelineData.length - 1 && <div className="timeline-line"></div>}
                </div>
                <div className="timeline-content">
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          className="service-one-right"
          initial="hidden"
          whileInView="visible"
          viewport={{ amount: 0.2 }}
          variants={imageVariants}
        >
          <img src={serviceRightImg} alt="Off-road vehicle" />
        </motion.div>
      </div>
    </section>
  );
};

export default Serviceone;
