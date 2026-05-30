import React, { useState } from 'react';
import './RentalForm.css';

const RentalForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    pickUpLocation: '',
    pickUpDate: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Submitted:', formData);
    alert('Search Request Submitted!');
  };

  return (
    <div className="rental-form-wrapper">
      <form className="rental-form" onSubmit={handleSubmit}>
        <div className="form-header">
          <h3>Need to Service your Car?</h3>
        </div>
        
        <div className="form-group">
          <label>Full Name</label>
          <input 
            type="text" 
            name="fullName" 
            placeholder="Enter full name" 
            value={formData.fullName}
            onChange={handleChange}
            required 
          />
        </div>
        
        <div className="form-group">
          <label>Mobile Number</label>
          <input 
            type="tel" 
            name="mobileNumber" 
            placeholder="Enter phone no" 
            value={formData.mobileNumber}
            onChange={handleChange}
            required 
          />
        </div>
        
        <div className="form-group">
          <label>Pick Up Location</label>
          <input 
            type="text" 
            name="pickUpLocation" 
            placeholder="Enter location" 
            value={formData.pickUpLocation}
            onChange={handleChange}
            required 
          />
        </div>
        
        <div className="form-group">
          <label>Pick Up Date</label>
          <input 
            type="date" 
            name="pickUpDate" 
            value={formData.pickUpDate}
            onChange={handleChange}
            required 
          />
        </div>
        
        <div className="form-submit">
          <button type="submit" className="btn btn-primary search-btn">Submit</button>
        </div>
      </form>
    </div>
  );
};

export default RentalForm;
