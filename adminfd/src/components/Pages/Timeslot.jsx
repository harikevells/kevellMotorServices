import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, Plus, User, Loader2, CheckSquare, Edit, Trash2, Search } from 'lucide-react';
import './Timeslot.css';

const Timeslot = () => {
  const [vendorData, setVendorData] = useState({ id: '', name: '' });
  
  // Bulk Generator Form State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(5);
  const [selectedDays, setSelectedDays] = useState({
    Sunday: false, Monday: true, Tuesday: true, Wednesday: true,
    Thursday: true, Friday: true, Saturday: false
  });
  const [availableDaysInRange, setAvailableDaysInRange] = useState({
    Sunday: true, Monday: true, Tuesday: true, Wednesday: true,
    Thursday: true, Friday: true, Saturday: true
  });

  // Edit State
  const [editSlotId, setEditSlotId] = useState(null);

  // View Slots State
  const [slots, setSlots] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  
  // Status State
  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) return;

    const daysDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    
    const available = {
      Sunday: false, Monday: false, Tuesday: false, Wednesday: false,
      Thursday: false, Friday: false, Saturday: false
    };

    if (daysDiff >= 6) {
      Object.keys(available).forEach(d => available[d] = true);
    } else {
      let current = new Date(start);
      while (current <= end) {
        available[daysOfWeek[current.getDay()]] = true;
        current.setDate(current.getDate() + 1);
      }
    }

    setAvailableDaysInRange(available);

    if (!editSlotId) {
      setSelectedDays(prev => {
        const next = { ...prev };
        for (const day of daysOfWeek) {
          if (!available[day]) {
            next[day] = false;
          } else if (daysDiff < 6) {
            next[day] = true;
          }
        }
        return next;
      });
    }
  }, [startDate, endDate, editSlotId]);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('adminUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setVendorData({
        id: parsedUser.vendorId || parsedUser.id || parsedUser._id,
        name: parsedUser.name || 'Vendor'
      });
    }

    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
  }, []);

  useEffect(() => {
    if (vendorData.id) {
      fetchAllSlots();
    }
  }, [vendorData.id]);

  const fetchAllSlots = async () => {
    try {
      setFetchingSlots(true);
      const response = await axios.get(`http://localhost:5000/api/slots/${vendorData.id}`);
      if (response.data && response.data.success) {
        setSlots(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setFetchingSlots(false);
    }
  };

  const handleDayChange = (day) => {
    setSelectedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const formatTime12Hour = (time24) => {
    let [hours, minutes] = time24.split(':');
    hours = parseInt(hours, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = hours < 10 ? '0' + hours : hours;
    return `${hoursStr}:${minutes} ${ampm}`;
  };

  const parseTime24Hour = (time12Str) => {
    // Expects format like "09:00 AM"
    try {
      if(!time12Str) return "09:00";
      const [time, modifier] = time12Str.trim().split(' ');
      let [hours, minutes] = time.split(':');
      if (hours === '12') {
        hours = '00';
      }
      if (modifier === 'PM') {
        hours = parseInt(hours, 10) + 12;
      }
      return `${hours}:${minutes}`;
    } catch (e) {
      return "09:00";
    }
  };

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
    setStartTime('');
    setEndTime('');
    setMaxCapacity(5);
    setEditSlotId(null);
    setSelectedDays({
      Sunday: false, Monday: true, Tuesday: true, Wednesday: true,
      Thursday: true, Friday: true, Saturday: false
    });
  };

  const parseTime24ToMinutes = (time24) => {
    if (!time24) return 0;
    const [h, m] = time24.split(':');
    return parseInt(h, 10) * 60 + parseInt(m, 10);
  };

  const parse12HourToMinutes = (time12Str) => {
    if (!time12Str) return 0;
    try {
      const [time, modifier] = time12Str.trim().split(' ');
      let [hours, minutes] = time.split(':');
      hours = parseInt(hours, 10);
      minutes = parseInt(minutes, 10);
      if (hours === 12) hours = 0;
      if (modifier === 'PM') hours += 12;
      return hours * 60 + minutes;
    } catch(e) {
      return 0;
    }
  };

  const checkOverlap = (existingTime, newStartTime24, newEndTime24) => {
    const newStartMin = parseTime24ToMinutes(newStartTime24);
    const newEndMin = parseTime24ToMinutes(newEndTime24);
    
    if (existingTime && existingTime.includes('-')) {
      const [existStart12, existEnd12] = existingTime.split('-');
      const existStartMin = parse12HourToMinutes(existStart12);
      const existEndMin = parse12HourToMinutes(existEnd12);
      
      // Overlap condition: new starts before existing ends, AND new ends after existing starts
      return newStartMin < existEndMin && newEndMin > existStartMin;
    } else if (existingTime) {
      const existMin = parse12HourToMinutes(existingTime);
      return newStartMin <= existMin && newEndMin > existMin;
    }
    return false;
  };

  const handleEditClick = (slot) => {
    setEditSlotId(slot._id);
    setStartDate(slot.date);
    setEndDate(slot.date);
    setMaxCapacity(slot.maxCapacity);
    
    // Determine the day of the week for the slot
    const dateObj = new Date(slot.date);
    const dayName = daysOfWeek[dateObj.getDay()];
    
    // Only check the day of this specific slot
    const newDays = {
      Sunday: false, Monday: false, Tuesday: false, Wednesday: false,
      Thursday: false, Friday: false, Saturday: false
    };
    newDays[dayName] = true;
    setSelectedDays(newDays);

    // Parse time string "09:00 AM - 05:00 PM"
    if (slot.time && slot.time.includes('-')) {
      const [start, end] = slot.time.split('-');
      setStartTime(parseTime24Hour(start));
      setEndTime(parseTime24Hour(end));
    } else {
      // Fallback if not range
      setStartTime(parseTime24Hour(slot.time));
      setEndTime(parseTime24Hour(slot.time));
    }
    
    // Clear any messages
    setError(null);
    setSuccessMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this slot?")) return;
    
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/slots/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMsg("Slot deleted successfully.");
      fetchAllSlots();
      if(editSlotId === id) resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting slot');
    }
  };

  const handleGenerateSlots = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!startTime || !endTime) {
      setError('Please select both start and end times.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('End Date cannot be before Start Date.');
      return;
    }

    const hasDaysSelected = Object.values(selectedDays).some(val => val);
    if (!hasDaysSelected) {
      setError('Please select at least one day of the week.');
      return;
    }

    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const formattedTime = `${formatTime12Hour(startTime)} - ${formatTime12Hour(endTime)}`;
      
      // Update Mode
      if (editSlotId) {
        const isOverlapping = slots.some(s => {
          if (s.date !== startDate) return false;
          if (s._id === editSlotId) return false; // Ignore self
          return checkOverlap(s.time, startTime, endTime);
        });

        if (isOverlapping) {
          setError("Cannot update slot: The selected time overlaps with an existing slot.");
          setLoading(false);
          return;
        }

        const payload = {
          date: startDate,
          time: formattedTime,
          maxCapacity: parseInt(maxCapacity, 10)
        };
        await axios.put(`http://localhost:5000/api/slots/${editSlotId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMsg("Slot updated successfully.");
        resetForm();
        fetchAllSlots();
        setLoading(false);
        return;
      }

      // Generate Mode
      let currentDate = new Date(startDate);
      const endD = new Date(endDate);
      let createdCount = 0;
      let duplicateCount = 0;

      while (currentDate <= endD) {
        const dayName = daysOfWeek[currentDate.getDay()];
        
        if (selectedDays[dayName]) {
          const dateStr = currentDate.toISOString().split('T')[0];
          
          // Check locally to prevent overlapping slots
          const slotExists = slots.some(s => {
            if (s.date !== dateStr) return false;
            if (editSlotId && s._id === editSlotId) return false; // Ignore self when updating
            return checkOverlap(s.time, startTime, endTime);
          });
          
          if (slotExists) {
              duplicateCount++;
          } else {
              const payload = {
                center: vendorData.id,
                date: dateStr,
                time: formattedTime,
                maxCapacity: parseInt(maxCapacity, 10)
              };

              try {
                await axios.post('http://localhost:5000/api/slots', payload, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                createdCount++;
              } catch (err) {
                // Backend fallback check
                if (err.response?.data?.message?.toLowerCase().includes('duplicate') || err.response?.data?.message?.toLowerCase().includes('already exists') || err.response?.status === 409 || (err.response?.data?.error && err.response.data.error.includes('E11000'))) {
                   duplicateCount++;
                } else {
                   console.error('Error creating slot:', err);
                }
              }
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (createdCount > 0) {
        setSuccessMsg(`Successfully generated ${createdCount} time slot(s).`);
        fetchAllSlots();
      } else if (duplicateCount > 0) {
        setError('Already slot exists');
      } else {
        setError('No valid dates found for the selected days within the date range.');
      }

    } catch (err) {
      setError('An unexpected error occurred during operation.');
    } finally {
      setLoading(false);
    }
  };

  const getDayLabel = (dateStr) => {
    const d = new Date(dateStr);
    return daysOfWeek[d.getDay()].substring(0, 3);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingSlots = slots.filter(s => s.date >= todayStr);

  return (
    <div className="timeslot-container">
      <div className="timeslot-header">
        <div>
        </div>
        <div className="vendor-badge">
          <User size={18} className="vendor-icon" />
          <div className="vendor-info">
            <span className="vendor-name">{vendorData.name}</span>
            <span className="vendor-id">ID: {vendorData.id?.slice(-6).toUpperCase() || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="timeslot-grid">
        {/* Left Column: Form */}
        <div className="timeslot-card form-card">
          <div className="list-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3 className="card-title" style={{margin: 0}}>
              {editSlotId ? 'Edit Slot' : 'Generate Slots'}
            </h3>
            {editSlotId && (
              <button className="btn btn-sm btn-outline-secondary" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>
          
          <form onSubmit={handleGenerateSlots} className="timeslot-form mt-3">
            {error && <div className="error-message">{error}</div>}
            {successMsg && <div className="success-message">{successMsg}</div>}
            
            <div className="form-row">
              <div className="form-group half">
                <label>Start Date</label>
                <div className="input-with-icon">
                  <Calendar size={18} className="input-icon" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group half">
                <label>End Date</label>
                <div className="input-with-icon">
                  <Calendar size={18} className="input-icon" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    disabled={!!editSlotId} // Disable in edit mode to prevent changing range
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Applicable Days</label>
              <div className="days-grid">
                {daysOfWeek.map(day => {
                  const isAvailable = availableDaysInRange[day];
                  return (
                  <label key={day} className={`day-checkbox ${selectedDays[day] ? 'selected' : ''} ${(!isAvailable || editSlotId) ? 'disabled-label' : ''}`}>
                    <input 
                      type="checkbox" 
                      checked={selectedDays[day]} 
                      onChange={() => isAvailable && handleDayChange(day)}
                      disabled={!isAvailable || !!editSlotId} // Disable changing days if editing or not available in range
                    />
                    <CheckSquare size={16} className="check-icon" />
                    <span>{day.substring(0,3)}</span>
                  </label>
                )})}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group third">
                <label>Start Time</label>
                <div className="input-with-icon">
                  <Clock size={18} className="input-icon" />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group third">
                <label>End Time</label>
                <div className="input-with-icon">
                  <Clock size={18} className="input-icon" />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group third">
                <label>Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className={`add-slot-btn ${editSlotId ? 'update-mode' : ''}`} disabled={loading}>
              {loading ? (
                <><Loader2 size={18} className="spin" /> Processing...</>
              ) : editSlotId ? (
                <><Edit size={18} /> Update Time Slot</>
              ) : (
                <><Plus size={18} /> Generate Time Slots</>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Existing Slots viewer */}
        <div className="timeslot-card list-card">
          <div className="list-header d-flex justify-content-between align-items-center mb-3">
            <h3 className="card-title m-0">All Scheduled Slots</h3>
            <span className="badge bg-primary rounded-pill">{upcomingSlots.length} Slots</span>
          </div>
          
          <div className="filter-section mb-3">
            <div className="input-with-icon">
              <Search size={18} className="input-icon" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                placeholder="Filter by date..."
                className="form-control"
              />
            </div>
            {filterDate && (
              <button 
                className="btn btn-sm btn-link text-danger p-0 mt-1" 
                onClick={() => setFilterDate('')}
                style={{ fontSize: '12px', textDecoration: 'none' }}
              >
                Clear Filter
              </button>
            )}
          </div>

          <div className="slots-container custom-scrollbar">
            {fetchingSlots ? (
              <div className="empty-state">
                <Loader2 size={24} className="spin text-muted" />
                <p>Loading slots...</p>
              </div>
            ) : (filterDate ? upcomingSlots.filter(s => s.date === filterDate) : upcomingSlots).length > 0 ? (
              <div className="slots-grid">
                {(filterDate ? upcomingSlots.filter(s => s.date === filterDate) : upcomingSlots).map((slot, index) => (
                  <div key={slot._id || index} className={`slot-item ${slot.isActive ? 'active' : 'inactive'}`}>
                    <div className="slot-content">
                        <div className="slot-date-day">
                            <span className="date-badge">{slot.date}</span>
                            <span className="day-badge">{getDayLabel(slot.date)}</span>
                        </div>
                        <div className="slot-time mt-2">{slot.time}</div>
                        <div className="slot-details">
                            <span>Cap: {slot.maxCapacity}</span>
                            <span className="dot">•</span>
                            <span>Booked: {slot.bookedCount || 0}</span>
                        </div>
                    </div>
                    <div className="slot-actions">
                        <button className="action-btn edit-btn" onClick={() => handleEditClick(slot)} title="Edit Slot">
                            <Edit size={16} />
                        </button>
                        <button className="action-btn delete-btn" onClick={() => handleDeleteClick(slot._id)} title="Delete Slot">
                            <Trash2 size={16} />
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Clock size={32} className="empty-icon" />
                <p>No time slots found.</p>
                <span className="text-muted">
                  {filterDate ? "Clear the filter to see all slots." : "Use the generator to add availability."}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeslot;
