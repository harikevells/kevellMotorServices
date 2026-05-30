import React, { useEffect, useRef, useState } from 'react';
import * as animeModule from 'animejs';
const anime = animeModule.default || animeModule;
import './Aboutsec.css';

import topbig from '../../assets/topbig.png';
import downsmall from '../../assets/downsmall.png';

const Aboutsec = () => {
  const sectionRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          
          // Anime.js Timeline for premium staggered animations
          const tl = anime.timeline({
            easing: 'spring(1, 80, 10, 0)', // Premium heavy feel
          });

          // Animate images and badge on the left
          tl.add({
            targets: ['.anim-img-1', '.anim-img-2', '.aboutsec-badge'],
            translateY: [50, 0],
            scale: [0.9, 1],
            opacity: [0, 1],
            delay: anime.stagger(200),
            duration: 1000
          });

          // Animate text on the right
          tl.add({
            targets: '.anim-text',
            translateY: [30, 0],
            opacity: [0, 1],
            delay: anime.stagger(150),
            duration: 800,
            easing: 'easeOutQuad'
          }, '-=800'); // overlap with the image animation
        } else {
          // Reverse scroll reset
          anime.set(['.anim-img-1', '.anim-img-2', '.aboutsec-badge', '.anim-text'], {
            opacity: 0,
            translateY: 40,
            scale: 1 // default for others, img starts at 0.9 but 1 is fine for reset to avoid glitch
          });
          anime.set(['.anim-img-1', '.anim-img-2', '.aboutsec-badge'], {
            scale: 0.9
          });
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section className="aboutsec-section section-padding" ref={sectionRef}>
      <div className="aboutsec-container">
        
        {/* Left Side: Image Collage */}
        <div className="aboutsec-left">
          <div className="aboutsec-images">
            <img 
              src={topbig} 
              alt="Top big mechanic" 
              className="anim-img-1 top-img" 
              style={{opacity: 0}}
            />
            <div className="bottom-img-wrapper anim-img-2" style={{opacity: 0}}>
              <img 
                src={downsmall} 
                alt="Down small mechanic" 
                className="bottom-img" 
              />
            </div>
            <div className="aboutsec-badge" style={{opacity: 0}}>
                <span className="badge-number">5 K</span>
                <span className="badge-text">Happy Customer</span>
              </div>
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="aboutsec-right">
          <span className="orange-accent anim-text" style={{opacity: 0}}>Why Choose Us</span>
          <h2 className="aboutsec-title anim-text" style={{opacity: 0}}>
            Why Choose Our<br/>Smart Vehicle Platform
          </h2>

          <div className="aboutsec-feature-block anim-text" style={{opacity: 0}}>
            <h4>Easy Service Management</h4>
            <p>
              Manage vehicle maintenance, diagnostics, and bookings efficiently through one centralized platform.
            </p>
          </div>

          <div className="aboutsec-divider anim-text" style={{opacity: 0}}></div>

          <div className="aboutsec-feature-block anim-text" style={{opacity: 0}}>
            <h4>Real-Time Monitoring</h4>
            <p>
              Track vehicle health, status, and performance instantly with smart analytics and advanced tracking systems.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Aboutsec;
