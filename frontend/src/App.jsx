import React, { useState, useMemo, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { authAPI } from './api';

// Simple Icon Components
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

const App = () => {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  
  // Auth popup states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState('mobile'); // 'mobile', 'otp', 'profile', 'login-form'
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
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

  // Generate dates for the next 30 days
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date.getDate(),
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        fullDate: date.toISOString().split('T')[0],
        isToday: i === 0
      });
    }
    return dates;
  };

  const dates = generateDates();

  // Sample time slots
  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];

  // Sample doctors data
  const allDoctors = [
    {
      id: 1,
      name: 'Dr. Rajesh Kumar',
      specialty: 'Cardiologist',
      experience: '15+ Years Experience',
      location: 'Apollo Main Hospital',
      degree: 'MBBS, MD Cardiology',
      bio: 'Dr. Rajesh Kumar is a highly experienced Cardiologist with over 15 years of dedicated practice in cardiovascular medicine. He specializes in interventional cardiology and has performed over 5000 successful procedures.'
    },
    {
      id: 2,
      name: 'Dr. Priya Sharma',
      specialty: 'Neurologist',
      experience: '12+ Years Experience',
      location: 'Apollo Neuro Center',
      degree: 'MBBS, MD Neurology',
      bio: 'Dr. Priya Sharma is a renowned Neurologist specializing in stroke care and neurodegenerative diseases. Her expertise includes advanced neuroimaging and minimally invasive procedures.'
    },
    {
      id: 3,
      name: 'Dr. Amit Patel',
      specialty: 'Orthopedic Surgeon',
      experience: '18+ Years Experience',
      location: 'Apollo Bone & Joint',
      degree: 'MBBS, MS Orthopedics',
      bio: 'Dr. Amit Patel is a leading Orthopedic Surgeon with extensive experience in joint replacement surgeries and sports medicine. He has successfully performed over 3000 joint replacement procedures.'
    },
    {
      id: 4,
      name: 'Dr. Sneha Reddy',
      specialty: 'Pediatrician',
      experience: '10+ Years Experience',
      location: 'Apollo Children Hospital',
      degree: 'MBBS, MD Pediatrics',
      bio: 'Dr. Sneha Reddy is a compassionate Pediatrician specializing in child development and pediatric emergency care. She is known for her gentle approach with children and comprehensive care.'
    },
    {
      id: 5,
      name: 'Dr. Vikram Singh',
      specialty: 'Gastroenterologist',
      experience: '14+ Years Experience',
      location: 'Apollo Digestive Health',
      degree: 'MBBS, MD Gastroenterology',
      bio: 'Dr. Vikram Singh is an expert Gastroenterologist with specialization in advanced endoscopic procedures and liver diseases. He has been recognized for his innovative treatment approaches.'
    },
    {
      id: 6,
      name: 'Dr. Kavitha Nair',
      specialty: 'Dermatologist',
      experience: '11+ Years Experience',
      location: 'Apollo Skin Care',
      degree: 'MBBS, MD Dermatology',
      bio: 'Dr. Kavitha Nair is a skilled Dermatologist specializing in cosmetic dermatology and skin cancer treatment. She is known for her expertise in laser treatments and advanced skin care procedures.'
    }
  ];

  // Get unique specialties for the filter
  const specialties = useMemo(() => {
    const uniqueSpecialties = [...new Set(allDoctors.map(doctor => doctor.specialty))];
    return uniqueSpecialties.sort();
  }, []);

  // Filter doctors based on selected specialty
  const filteredDoctors = useMemo(() => {
    if (selectedSpecialty === 'all') {
      return allDoctors;
    }
    return allDoctors.filter(doctor => doctor.specialty === selectedSpecialty);
  }, [selectedSpecialty]);

  const nextDates = () => {
    if (currentDateIndex < dates.length - 7) {
      setCurrentDateIndex(currentDateIndex + 1);
    }
  };

  const prevDates = () => {
    if (currentDateIndex > 0) {
      setCurrentDateIndex(currentDateIndex - 1);
    }
  };

  const handleLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
    setShowAuthDropdown(false);
    setAuthStep('login-form'); // Go directly to login form
    setFormErrors({});
  };

  const handleRegister = () => {
    setAuthMode('register');
    setShowAuthModal(true);
    setShowAuthDropdown(false);
    setAuthStep('mobile'); // Start with mobile for registration
    setFormErrors({});
  };

  const handleLogout = async () => {
    setIsLoading(true);
    await authAPI.logout();
    setIsLoggedIn(false);
    setSelectedDoctor(null);
    setSelectedDate(null);
    setUserName('');
    setUserFormData({
      mobileNumber: '',
      otp: '',
      name: '',
      email: '',
      dateOfBirth: ''
    });
    setIsLoading(false);
  };

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

  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    const errors = validateMobile();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setIsLoading(true);
    setFormErrors({});
    
    // For demo purposes, just proceed to OTP step
    // In real implementation, you would send OTP here
    setTimeout(() => {
      setAuthStep('otp');
      setIsLoading(false);
    }, 1000);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔍 Current form data:', userFormData); // Debug log
    console.log('🔍 Email value:', userFormData.email); // Debug log
    console.log('🔍 Password value:', userFormData.password); // Debug log
    
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
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    
    if (userFormData.otp === '111') {
      // Only for registration - go to profile step
      setAuthStep('profile');
      setFormErrors({});
    } else {
      setFormErrors({ otp: 'Invalid OTP. Please enter 111' });
    }
  };

  const handleProfileSubmit = async (e) => {
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
  };

  const handleInputChange = (field, value) => {
    console.log(`🔍 Field update: ${field} = ${value}`); // Debug log
    setUserFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setAuthStep('mobile');
    setFormErrors({});
    setUserFormData({
      mobileNumber: '',
      otp: '',
      name: '',
      email: '',
      dateOfBirth: ''
    });
  };

  const handleShowDoctorDetails = (doctorId) => {
    setShowDoctorModal(doctorId);
  };

  const handleBookAppointment = (doctorId) => {
    if (selectedDoctor === doctorId) {
      setSelectedDoctor(null);
      setSelectedDate(null);
      setCurrentDateIndex(0);
    } else {
      setSelectedDoctor(doctorId);
      setSelectedDate(null);
      setCurrentDateIndex(0);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleSpecialtyChange = (specialty) => {
    setSelectedSpecialty(specialty);
    // Reset selection when filter changes
    setSelectedDoctor(null);
    setSelectedDate(null);
    setCurrentDateIndex(0);
  };

  const DoctorCard = ({ doctor }) => {
    const isExpanded = selectedDoctor === doctor.id;

    return (
      <div className="doctor-card-wrapper">
        <div className="card doctor-card h-100 shadow-sm position-relative">
          {/* Info Button */}
          <button 
            className="btn btn-sm btn-light info-btn position-absolute"
            onClick={() => handleShowDoctorDetails(doctor.id)}
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
                <h5 className="card-title mb-1 fw-bold">{doctor.name}</h5>
                <p className="text-muted mb-1">{doctor.specialty}</p>
                <p className="small text-secondary mb-2">{doctor.degree}</p>
                <p className="small fw-medium mb-2 text-success">{doctor.experience}</p>
                
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="d-flex align-items-center gap-1 text-muted">
                    <MapPinIcon />
                    <span className="small">{doctor.location}</span>
                  </div>
                </div>
                
                <p className="small text-muted mb-3 bio-text">{doctor.bio}</p>
                
                <button
                  onClick={() => handleBookAppointment(doctor.id)}
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
                    onClick={prevDates}
                    disabled={currentDateIndex === 0}
                    className="btn btn-sm btn-outline-secondary rounded-circle p-2"
                    style={{ width: '40px', height: '40px' }}
                  >
                    <ChevronLeftIcon />
                  </button>
                  
                  <button
                    onClick={nextDates}
                    disabled={currentDateIndex >= dates.length - 7}
                    className="btn btn-sm btn-outline-secondary rounded-circle p-2"
                    style={{ width: '40px', height: '40px' }}
                  >
                    <ChevronRightIcon />
                  </button>
                </div>
                
                <div className="row g-2">
                  {dates.slice(currentDateIndex, currentDateIndex + 7).map((dateObj, index) => (
                    <div key={`${dateObj.fullDate}-${index}`} className="col">
                      <button
                        onClick={() => handleDateSelect(dateObj)}
                        className={`btn w-100 text-center date-btn ${
                          selectedDate?.fullDate === dateObj.fullDate ? 'btn-lime' : 'btn-outline-secondary'
                        } ${dateObj.isToday ? 'border-teal border-2' : ''}`}
                      >
                        <div className="small fw-medium">{dateObj.day}</div>
                        <div className="h6 mb-0">{dateObj.date}</div>
                        <div className="small">{dateObj.month}</div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {selectedDate && (
                <div className="time-section">
                  <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2 text-teal">
                    <ClockIcon />
                    Available Time Slots
                  </h6>
                  
                  <div className="row g-2 mb-4">
                    {timeSlots.map((slot, index) => (
                      <div key={index} className="col-6 col-md-4 col-lg-3">
                        <button className="btn btn-outline-teal w-100 time-slot">
                          {slot}
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="d-flex gap-2">
                    {isLoggedIn ? (
                      <button className="btn btn-lime flex-fill fw-medium">
                        Confirm Appointment
                      </button>
                    ) : (
                      <button 
                        className="btn btn-lime flex-fill fw-medium"
                        onClick={handleLogin}
                      >
                        Login to Confirm Appointment
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedDoctor(null);
                        setSelectedDate(null);
                      }}
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
  };

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
                        <option key={specialty} value={specialty}>
                          {specialty}
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
                : `Showing ${filteredDoctors.length} ${selectedSpecialty.toLowerCase()}${filteredDoctors.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          <div className="doctors-grid">
            {filteredDoctors.length > 0 ? (
              filteredDoctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))
            ) : (
              <div className="no-doctors-message">
                <div className="text-muted">
                  <h4>No doctors found</h4>
                  <p>Try selecting a different specialty</p>
                </div>
              </div>
            )}
          </div>
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
                <li className="mb-2"><a href="#" className="text-muted text-decoration-none">FAQ</a></li>
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

      {/* Auth Modal */}
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
                          // In real app, resend OTP
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
                  const doctor = allDoctors.find(d => d.id === showDoctorModal);
                  return doctor ? (
                    <div className="row">
                      <div className="col-md-4 text-center mb-4">
                        <div className="doctor-image bg-light rounded d-flex align-items-center justify-content-center mx-auto" style={{ width: '150px', height: '150px' }}>
                          <UserIcon size={60} />
                        </div>
                        <h4 className="mt-3 mb-1">{doctor.name}</h4>
                        <p className="text-muted">{doctor.specialty}</p>
                      </div>
                      <div className="col-md-8">
                        <div className="mb-3">
                          <h6 className="fw-bold">Qualifications</h6>
                          <p>{doctor.degree}</p>
                        </div>
                        <div className="mb-3">
                          <h6 className="fw-bold">Experience</h6>
                          <p>{doctor.experience}</p>
                        </div>
                        <div className="mb-3">
                          <h6 className="fw-bold">Location</h6>
                          <p><MapPinIcon /> {doctor.location}</p>
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
                    handleBookAppointment(showDoctorModal);
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