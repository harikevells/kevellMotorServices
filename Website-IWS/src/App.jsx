import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import HeroSection from './components/HeroSection/HeroSection';
import RentalForm from './components/RentalForm/RentalForm';
import AboutSection from './components/AboutSection/AboutSection';
import ServiceSection from './components/ServiceSection/ServiceSection';
import BlogSection from './components/BlogSection/BlogSection';
import FeaturesSection from './components/FeaturesSection/FeaturesSection';
import Footer from './components/Footer/Footer';
import Aboutone from './components/About/Abountone';
import Services from './components/Servie/Services';
import Contactus from './components/contact/Contactus';
import AppSection from './components/Home/App';
import Spare from './components/Spareparts/Spare';
import Sub from './components/Subscription/Sub';
import Vendorview from './components/VendorViewpage/Vendorview';
import './App.css';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const Home = () => (
  <>
    <HeroSection />
    <div className="main-content-wrapper">
      <RentalForm />
      <AboutSection />
      <ServiceSection />
      <BlogSection />
      <Vendorview />
      <AppSection />
      <FeaturesSection />
      <Spare />
    </div>
  </>
);

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="app-container">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<Aboutone />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contactus />} />
          <Route path="/subscription" element={<Sub />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
