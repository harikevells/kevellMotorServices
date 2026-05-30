import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import img1 from '../../assets/Rectangle 20.png';
import img2 from '../../assets/Rectangle 21.png';
import img3 from '../../assets/Rectangle 22.png';
import img4 from '../../assets/Rectangle 63.png';
import img5 from '../../assets/Rectangle 64.png';
import img6 from '../../assets/Rectangle 65.png';
import two1 from '../../assets/two1.webp';
import two3 from '../../assets/two3.webp';
import two4 from '../../assets/two4.webp';
import two5 from '../../assets/two5.webp';
import two6 from '../../assets/tow78.jpg';
import two7 from '../../assets/two7.webp';
import two8 from '../../assets/two8.webp';
import shopping from '../../assets/shopping.webp';
import et1 from '../../assets/et1.png';
import et2 from '../../assets/et2.webp';
import et3 from '../../assets/et3.webp';
import et4 from '../../assets/et4.webp';
import et5 from '../../assets/et5.webp';
import et6 from '../../assets/et6.webp';
import et7 from '../../assets/et7.webp';
import et8 from '../../assets/et8.webp';
import four1 from '../../assets/four1.webp';
import four2 from '../../assets/four2.webp';
import four3 from '../../assets/four3.webp';
import four4 from '../../assets/four4.webp';
import four5 from '../../assets/four5.webp';
import four6 from '../../assets/four6.jpg';
import four7 from '../../assets/four7.webp';
import four8 from '../../assets/four8.webp';
import './Spare.css';

const Spare = () => {
  const [activeTab, setActiveTab] = useState('Two Wheeler');

  const tabs = ['Two Wheeler', 'Four Wheeler', 'Heavy Vehicle'];

  // Using reliable Unsplash images of car parts/engines for placeholders
  const partsData = {
    'Four Wheeler': [
      { id: 1, name: 'Alloy Wheel', img: four1 },
      { id: 2, name: 'Steering Wheel', img: four2 },
      { id: 3, name: 'Forward / Stop / Back Switch', img: four3 },
      { id: 4, name: 'Steering Knuckle', img: four4 },
      { id: 5, name: 'Headlight Assembly', img: four5 },
      { id: 6, name: 'Wheel Hub Assembly', img: four6 },
      { id: 7, name: 'Wheel Bearing Kit', img: four7 },
      { id: 8, name: 'Rear Wheel Bearing Kit', img: four8 }
    ],
    'Two Wheeler': [
      { id: 1, name: 'Shock Absorber', img: two1 },
      { id: 2, name: 'Brake Lever Master Cylinder', img: two3 },
      { id: 3, name: 'Rear View Mirror', img: two4 },
      { id: 4, name: 'Clutch / Brake Cable', img: two5 },
      { id: 5, name: 'Side Stand', img: two6 },
      { id: 6, name: 'Carburetor Kit', img: two7 },
      { id: 7, name: 'Carburetor', img: two8 },
      { id: 8, name: 'Clutch Assembly', img: shopping }
    ],
    'Heavy Vehicle': [
      { id: 1, name: 'Ball Bearing', img: et1 },
      { id: 2, name: 'Drive Shaft Flange', img: et2 },
      { id: 3, name: 'Hydraulic Motor', img: et3 },
      { id: 4, name: 'Wheel Cylinder', img: et4 },
      { id: 5, name: 'King Pin Kit', img: et5 },
      { id: 6, name: 'Clutch Basket', img: et6 },
      { id: 7, name: 'Transmission Gear', img: et7 },
      { id: 8, name: 'LED Tail Light', img: et8 }
    ]
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  return (
    <section className="spare-parts-section">
      <div className="spare-parts-container">

        {/* Header Section */}
        <div className="spare-header-wrapper">
          <motion.div
            className="spare-badge"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="spare-orange-dot"></span> App Info
          </motion.div>
          <motion.h2
            className="spare-title"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Everything Your Vehicle Service Platform Needs
          </motion.h2>
        </div>

        {/* Category Tabs */}
        <motion.div
          className="spare-tabs-container"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`spare-tab-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </motion.div>

        {/* Parts Grid */}
        <div className="spare-grid-wrapper">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="spare-parts-grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {partsData[activeTab].map((part) => (
                <motion.div key={part.id} className="spare-part-card" variants={itemVariants}>
                  <div className="spare-card-line"></div>
                  <div className="spare-image-box">
                    <img src={part.img} alt={part.name} />
                  </div>
                  <h4 className="spare-part-name">{part.name}</h4>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};

export default Spare;
