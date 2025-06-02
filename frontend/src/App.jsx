import React, { useState, useMemo, useEffect, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { authAPI, doctorsAPI, specialtiesAPI, appointmentsAPI } from './api';

// Simple Icon Components (moved outside for better performance)
const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12,6 12,12 16,14"></polyline>
  </svg>
);

const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15,18 9,12 15,6"></polyline>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9,18 15,12 9,6"></polyline>
  </svg>
);

const UserIcon = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"></polygon>
  </svg>
);

// OPTIMIZED: DoctorCard component moved outside and memoized
const DoctorCard = React.memo(({ 
  doctor, 
  isExpanded, 
  selectedDate, 
  selectedTimeSlot,
  currentDateIndex, 
  dates,
  isLoggedIn,
  isLoading,
  doctorSlots,
  onBookAppointment,
  onShowDetails,
  onDateSelect,
  onTimeSlotSelect,
  onPrevDates,
  onNextDates,
  onConfirmAppointment,
  onCancel,
  getTimeSlotsForDate
}) => {
  return (
    <div className="doctor-card-wrapper">
      <div className="card doctor-card h-100 shadow-sm position-relative">
        <button 
          className="btn btn-sm btn-light info-btn position-absolute"
          onClick={() => onShowDetails(doctor.id)}
          title="View Full Details"
        >
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>i</span>
        </button>
        
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-auto">
              <div className="doctor-image bg-light rounded d-flex align-items-center justify-content-center">
                <UserIcon size={40} />
              </div>
            </div>
            
            <div className="col">
              <h5 className="card-title mb-1 fw-bold">Dr. {doctor.first_name} {doctor.last_name}</h5>
              <p className="text-muted mb-1">
                {doctor.specialties && doctor.specialties.length > 0 
                  ? doctor.specialties.map(s => s.name).join(', ')
                  : 'General Practitioner'
                }
              </p>
              <p className="small text-secondary mb-2">{doctor.degree}</p>
              <p className="small fw-medium mb-2 text-success">{doctor.years_of_experience}+ Years Experience</p>
              
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="d-flex align-items-center gap-1 text-muted">
                  <MapPinIcon />
                  <span className="small">Apollo Hospital</span>
                </div>
              </div>
              
              <p className="small text-muted mb-3 bio-text">{doctor.bio}</p>
              
              <button
                onClick={() => onBookAppointment(doctor.id)}
                className={`btn fw-medium ${isExpanded ? 'btn-lime' : 'btn-teal'}`}
              >
                {isExpanded ? 'Select Date & Time' : 'Book Appointment'}
              </button>
            </div>
          </div>
        </div>

        {/* Appointment Booking Slider */}
        {isExpanded && (
          <div className="appointment-slider border-top bg-light p-4">
            <div className="mb-4">
              <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2 text-teal">
                <CalendarIcon />
                Select Date
              </h6>
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <button
                  onClick={onPrevDates}
                  disabled={currentDateIndex === 0}
                  className="btn btn-sm btn-outline-secondary rounded-circle p-2"
                  style={{ width: '40px', height: '40px' }}
                >
                  <ChevronLeftIcon />
                </button>
                
                <button
                  onClick={onNextDates}
                  disabled={currentDateIndex >= dates.length - 7}
                  className="btn btn-sm btn-outline-secondary rounded-circle p-2"
                  style={{ width: '40px', height: '40px' }}
                >
                  <ChevronRightIcon />
                </button>
              </div>
              
              <div className="row g-2">
                {dates.slice(currentDateIndex, currentDateIndex + 7).map((dateObj, index) => {
                  // Check if doctor has slots for this date
                  const hasSlots = doctorSlots.some(schedule => schedule.date === dateObj.fullDate);
                  
                  return (
                    <div key={`${dateObj.fullDate}-${index}`} className="col">
                      <button
                        onClick={() => hasSlots ? onDateSelect(dateObj) : null}
                        disabled={!hasSlots}
                        className={`btn w-100 text-center date-btn ${
                          selectedDate?.fullDate === dateObj.fullDate ? 'btn-lime' : 
                          hasSlots ? 'btn-outline-secondary' : 'btn-outline-secondary opacity-50'
                        } ${dateObj.isToday ? 'border-teal border-2' : ''}`}
                      >
                        <div className="small fw-medium">{dateObj.day}</div>
                        <div className="h6 mb-0">{dateObj.date}</div>
                        <div className="small">{dateObj.month}</div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div className="time-section">
                <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2 text-teal">
                  <ClockIcon />
                  Available Time Slots
                </h6>
                
                {(() => {
                  const timeSlots = getTimeSlotsForDate(doctor.id, selectedDate);
                  const isToday = selectedDate.fullDate === new Date().toISOString().split('T')[0];
                  
                  if (timeSlots.length === 0) {
                    return (
                      <div className="text-center text-muted py-3">
                        <p>
                          {isToday 
                            ? "No more time slots available for today. Please select a future date."
                            : "No available time slots for this date"
                          }
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="row g-2 mb-4">
                      {timeSlots.map((slot, index) => (
                        <div key={index} className="col-6 col-md-4 col-lg-3">
                          <button 
                            onClick={() => onTimeSlotSelect(slot)}
                            className={`btn w-100 time-slot ${
                              selectedTimeSlot?.id === slot.id ? 'btn-lime' : 'btn-outline-teal'
                            }`}
                          >
                            {slot.formatted_time}
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-lime flex-fill fw-medium"
                    onClick={onConfirmAppointment}
                    disabled={!selectedTimeSlot || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Booking...
                      </>
                    ) : !isLoggedIn ? (
                      'Login to Confirm Appointment'
                    ) : (
                      'Confirm Appointment'
                    )}
                  </button>
                  <button
                    onClick={onCancel}
                    className="btn btn-outline-teal"
                  >
                    Cancel
                  </button>
                </div>
                
                {!isLoggedIn && (
                  <p className="small text-muted text-center mt-2 mb-0">
                    Please login to confirm your appointment booking
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

const App = () => {
  // State for real data
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [availableSlots, setAvailableSlots] = useState({});
  const [loading, setLoading] = useState(true);
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  // UI state
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  
  // Auth popup states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState('mobile');
  const [authMode, setAuthMode] = useState('login');
  const [userFormData, setUserFormData] = useState({
    mobileNumber: '',
    otp: '',
    name: '',
    email: '',
    password: '',
    dateOfBirth: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      if (authAPI.isAuthenticated()) {
        const userData = authAPI.getUserData();
        if (userData) {
          setIsLoggedIn(true);
          setUserName(userData.name || userData.first_name || 'User');
        }
      }
    };
    
    checkAuth();
  }, []);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load doctors when specialty filter changes
  useEffect(() => {
    loadDoctors();
  }, [selectedSpecialty]);

  // OPTIMIZED: Memoize dates generation
  const dates = useMemo(() => {
    const dateArray = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dateArray.push({
        date: date.getDate(),
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        fullDate: date.toISOString().split('T')[0],
        isToday: i === 0
      });
    }
    return dateArray;
  }, []);

  // OPTIMIZED: Use useCallback for API functions
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // Load specialties
      const specialtiesResult = await specialtiesAPI.getAll();
      if (specialtiesResult.success) {
        setSpecialties(specialtiesResult.data);
      }

      // Load all doctors initially
      await loadDoctors();
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDoctors = useCallback(async () => {
    setDoctorsLoading(true);
    try {
      let doctorsResult;
      
      if (selectedSpecialty === 'all') {
        doctorsResult = await doctorsAPI.getAll();
      } else {
        const specialty = specialties.find(s => s.name === selectedSpecialty);
        if (specialty) {
          doctorsResult = await doctorsAPI.getBySpecialty(specialty.id);
        } else {
          doctorsResult = await doctorsAPI.getAll();
        }
      }

      if (doctorsResult.success) {
        setDoctors(doctorsResult.data);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setDoctorsLoading(false);
    }
  }, [selectedSpecialty, specialties]);

  const loadAvailableSlots = useCallback(async (doctorId) => {
    try {
      const slotsResult = await doctorsAPI.getAvailableSlots(doctorId);
      if (slotsResult.success) {
        setAvailableSlots(prev => ({
          ...prev,
          [doctorId]: slotsResult.data
        }));
      }
    } catch (error) {
      console.error('Error loading available slots:', error);
    }
  }, []);

  // OPTIMIZED: Use useCallback for event handlers
  const handleNextDates = useCallback(() => {
    if (currentDateIndex < dates.length - 7) {
      setCurrentDateIndex(currentDateIndex + 1);
    }
  }, [currentDateIndex, dates.length]);

  const handlePrevDates = useCallback(() => {
    if (currentDateIndex > 0) {
      setCurrentDateIndex(currentDateIndex - 1);
    }
  }, [currentDateIndex]);

  const handleLogin = useCallback(() => {
    setAuthMode('login');
    setShowAuthModal(true);
    setShowAuthDropdown(false);
    setAuthStep('login-form');
    setFormErrors({});
  }, []);

  const handleRegister = useCallback(() => {
    setAuthMode('register');
    setShowAuthModal(true);
    setShowAuthDropdown(false);
    setAuthStep('mobile');
    setFormErrors({});
  }, []);

  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    await authAPI.logout();
    setIsLoggedIn(false);
    setSelectedDoctor(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setUserName('');
    setUserFormData({
      mobileNumber: '',
      otp: '',
      name: '',
      email: '',
      password: '',
      dateOfBirth: ''
    });
    setIsLoading(false);
  }, []);

  const handleShowDoctorDetails = useCallback((doctorId) => {
    setShowDoctorModal(doctorId);
  }, []);

  const handleBookAppointment = useCallback(async (doctorId) => {
    if (selectedDoctor === doctorId) {
      setSelectedDoctor(null);
      setSelectedDate(null);
      setSelectedTimeSlot(null);
      setCurrentDateIndex(0);
    } else {
      setSelectedDoctor(doctorId);
      setSelectedDate(null);
      setSelectedTimeSlot(null);
      setCurrentDateIndex(0);
      
      // Load available slots for this doctor
      await loadAvailableSlots(doctorId);
    }
  }, [selectedDoctor, loadAvailableSlots]);

  // Separate function for modal book appointment - always opens, never toggles
  const handleBookAppointmentFromModal = useCallback(async (doctorId) => {
    // Always open the appointment booking (don't toggle)
    setSelectedDoctor(doctorId);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setCurrentDateIndex(0);
    
    // Load available slots for this doctor if not already loaded
    if (!availableSlots[doctorId]) {
      await loadAvailableSlots(doctorId);
    }
  }, [availableSlots, loadAvailableSlots]);

  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  }, []);

  const handleTimeSlotSelect = useCallback((slot) => {
    setSelectedTimeSlot(slot);
  }, []);

  const handleSpecialtyChange = useCallback((specialty) => {
    setSelectedSpecialty(specialty);
    setSelectedDoctor(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setCurrentDateIndex(0);
  }, []);

  const handleConfirmAppointment = useCallback(async () => {
    if (!isLoggedIn) {
      handleLogin();
      return;
    }

    if (!selectedDoctor || !selectedDate || !selectedTimeSlot) {
      alert('Please select a doctor, date, and time slot');
      return;
    }

    setIsLoading(true);
    try {
      const appointmentData = {
        schedule_id: selectedTimeSlot.schedule_id,
        time_slot_id: selectedTimeSlot.id,
        notes: 'Appointment booked through website'
      };

      const result = await appointmentsAPI.book(selectedDoctor, appointmentData);
      
      if (result.success) {
        alert('Appointment booked successfully!');
        setSelectedDoctor(null);
        setSelectedDate(null);
        setSelectedTimeSlot(null);
        // Reload available slots
        await loadAvailableSlots(selectedDoctor);
      } else {
        alert('Failed to book appointment: ' + result.error);
      }
    } catch (error) {
      alert('Error booking appointment. Please try again.');
      console.error('Booking error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, selectedDoctor, selectedDate, selectedTimeSlot, handleLogin, loadAvailableSlots]);

  const handleCancelAppointment = useCallback(() => {
    setSelectedDoctor(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
  }, []);

  // OPTIMIZED: Memoize time slots function with past time filtering
  const getTimeSlotsForDate = useCallback((doctorId, selectedDate) => {
    if (!selectedDate || !availableSlots[doctorId]) {
      return [];
    }

    const slotsForDate = availableSlots[doctorId].filter(schedule => 
      schedule.date === selectedDate.fullDate
    );

    const timeSlots = [];
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes since midnight
    
    slotsForDate.forEach(schedule => {
      if (schedule.available_time_slots && Array.isArray(schedule.available_time_slots)) {
        schedule.available_time_slots.forEach(slot => {
          // Parse slot start time (format: "HH:MM" or "HH:MM:SS")
          const slotStartTime = slot.start_time;
          let slotMinutes = 0;
          
          if (slotStartTime) {
            const timeParts = slotStartTime.split(':');
            const hours = parseInt(timeParts[0], 10);
            const minutes = parseInt(timeParts[1], 10);
            slotMinutes = hours * 60 + minutes;
          }
          
          // If it's today, only show slots that are in the future (at least 30 minutes from now)
          const isToday = selectedDate.fullDate === today;
          const isInFuture = !isToday || (slotMinutes > currentTime + 30);
          
          if (isInFuture) {
            timeSlots.push({
              ...slot,
              schedule_id: schedule.id,
              formatted_time: slot.formatted_time || `${slot.start_time} - ${slot.end_time}`
            });
          }
        });
      }
    });

    return timeSlots;
  }, [availableSlots]);

  // Auth form validation functions (keep existing)
  const validateMobile = () => {
    const errors = {};
    if (!userFormData.mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(userFormData.mobileNumber.replace(/\s/g, ''))) {
      errors.mobileNumber = 'Please enter a valid 10-digit mobile number';
    }
    return errors;
  };

  const validateLogin = () => {
    const errors = {};
    if (!userFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userFormData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!userFormData.password.trim()) {
      errors.password = 'Password is required';
    }
    return errors;
  };

  const validateProfile = () => {
    const errors = {};
    if (!userFormData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!userFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userFormData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!userFormData.password.trim()) {
      errors.password = 'Password is required';
    } else if (userFormData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    if (!userFormData.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    }
    return errors;
  };

  // OPTIMIZED: Use useCallback for form handlers
  const handleMobileSubmit = useCallback(async (e) => {
    e.preventDefault();
    const errors = validateMobile();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setIsLoading(true);
    setFormErrors({});
    
    setTimeout(() => {
      setAuthStep('otp');
      setIsLoading(false);
    }, 1000);
  }, [userFormData.mobileNumber]);

  const handleLoginSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    const errors = validateLogin();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setIsLoading(true);
    setFormErrors({});
    
    try {
      const result = await authAPI.login(userFormData);
      
      if (result.success) {
        const userData = authAPI.getUserData();
        setIsLoggedIn(true);
        setUserName(userData?.name || userData?.first_name || userFormData.email.split('@')[0]);
        setShowAuthModal(false);
        setAuthStep('login-form');
        setUserFormData({
          mobileNumber: '',
          otp: '',
          name: '',
          email: '',
          password: '',
          dateOfBirth: ''
        });
        setFormErrors({});
      } else {
        setFormErrors({ 
          general: result.error || 'Login failed' 
        });
      }
    } catch (error) {
      setFormErrors({ 
        general: 'Network error. Please check your connection and try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [userFormData]);

  const handleOtpSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (userFormData.otp === '111') {
      setAuthStep('profile');
      setFormErrors({});
    } else {
      setFormErrors({ otp: 'Invalid OTP. Please enter 111' });
    }
  }, [userFormData.otp]);

  const handleProfileSubmit = useCallback(async (e) => {
    e.preventDefault();
    const errors = validateProfile();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setIsLoading(true);
    setFormErrors({});
    
    try {
      const result = await authAPI.register(userFormData);
      
      if (result.success) {
        setIsLoggedIn(true);
        setUserName(userFormData.name);
        setShowAuthModal(false);
        setAuthStep('mobile');
        setUserFormData({
          mobileNumber: '',
          otp: '',
          name: '',
          email: '',
          password: '',
          dateOfBirth: ''
        });
        setFormErrors({});
      } else {
        setFormErrors({ 
          general: result.error || 'Registration failed' 
        });
      }
    } catch (error) {
      setFormErrors({ 
        general: 'Network error. Please check your connection and try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [userFormData]);

  const handleInputChange = useCallback((field, value) => {
    setUserFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  }, [formErrors]);

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
    setAuthStep('mobile');
    setFormErrors({});
    setUserFormData({
      mobileNumber: '',
      otp: '',
      name: '',
      email: '',
      password: '',
      dateOfBirth: ''
    });
  }, []);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading doctors and specialties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-bottom">
        <div className="container-fluid">
          <div className="row align-items-center py-3">
            <div className="col-auto">
              <h1 className="h3 mb-0 fw-bold text-teal">HealthCare</h1>
              <p className="text-muted small mb-0">Book Your Doctor Appointment</p>
            </div>
            <div className="col d-flex justify-content-end align-items-center">
              <nav className="d-none d-md-flex gap-4 align-items-center">
                <a href="#" className="nav-link text-muted px-0">Home</a>
                <a href="#" className="nav-link text-muted px-0">Doctors</a>
                <a href="#" className="nav-link text-muted px-0">Services</a>
                <a href="#" className="nav-link text-muted px-0">Contact</a>
                
                {/* Auth Section */}
                <div className="position-relative">
                  {!isLoggedIn ? (
                    <div 
                      className="auth-dropdown"
                      onMouseEnter={() => setShowAuthDropdown(true)}
                      onMouseLeave={() => setTimeout(() => setShowAuthDropdown(false), 300)}
                    >
                      <button className="btn btn-outline-teal btn-sm">
                        Login/Register
                      </button>
                      
                      {showAuthDropdown && (
                        <div className="dropdown-menu show position-absolute end-0 mt-1 shadow">
                          <button 
                            className="dropdown-item" 
                            onClick={handleLogin}
                          >
                            Login
                          </button>
                          <button 
                            className="dropdown-item"
                            onClick={handleRegister}
                          >
                            Register
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div 
                      className="auth-dropdown"
                      onMouseEnter={() => setShowAuthDropdown(true)}
                      onMouseLeave={() => setTimeout(() => setShowAuthDropdown(false), 300)}
                    >
                      <button className="btn btn-teal btn-sm">
                        Welcome, {userName || 'User'}
                      </button>
                      
                      {showAuthDropdown && (
                        <div className="dropdown-menu show position-absolute end-0 mt-1 shadow">
                          <button className="dropdown-item">Profile</button>
                          <button className="dropdown-item">My Appointments</button>
                          <div className="dropdown-divider"></div>
                          <button 
                            className="dropdown-item text-danger" 
                            onClick={handleLogout}
                          >
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </nav>
              
              {/* Mobile Auth Button */}
              <div className="d-md-none">
                {!isLoggedIn ? (
                  <button className="btn btn-outline-teal btn-sm" onClick={handleLogin}>
                    Login
                  </button>
                ) : (
                  <button className="btn btn-teal btn-sm" onClick={handleLogout}>
                    {userName || 'User'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section text-white text-center py-5">
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <h2 className="display-4 fw-bold mb-4">
                Find & Book the Best Doctors
              </h2>
              <p className="lead mb-5 opacity-90">
                Connect with experienced healthcare professionals and book your appointment instantly
              </p>
              
              <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                  <div className="input-group input-group-lg">
                    <span className="input-group-text bg-white border-0">
                      <FilterIcon />
                    </span>
                    <select
                      className="form-select form-select-lg"
                      value={selectedSpecialty}
                      onChange={(e) => handleSpecialtyChange(e.target.value)}
                      style={{ 
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        border: 'none'
                      }}
                    >
                      <option value="all">All Specialties</option>
                      {specialties.map((specialty) => (
                        <option key={specialty.id} value={specialty.name}>
                          {specialty.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedSpecialty !== 'all' && (
                    <button
                      onClick={() => handleSpecialtyChange('all')}
                      className="btn btn-outline-light btn-sm mt-2"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section className="py-5">
        <div className="doctors-container">
          <div className="text-center mb-5">
            <h3 className="display-5 fw-bold mb-3 text-dark">
              {selectedSpecialty === 'all' 
                ? 'Best Doctors Available' 
                : `${selectedSpecialty}s Available`}
            </h3>
            <p className="lead text-muted">
              {selectedSpecialty === 'all'
                ? 'Choose from our panel of experienced doctors across various specialties'
                : `Showing ${doctors.length} ${selectedSpecialty.toLowerCase()}${doctors.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {doctorsLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p>Loading doctors...</p>
            </div>
          ) : (
            <>
              {doctors.length > 0 ? (
                <div className="doctors-grid">
                  {doctors.map((doctor) => (
                    <DoctorCard 
                      key={doctor.id} 
                      doctor={doctor}
                      isExpanded={selectedDoctor === doctor.id}
                      selectedDate={selectedDate}
                      selectedTimeSlot={selectedTimeSlot}
                      currentDateIndex={currentDateIndex}
                      dates={dates}
                      isLoggedIn={isLoggedIn}
                      isLoading={isLoading}
                      doctorSlots={availableSlots[doctor.id] || []}
                      onBookAppointment={handleBookAppointment}
                      onShowDetails={handleShowDoctorDetails}
                      onDateSelect={handleDateSelect}
                      onTimeSlotSelect={handleTimeSlotSelect}
                      onPrevDates={handlePrevDates}
                      onNextDates={handleNextDates}
                      onConfirmAppointment={handleConfirmAppointment}
                      onCancel={handleCancelAppointment}
                      getTimeSlotsForDate={getTimeSlotsForDate}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ 
                  width: '100%', 
                  padding: '4rem 2rem',
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  margin: '2rem 0',
                  textAlign: 'center'
                }}>
                  <div className="mb-3">
                    <UserIcon size={60} />
                  </div>
                  <h4 className="mb-3" style={{ color: '#6c757d' }}>
                    No {selectedSpecialty === 'all' ? 'doctors' : selectedSpecialty.toLowerCase() + 's'} available
                  </h4>
                  <p className="mb-4" style={{ color: '#6c757d' }}>
                    {selectedSpecialty === 'all' 
                      ? 'We are working to add more doctors to our platform.' 
                      : `We currently don't have any ${selectedSpecialty.toLowerCase()}s available. Try browsing other specialties.`
                    }
                  </p>
                  <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
                    <button 
                      className="btn btn-teal"
                      onClick={() => handleSpecialtyChange('all')}
                    >
                      Browse All Doctors
                    </button>
                    <button 
                      className="btn btn-outline-teal"
                      onClick={() => window.location.reload()}
                    >
                      Refresh Page
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-5">
        <div className="container-fluid">
          <div className="row g-4">
            <div className="col-lg-3 col-md-6">
              <h5 className="fw-bold mb-3">HealthCare</h5>
              <p className="text-muted">Your trusted partner in healthcare. Book appointments with the best doctors.</p>
            </div>
            <div className="col-lg-3 col-md-6">
              <h6 className="fw-semibold mb-3">Quick Links</h6>
              <ul className="list-unstyled">
                <li className="mb-2"><a href="#" className="text-muted text-decoration-none">Find Doctors</a></li>
                <li className="mb-2"><a href="#" className="text-muted text-decoration-none">Book Appointment</a></li>
                <li className="mb-2"><a href="#" className="text-muted text-decoration-none">Health Packages</a></li>
              </ul>
            </div>
            <div className="col-lg-3 col-md-6">
              <h6 className="fw-semibold mb-3">Support</h6>
              <ul className="list-unstyled">
                <li className="mb-2"><a href="#" className="text-muted text-decoration-none">Help Center</a></li>
                <li className="mb-2"><a href="#" className="text-muted text-decoration-none">Contact Us</a></li>
              </ul>
            </div>
            <div className="col-lg-3 col-md-6">
              <h6 className="fw-semibold mb-3">Contact</h6>
              <div className="text-muted">
                <p className="mb-2">📞 +91 98765 43210</p>
                <p className="mb-2">📧 support@healthcare.com</p>
                <p className="mb-0">📍 123 Medical Street, City</p>
              </div>
            </div>
          </div>
          <hr className="my-4 border-secondary" />
          <div className="text-center text-muted">
            <p className="mb-0">&copy; 2024 HealthCare. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal - Keep existing modal code... */}
      {showAuthModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-md">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {authStep === 'mobile' 
                    ? 'Create New Account'
                    : authStep === 'otp'
                    ? 'Verify Mobile Number'
                    : authStep === 'profile'
                    ? 'Complete Your Profile'
                    : 'Login to Your Account'
                  }
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={closeAuthModal}
                ></button>
              </div>
              <div className="modal-body">
                {authStep === 'login-form' ? (
                  <form onSubmit={handleLoginSubmit}>
                    {formErrors.general && (
                      <div className="alert alert-danger" role="alert">
                        {formErrors.general}
                      </div>
                    )}
                    
                    <div className="mb-3">
                      <label htmlFor="loginEmail" className="form-label">Email Address *</label>
                      <input
                        type="email"
                        className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                        id="loginEmail"
                        value={userFormData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter your email address"
                        disabled={isLoading}
                      />
                      {formErrors.email && (
                        <div className="invalid-feedback">{formErrors.email}</div>
                      )}
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="loginPassword" className="form-label">Password *</label>
                      <input
                        type="password"
                        className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
                        id="loginPassword"
                        value={userFormData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Enter your password"
                        disabled={isLoading}
                      />
                      {formErrors.password && (
                        <div className="invalid-feedback">{formErrors.password}</div>
                      )}
                    </div>
                    
                    <div className="d-grid">
                      <button type="submit" className="btn btn-teal" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Logging in...
                          </>
                        ) : (
                          'Login'
                        )}
                      </button>
                    </div>
                  </form>
                ) : authStep === 'mobile' ? (
                  <form onSubmit={handleMobileSubmit}>
                    {formErrors.general && (
                      <div className="alert alert-danger" role="alert">
                        {formErrors.general}
                      </div>
                    )}
                    
                    <div className="mb-3">
                      <label htmlFor="mobileNumber" className="form-label">Mobile Number *</label>
                      <input
                        type="tel"
                        className={`form-control ${formErrors.mobileNumber ? 'is-invalid' : ''}`}
                        id="mobileNumber"
                        value={userFormData.mobileNumber}
                        onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                        placeholder="Enter 10-digit mobile number"
                        maxLength="10"
                        disabled={isLoading}
                      />
                      {formErrors.mobileNumber && (
                        <div className="invalid-feedback">{formErrors.mobileNumber}</div>
                      )}
                    </div>
                    
                    <div className="d-grid">
                      <button type="submit" className="btn btn-teal" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Sending OTP...
                          </>
                        ) : (
                          'Send OTP'
                        )}
                      </button>
                    </div>
                  </form>
                ) : authStep === 'otp' ? (
                  <form onSubmit={handleOtpSubmit}>
                    <div className="text-center mb-4">
                      <div className="alert alert-info">
                        <strong>OTP sent to:</strong> {userFormData.mobileNumber}
                        <br />
                        <small>For demo purposes, enter: <strong>111</strong></small>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="otp" className="form-label">Enter OTP *</label>
                      <input
                        type="text"
                        className={`form-control text-center ${formErrors.otp ? 'is-invalid' : ''}`}
                        id="otp"
                        value={userFormData.otp}
                        onChange={(e) => handleInputChange('otp', e.target.value)}
                        placeholder="Enter 3-digit OTP"
                        maxLength="3"
                        style={{ fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                      />
                      {formErrors.otp && (
                        <div className="invalid-feedback">{formErrors.otp}</div>
                      )}
                    </div>
                    
                    <div className="d-grid gap-2">
                      <button type="submit" className="btn btn-lime">
                        Verify OTP
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary"
                        onClick={() => setAuthStep('mobile')}
                      >
                        Back to Mobile
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleProfileSubmit}>
                    {formErrors.general && (
                      <div className="alert alert-danger" role="alert">
                        {formErrors.general}
                      </div>
                    )}
                    
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label">Full Name *</label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                        id="name"
                        value={userFormData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter your full name"
                        disabled={isLoading}
                      />
                      {formErrors.name && (
                        <div className="invalid-feedback">{formErrors.name}</div>
                      )}
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">Email Address *</label>
                      <input
                        type="email"
                        className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                        id="email"
                        value={userFormData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter your email address"
                        disabled={isLoading}
                      />
                      {formErrors.email && (
                        <div className="invalid-feedback">{formErrors.email}</div>
                      )}
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="password" className="form-label">Create Password *</label>
                      <input
                        type="password"
                        className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
                        id="password"
                        value={userFormData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Create a strong password (min 6 characters)"
                        disabled={isLoading}
                      />
                      {formErrors.password && (
                        <div className="invalid-feedback">{formErrors.password}</div>
                      )}
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="dateOfBirth" className="form-label">Date of Birth *</label>
                      <input
                        type="date"
                        className={`form-control ${formErrors.dateOfBirth ? 'is-invalid' : ''}`}
                        id="dateOfBirth"
                        value={userFormData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        disabled={isLoading}
                      />
                      {formErrors.dateOfBirth && (
                        <div className="invalid-feedback">{formErrors.dateOfBirth}</div>
                      )}
                    </div>
                    
                    <div className="d-grid gap-2">
                      <button type="submit" className="btn btn-lime" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Creating Account...
                          </>
                        ) : (
                          'Complete Registration'
                        )}
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary"
                        onClick={() => setAuthStep('otp')}
                        disabled={isLoading}
                      >
                        Back to OTP
                      </button>
                    </div>
                  </form>
                )}
              </div>
              <div className="modal-footer">
                <div className="text-center w-100">
                  {authStep === 'login-form' && (
                    <small className="text-muted">
                      Don't have an account? 
                      <button 
                        className="btn btn-link p-0 text-decoration-none ms-1"
                        onClick={() => {
                          setAuthMode('register');
                          setAuthStep('mobile');
                          setFormErrors({});
                          setUserFormData({
                            mobileNumber: '',
                            otp: '',
                            name: '',
                            email: '',
                            password: '',
                            dateOfBirth: ''
                          });
                        }}
                      >
                        Register here
                      </button>
                    </small>
                  )}
                  
                  {authStep === 'mobile' && (
                    <small className="text-muted">
                      Already have an account? 
                      <button 
                        className="btn btn-link p-0 text-decoration-none ms-1"
                        onClick={() => {
                          setAuthMode('login');
                          setAuthStep('login-form');
                          setFormErrors({});
                          setUserFormData({
                            mobileNumber: '',
                            otp: '',
                            name: '',
                            email: '',
                            password: '',
                            dateOfBirth: ''
                          });
                        }}
                      >
                        Login here
                      </button>
                    </small>
                  )}
                  
                  {authStep === 'otp' && (
                    <small className="text-muted">
                      Didn't receive OTP? 
                      <button 
                        className="btn btn-link p-0 text-decoration-none ms-1"
                        onClick={() => {
                          alert('OTP resent! (Demo: still use 111)');
                        }}
                      >
                        Resend
                      </button>
                    </small>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Details Modal */}
      {showDoctorModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Doctor Details</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDoctorModal(null)}
                ></button>
              </div>
              <div className="modal-body">
                {(() => {
                  const doctor = doctors.find(d => d.id === showDoctorModal);
                  return doctor ? (
                    <div className="row">
                      <div className="col-md-4 text-center mb-4">
                        <div className="doctor-image bg-light rounded d-flex align-items-center justify-content-center mx-auto" style={{ width: '150px', height: '150px' }}>
                          <UserIcon size={60} />
                        </div>
                        <h4 className="mt-3 mb-1">Dr. {doctor.first_name} {doctor.last_name}</h4>
                        <p className="text-muted">
                          {doctor.specialties && doctor.specialties.length > 0 
                            ? doctor.specialties.map(s => s.name).join(', ')
                            : 'General Practitioner'
                          }
                        </p>
                      </div>
                      <div className="col-md-8">
                        <div className="mb-3">
                          <h6 className="fw-bold">Qualifications</h6>
                          <p>{doctor.degree}</p>
                        </div>
                        <div className="mb-3">
                          <h6 className="fw-bold">Experience</h6>
                          <p>{doctor.years_of_experience}+ Years</p>
                        </div>
                        <div className="mb-3">
                          <h6 className="fw-bold">Languages</h6>
                          <p>
                            {doctor.languages && doctor.languages.length > 0 
                              ? doctor.languages.map(l => l.name).join(', ')
                              : 'English'
                            }
                          </p>
                        </div>
                        <div className="mb-3">
                          <h6 className="fw-bold">Location</h6>
                          <p><MapPinIcon /> Apollo Hospital</p>
                        </div>
                        <div className="mb-3">
                          <h6 className="fw-bold">About</h6>
                          <p>{doctor.bio}</p>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDoctorModal(null)}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-teal"
                  onClick={() => {
                    setShowDoctorModal(null);
                    handleBookAppointmentFromModal(showDoctorModal);
                  }}
                >
                  Book Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;