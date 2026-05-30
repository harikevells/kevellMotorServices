import React, { useEffect, useRef, useState } from 'react';
import * as animeModule from 'animejs';
const anime = animeModule.default || animeModule;
import { FaBolt, FaStopCircle, FaCogs } from 'react-icons/fa';
import { GiSteeringWheel, GiCarWheel } from 'react-icons/gi';
import { BsTools } from 'react-icons/bs';
import { FiArrowRight } from 'react-icons/fi';
import rect63 from '../../assets/Rectangle 63.png';
import rect64 from '../../assets/Rectangle 64.png';
import rect65 from '../../assets/Rectangle 65.png';
import clean from '../../assets/clean.png';
import spare from '../../assets/spare.png';
import servicebg from '../../assets/servicebg.png';
import Serviceone from './Serviceone';
import './Service.css';

const Services = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            anime({
              targets: entry.target,
              translateY: [40, 0],
              opacity: [0, 1],
              easing: 'spring(1, 80, 10, 0)',
              duration: 800,
              delay: entry.target.dataset.delay ? parseInt(entry.target.dataset.delay) : 0
            });
          } else {
            // Reverse scroll reset
            anime.set(entry.target, { translateY: 40, opacity: 0 });
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.anim-scroll');
    elements.forEach(el => observer.observe(el));

    return () => {
      elements.forEach(el => observer.unobserve(el));
    };
  }, []);

  const serviceList = [
    { num: '01', title: 'Periodic Service', desc: 'Maintain vehicle health and steady performance with expert site service solutions.', icon: <BsTools /> },
    { num: '02', title: 'Battery Service', desc: 'Avoid starting problems and charging issues, test maintenance services.', icon: <FaBolt /> },
    { num: '03', title: 'Break Check', desc: 'Ensure vehicle safety with routine brake performance monitoring.', icon: <FaStopCircle /> },
    { num: '04', title: 'Steering', desc: 'Analyze steering condition and improve driving stability.', icon: <GiSteeringWheel /> },
    { num: '05', title: 'Tire Repair', desc: 'Monitor tire pressure, condition, and maintenance schedules.', icon: <GiCarWheel /> },
    { num: '06', title: 'Engine Replace', desc: 'Diagnose engine performance and maintenance status efficiently.', icon: <FaCogs /> },
  ];

  const galleryImages = [
    'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=400&auto=format&fit=crop',
    rect63,
    rect64,
    rect65
  ];

  return (
    <div className="services-page" ref={sectionRef}>
      {/* Hero Header */}
      <section 
        className="services-hero"
        style={{ backgroundImage: `linear-gradient(to right, rgba(0,0,0,1) 40%, rgba(0,0,0,0.3)), url(${servicebg})`, backgroundSize: '100% 100%' }}
      >
        <div className="services-hero-content">
          <span className="orange-accent anim-scroll" style={{opacity: 0}}>Services</span>
          <h1 className="anim-scroll" style={{opacity: 0}} data-delay="100">Smart Vehicle Services</h1>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="services-grid-section section-padding">
        <div className="services-container">
          <div className="badge-wrapper anim-scroll" style={{opacity: 0}}>
            <span className="pill-badge"><div className="orange-dot"></div> Our Services</span>
          </div>
          
          <div className="services-grid">
            {serviceList.map((srv, idx) => (
              <div key={idx} className="service-card anim-scroll" style={{opacity: 0}} data-delay={idx * 100}>
                <div className="service-card-line"></div>
                <div className="service-icon">{srv.icon}</div>
                <h3 className="service-title"><span className="orange-text">{srv.num}</span> {srv.title}</h3>
                <p className="service-desc">{srv.desc}</p>
                <div className="service-btn">
                  <span className="btn-icon-orange"><FiArrowRight /></span> Detail Service
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Split Section 1 */}
      <section className="services-split anim-scroll rinf" style={{opacity: 0, paddingBottom: 0}}>
        <div className="services-container" style={{display: 'flex', width: '100%', padding: 0}}>
          <div className="split-img-wrapper">
            <img src={spare } alt="Exterior Cleaning" />
          </div>
          <div className="split-content-wrapper bg-dark">
            {/* <span className="bg-text">Services</span> */}
            <h2>Real-Time Vehicle Insights</h2>
            <div className="bullet-grid">
              <div className="bullet-item"><span className="orange-dot"></span> Real-Time Monitoring</div>
              <div className="bullet-item"><span className="orange-dot"></span> Smart Maintenance Alerts</div>
              <div className="bullet-item"><span className="orange-dot"></span> Online Service Booking</div>
              <div className="bullet-item"><span className="orange-dot"></span> Mobile App Access</div>
            </div>
            <button className="pill-btn-outline">
              <span className="btn-icon-orange"><FiArrowRight /></span> Know More
            </button>
          </div>
        </div>
      </section>

      {/* Split Section 2 */}
      <section className="services-split reverse anim-scroll rinf" style={{opacity: 0}}>
        <div className="services-container" style={{display: 'flex', width: '100%', padding: 0}}>
          <div className="split-content-wrapper bg-darker">
            {/* <span className="bg-text">Services</span> */}
            <h2>Vehicle Performance &<br/>Service Optimization</h2>
            <p>Improve operational efficiency with automated maintenance tracking, smart diagnostics, service scheduling, and real-time vehicle monitoring solutions.</p>
            <button className="pill-btn-outline">
              <span className="btn-icon-orange"><FiArrowRight /></span> Explore Features
            </button>
          </div>
          <div className="split-img-wrapper">
            <img src={clean } alt="Waxing and Polishing" />
          </div>
        </div>
      </section>

      {/* Recent Works Gallery */}
      <section className="services-gallery-section ring">
        <div className="services-container">
          <h2 className="gallery-title anim-scroll" style={{opacity: 0}}>Our Recent Works</h2>
          
          <div className="gallery-grid">
            {galleryImages.map((img, idx) => (
              <div key={idx} className="gallery-card anim-scroll" style={{opacity: 0}} data-delay={idx * 150}>
                <img src={img} alt={`Work ${idx+1}`} />
                {idx === 0 && (
                  <div className="gallery-overlay">
                    <span className="gallery-category">Motor Service</span>
                    <div className="gallery-more">
                      <span className="btn-icon-orange"><FiArrowRight /></span> More Details
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Serviceone />
    </div>
  );
};

export default Services;
