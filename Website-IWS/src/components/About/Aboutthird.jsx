import React, { useEffect, useRef, useState } from 'react';
import * as animeModule from 'animejs';
const anime = animeModule.default || animeModule;
import { FiArrowRight } from 'react-icons/fi';
import './Aboutthird.css';

const Aboutthird = () => {
  const sectionRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          
          const tl = anime.timeline({
            easing: 'spring(1, 80, 10, 0)',
          });

          // Animate left side elements
          tl.add({
            targets: '.anim-third-left',
            translateY: [40, 0],
            opacity: [0, 1],
            delay: anime.stagger(150),
            duration: 800
          });

          // Animate right side elements overlapping slightly
          tl.add({
            targets: '.anim-third-right',
            translateY: [40, 0],
            opacity: [0, 1],
            delay: anime.stagger(150),
            duration: 800
          }, '-=600');
        } else {
          anime.set(['.anim-third-left', '.anim-third-right'], {
            translateY: 40,
            opacity: 0
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
    <section className="aboutthird-section" ref={sectionRef}>
      <div className="aboutthird-left">
        <h2 className="anim-third-left" style={{opacity: 0}}>Get 10% Off Your First<br/>Service Plan</h2>
        <p className="anim-third-left" style={{opacity: 0}}>
          Experience smarter vehicle management with advanced maintenance tracking and service monitoring solutions.
        </p>
        <button className="aboutthird-btn-black anim-third-left" style={{opacity: 0}}>
          <span className="btn-icon-orange"><FiArrowRight /></span>
          Learn More
        </button>
      </div>

      <div className="aboutthird-right">
        <h2 className="anim-third-right" style={{opacity: 0}}>Schedule Your Vehicle<br/>Service Today</h2>
        <p className="anim-third-right" style={{opacity: 0}}>
          Book maintenance services, diagnostics, and inspections quickly through our smart vehicle management platform.
        </p>
        <button className="aboutthird-btn-orange anim-third-right" style={{opacity: 0}}>
          <span className="btn-icon-black"><FiArrowRight /></span>
          Book Appointment
        </button>
      </div>
    </section>
  );
};

export default Aboutthird;
