import React from 'react';
import { motion } from 'framer-motion';
import './BlogSection.css';
import blogImg1 from '../../assets/service1.png';
import blogImg2 from '../../assets/service2.png';
import blogImg3 from '../../assets/service3.png';

const BlogSection = () => {
  const blogs = [
    {
      id: 1,
      image: blogImg1,
      category: 'Maintenance',
      title: 'Smart Vehicle\nMaintenance',
      desc: 'Focuses on modern vehicle systems, diagnostics, and repairs for optimal performance.'
    },
    {
      id: 2,
      image: blogImg2,
      category: 'Monitoring',
      title: 'Real-Time Vehicle\nMonitoring',
      desc: 'Track vehicle health, status, and performance instantly with smart analytics.'
    },
    {
      id: 3,
      image: blogImg3,
      category: 'Solutions',
      title: 'Smart safety & Service\nSolutions',
      desc: 'Improve operational efficiency with automated maintenance, smart diagnostics.'
    }
  ];

  return (
    <motion.section 
      className="blog-section section-padding"
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: false, amount: 0.2 }}
    >
      <div className="blog-container">
        
        <div className="blog-grid">
          {blogs.map(blog => (
            <div className="blog-card" key={blog.id}>
              <div className="blog-image">
                <img src={blog.image} alt={blog.title} />
                <div className="blog-category">{blog.category}</div>
              </div>
              <div className="blog-content">
                <h3 className="blog-title" style={{ whiteSpace: 'pre-line', fontSize: '24px', fontWeight: '600' }}>{blog.title}</h3>
                <p style={{ fontSize: '15px', color: '#aaa', marginTop: '12px', lineHeight: '1.6' }}>{blog.desc}</p>
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </motion.section>
  );
};

export default BlogSection;
