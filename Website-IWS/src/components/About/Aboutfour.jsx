import React, { useEffect, useRef, useState } from 'react';
import * as animeModule from 'animejs';
const anime = animeModule.default || animeModule;
import './Aboutfour.css';
import aboutcarbottomimage from '../../assets/aboutcarbottomimage.png';

const Aboutfour = () => {
  const sectionRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          
          const tl = anime.timeline({
            easing: 'spring(1, 80, 10, 0)',
          });

          // Animate header text
          tl.add({
            targets: '.anim-four-header',
            translateY: [30, 0],
            opacity: [0, 1],
            delay: anime.stagger(150),
            duration: 800
          });

          // Animate the 4 feature cards
          tl.add({
            targets: '.aboutfour-card',
            translateY: [40, 0],
            opacity: [0, 1],
            delay: anime.stagger(150),
            duration: 800
          }, '-=600');

          // Animate the car driving in from the left
          tl.add({
            targets: '.anim-car-wrapper',
            translateX: ['-100%', 0],
            opacity: [0, 1],
            duration: 800,
            easing: 'easeOutElastic(1, .8)'
          }, '-=400').add({
            targets: '.anim-car-wrapper',
            translateY: [0, -10, 0],
            duration: 2500,
            loop: true,
            easing: 'easeInOutSine'
          });
        } else {
          // Reset animation state
          anime.set(['.anim-four-header', '.aboutfour-card'], {
            translateY: 30, // or 40 for card
            opacity: 0
          });
          anime.set('.anim-car-wrapper', {
            translateX: '-100%',
            opacity: 0,
            translateY: 0
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

  const cards = [
    { title: 'Instant Service\nBooking' },
    { title: 'Instant Service\nBooking' },
    { title: 'Smart Maintenance\nPlans' },
    { title: '24/7 System\nMonitoring' }
  ];

  return (
    <section className="aboutfour-section" ref={sectionRef}>
      <div className="aboutfour-top">
        <div className="aboutfour-badge anim-four-header" style={{opacity: 0}}>
          <div className="orange-dot"></div> What We DO
        </div>
        <h2 className="aboutfour-title anim-four-header" style={{opacity: 0}}>
          Your Trusted Vehicle Management Partner
        </h2>
        <p className="aboutfour-subtitle anim-four-header" style={{opacity: 0}}>
          We provide smart vehicle service management solutions with maintenance tracking,<br/>
          diagnostics, booking management, and real-time monitoring for better operational efficiency.
        </p>

        <div className="aboutfour-grid">
          {cards.map((card, idx) => (
            <div key={idx} className="aboutfour-card" style={{opacity: 0}}>
              {card.title}
            </div>
          ))}
        </div>
      </div>

      <div className="aboutfour-bottom">
        <div className="anim-car-wrapper" style={{opacity: 0, transform: 'translateX(-100%)'}}>
          <img 
            src={aboutcarbottomimage} 
            alt="Orange Car" 
            className="aboutfour-car" 
          />
        </div>
      </div>
    </section>
  );
};

export default Aboutfour;
