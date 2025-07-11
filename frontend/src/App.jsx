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

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22,4 12,14.01 9,11.01"></polyline>
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
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

// Helper function to format time in 12-hour format
const formatTime12Hour = (time24) => {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const minute = parseInt(minutes, 10);
  
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
};

// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const dateStr = date.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  if (dateStr === todayStr) {
    return 'Today';
  } else if (dateStr === tomorrowStr) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
};

// Helper function to get status badge
const getStatusBadge = (status) => {
  switch (status) {
    case 'scheduled':
      return <span className="badge bg-success"><CheckCircleIcon /> Scheduled</span>;
    case 'completed':
      return <span className="badge bg-secondary"><CheckCircleIcon /> Completed</span>;
    case 'canceled':
      return <span className="badge bg-danger"><XIcon /> Canceled</span>;
    case 'no_show':
      return <span className="badge bg-warning"><AlertCircleIcon /> No Show</span>;
    default:
      return <span className="badge bg-secondary">{status}</span>;
  }
};

// Helper function to check if appointment can be canceled
const canCancelAppointment = (appointment) => {
  if (appointment.status !== 'scheduled') return false;
  
  const appointmentDate = new Date(appointment.schedule?.date || appointment.appointment_date);
  const appointmentTime = appointment.appointment_start_time;
  const now = new Date();
  
  // Combine date and time
  const [hours, minutes] = appointmentTime.split(':');
  appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  // Check if appointment is at least 2 hours in the future
  const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000));
  
  return appointmentDate > twoHoursFromNow;
};

// My Appointments Modal Component
const MyAppointmentsModal = React.memo(({ 
  show, 
  onClose, 
  appointments, 
  loading, 
  onCancelAppointment,
  onRefresh 
}) => {
  const [canceling, setCanceling] = useState(null);

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    setCanceling(appointmentId);
    try {
      const result = await appointmentsAPI.cancel(appointmentId);
      if (result.success) {
        alert('Appointment canceled successfully!');
        onRefresh(); // Refresh the appointments list
      } else {
        alert('Failed to cancel appointment: ' + result.error);
      }
    } catch (error) {
      alert('Error canceling appointment. Please try again.');
      console.error('Cancel error:', error);
    } finally {
      setCanceling(null);
    }
  };

  if (!show) return null;

  // Separate upcoming and past appointments
  const now = new Date();
  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.schedule?.date || apt.appointment_date);
    return aptDate >= now.setHours(0, 0, 0, 0) && apt.status === 'scheduled';
  });
  
  const pastAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.schedule?.date || apt.appointment_date);
    return aptDate < now.setHours(0, 0, 0, 0) || apt.status !== 'scheduled';
  });

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <CalendarIcon />
              My Appointments
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p>Loading your appointments...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-5">
                <div className="mb-3">
                  <CalendarIcon />
                </div>
                <h5 className="text-muted mb-3">No Appointments Yet</h5>
                <p className="text-muted mb-4">
                  You haven't booked any appointments yet. Browse our doctors and book your first appointment!
                </p>
                <button 
                  className="btn btn-teal"
                  onClick={onClose}
                >
                  Browse Doctors
                </button>
              </div>
            ) : (
              <>
                {/* Upcoming Appointments */}
                {upcomingAppointments.length > 0 && (
                  <div className="mb-5">
                    <h6 className="fw-bold mb-3 text-success d-flex align-items-center gap-2">
                      <CalendarIcon />
                      Upcoming Appointments ({upcomingAppointments.length})
                    </h6>
                    <div className="row g-3">
                      {upcomingAppointments.map((appointment) => (
                        <div key={appointment.id} className="col-12">
                          <div className="card border-start border-success border-4">
                            <div className="card-body">
                              <div className="row align-items-center">
                                <div className="col-md-8">
                                  <div className="d-flex align-items-start gap-3">
                                    <div className="doctor-image bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                                      <UserIcon size={24} />
                                    </div>
                                    <div className="flex-grow-1">
                                      <h6 className="fw-bold mb-1">
                                        {appointment.doctor_name}
                                      </h6>
                                      <div className="text-muted small mb-2">
                                        <div className="d-flex align-items-center gap-3 flex-wrap">
                                          <span className="d-flex align-items-center gap-1">
                                            <CalendarIcon />
                                            {formatDate(appointment.schedule?.date || appointment.appointment_date)}
                                          </span>
                                          <span className="d-flex align-items-center gap-1">
                                            <ClockIcon />
                                            {formatTime12Hour(appointment.appointment_start_time)} - {formatTime12Hour(appointment.appointment_end_time)}
                                          </span>
                                          <span className="d-flex align-items-center gap-1">
                                            <MapPinIcon />
                                            Apollo Hospital
                                          </span>
                                        </div>
                                      </div>
                                      {appointment.notes && (
                                        <p className="small text-muted mb-0">
                                          <strong>Notes:</strong> {appointment.notes}
                                        </p>
                                      )}
                                      {appointment.schedule_type === 'range-based' && (
                                        <span className="badge bg-warning text-dark mt-1">
                                          Flexible Timing
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="col-md-4 text-md-end">
                                  <div className="mb-2">
                                    {getStatusBadge(appointment.status)}
                                  </div>
                                  {canCancelAppointment(appointment) && (
                                    <button
                                      onClick={() => handleCancelAppointment(appointment.id)}
                                      disabled={canceling === appointment.id}
                                      className="btn btn-outline-danger btn-sm"
                                    >
                                      {canceling === appointment.id ? (
                                        <>
                                          <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                          Canceling...
                                        </>
                                      ) : (
                                        <>
                                          <XIcon />
                                          Cancel
                                        </>
                                      )}
                                    </button>
                                  )}
                                  {!canCancelAppointment(appointment) && appointment.status === 'scheduled' && (
                                    <small className="text-muted">
                                      Cannot cancel<br />
                                      (Less than 2 hours to appointment)
                                    </small>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Appointments */}
                {pastAppointments.length > 0 && (
                  <div>
                    <h6 className="fw-bold mb-3 text-muted d-flex align-items-center gap-2">
                      <CheckCircleIcon />
                      Past Appointments ({pastAppointments.length})
                    </h6>
                    <div className="row g-3">
                      {pastAppointments
                        .sort((a, b) => new Date(b.schedule?.date || b.appointment_date) - new Date(a.schedule?.date || a.appointment_date))
                        .slice(0, 10) // Show last 10 past appointments
                        .map((appointment) => (
                        <div key={appointment.id} className="col-12">
                          <div className="card border-start border-secondary border-2 bg-light">
                            <div className="card-body py-3">
                              <div className="row align-items-center">
                                <div className="col-md-8">
                                  <div className="d-flex align-items-start gap-3">
                                    <div className="doctor-image bg-secondary bg-opacity-25 rounded d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                      <UserIcon size={20} />
                                    </div>
                                    <div className="flex-grow-1">
                                      <h6 className="fw-bold mb-1 text-muted">
                                        {appointment.doctor_name}
                                      </h6>
                                      <div className="text-muted small">
                                        <div className="d-flex align-items-center gap-3 flex-wrap">
                                          <span className="d-flex align-items-center gap-1">
                                            <CalendarIcon />
                                            {formatDate(appointment.schedule?.date || appointment.appointment_date)}
                                          </span>
                                          <span className="d-flex align-items-center gap-1">
                                            <ClockIcon />
                                            {formatTime12Hour(appointment.appointment_start_time)} - {formatTime12Hour(appointment.appointment_end_time)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-md-4 text-md-end">
                                  {getStatusBadge(appointment.status)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {pastAppointments.length > 10 && (
                      <div className="text-center mt-3">
                        <small className="text-muted">
                          Showing last 10 appointments. Total: {pastAppointments.length}
                        </small>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Close
            </button>
            <button 
              type="button" 
              className="btn btn-teal"
              onClick={() => {
                onRefresh();
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Refreshing...
                </>
              ) : (
                'Refresh'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// Pagination Controls Component (Fixed - No Page Size Selector)
const PaginationControls = React.memo(({ 
  currentPage, 
  totalPages, 
  totalCount, 
  pageSize, 
  onPageChange,
  loading = false 
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination with ellipsis
      if (currentPage <= 3) {
        // Show first pages
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Show last pages
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show middle pages
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mt-4 p-3 bg-white rounded-3 shadow-sm">
      {/* Results Info */}
      <div className="text-muted small">
        Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{totalCount}</strong> doctors
      </div>

      {/* Pagination Controls */}
      <nav aria-label="Doctors pagination">
        <ul className="pagination pagination-sm mb-0">
          {/* Previous Button */}
          <li className={`page-item ${currentPage === 1 || loading ? 'disabled' : ''}`}>
            <button 
              className="page-link"
              onClick={() => !loading && currentPage > 1 && onPageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              aria-label="Previous page"
            >
              <ChevronLeftIcon />
            </button>
          </li>

          {/* Page Numbers */}
          {getPageNumbers().map((page, index) => (
            <li key={index} className={`page-item ${page === currentPage ? 'active' : ''} ${page === '...' || loading ? 'disabled' : ''}`}>
              {page === '...' ? (
                <span className="page-link">...</span>
              ) : (
                <button 
                  className="page-link"
                  onClick={() => !loading && onPageChange(page)}
                  disabled={loading}
                >
                  {page}
                </button>
              )}
            </li>
          ))}

          {/* Next Button */}
          <li className={`page-item ${currentPage === totalPages || loading ? 'disabled' : ''}`}>
            <button 
              className="page-link"
              onClick={() => !loading && currentPage < totalPages && onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              aria-label="Next page"
            >
              <ChevronRightIcon />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
});

// Component to show existing appointments for the selected doctor/date
const ExistingAppointmentWarning = React.memo(({ doctorId, selectedDate, doctor, checkExistingAppointment, isLoggedIn }) => {
  if (!isLoggedIn || !selectedDate) return null;
  
  const existingAppointment = checkExistingAppointment(doctorId, selectedDate);
  
  if (!existingAppointment) return null;
  
  return (
    <div className="alert alert-warning mb-3">
      <div className="d-flex align-items-center gap-2">
        <strong>⚠️ Existing Appointment</strong>
      </div>
      <small>
        You already have an appointment with Dr. {doctor.first_name} {doctor.last_name} on {selectedDate.fullDate} 
        from {existingAppointment.appointment_start_time} to {existingAppointment.appointment_end_time}.
        <br />
        <strong>Booking another appointment will give you multiple appointments on the same day.</strong>
      </small>
    </div>
  );
});

// DoctorCard component
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
  getTimeSlotsForDate,
  checkExistingAppointment,
  isSlotBookedByUser,
  onLogin,
  onRegister
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
                
                {/* Existing appointment warning */}
                <ExistingAppointmentWarning 
                  doctorId={doctor.id} 
                  selectedDate={selectedDate} 
                  doctor={doctor}
                  checkExistingAppointment={checkExistingAppointment}
                  isLoggedIn={isLoggedIn}
                />
                
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

                  // Separate slot-based and range-based appointments
                  const slotBasedAppointments = timeSlots.filter(slot => slot.schedule_type === 'slot-based');
                  const rangeBasedAppointments = timeSlots.filter(slot => slot.schedule_type === 'range-based');

                  return (
                    <>
                      {/* Slot-based appointments (30-minute fixed slots) */}
                      {slotBasedAppointments.length > 0 && (
                        <div className="mb-4">
                          <div className="slot-type-header">
                            <p className="small text-muted mb-0">
                              <strong>Fixed Time Slots</strong> (30-minute appointments)
                            </p>
                          </div>
                          <div className="row g-2">
                            {slotBasedAppointments.map((slot, index) => {
                              const isBooked = isSlotBookedByUser(doctor.id, selectedDate, slot);
                              return (
                                <div key={`slot-${slot.id}-${index}`} className="col-6 col-md-4 col-lg-3">
                                  <button 
                                    onClick={() => !isBooked && onTimeSlotSelect(slot)}
                                    disabled={isBooked}
                                    className={`btn w-100 time-slot position-relative ${
                                      selectedTimeSlot?.id === slot.id ? 'btn-lime' : 
                                      isBooked ? 'btn-secondary opacity-75' : 'btn-outline-teal'
                                    }`}
                                    title={isBooked ? 'You already have an appointment at this time' : ''}
                                  >
                                    {slot.formatted_time}
                                    {isBooked && (
                                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning">
                                        Booked
                                        <span className="visually-hidden">already booked</span>
                                      </span>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Range-based appointments (flexible timing) */}
                      {rangeBasedAppointments.length > 0 && (
                        <div className="mb-4">
                          <div className="slot-type-header range-based">
                            <p className="small text-muted mb-0">
                              <strong>Flexible Timing</strong> (book any duration within the range)
                            </p>
                          </div>
                          <div className="row g-2">
                            {rangeBasedAppointments.map((slot, index) => {
                              const isBooked = isSlotBookedByUser(doctor.id, selectedDate, slot);
                              return (
                                <div key={`range-${slot.id}-${index}`} className="col-12">
                                  <button 
                                    onClick={() => !isBooked && onTimeSlotSelect(slot)}
                                    disabled={isBooked}
                                    className={`btn w-100 range-appointment-btn position-relative ${
                                      selectedTimeSlot?.id === slot.id ? 'selected' : ''
                                    } ${isBooked ? 'opacity-75' : ''}`}
                                    style={{ 
                                      minHeight: '60px',
                                      borderStyle: 'dashed',
                                      borderWidth: '2px',
                                      backgroundColor: isBooked ? '#6c757d' : undefined
                                    }}
                                    title={isBooked ? 'You already have an appointment during this time range' : ''}
                                  >
                                    <div className="d-flex flex-column align-items-center">
                                      <div className="fw-bold">{slot.formatted_time}</div>
                                      <div className="small d-flex align-items-center gap-2">
                                        {isBooked ? (
                                          <span className="badge bg-warning text-dark">Already Booked</span>
                                        ) : (
                                          <>
                                            <span className="flexible-badge">Flexible</span>
                                            <span>{slot.available_slots} slots available</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    {isBooked && (
                                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning">
                                        Booked
                                        <span className="visually-hidden">already booked</span>
                                      </span>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
                
                <div className="d-flex gap-2">
                  {!isLoggedIn && selectedTimeSlot ? (
                    <>
                      <button
                        className="btn btn-teal flex-fill fw-medium"
                        onClick={onLogin}
                        disabled={isLoading}
                      >
                        Login to Book
                      </button>
                      <button
                        className="btn btn-outline-teal flex-fill fw-medium"
                        onClick={onRegister}
                        disabled={isLoading}
                      >
                        Register to Book
                      </button>
                    </>
                  ) : (
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
                      ) : selectedTimeSlot?.schedule_type === 'range-based' ? (
                        'Book Flexible Appointment'
                      ) : (
                        'Confirm Appointment'
                      )}
                    </button>
                  )}
                  <button
                    onClick={onCancel}
                    className="btn btn-outline-secondary"
                  >
                    Cancel
                  </button>
                </div>

                {!isLoggedIn && selectedTimeSlot && (
                  <p className="small text-muted text-center mt-2 mb-0">
                    Please login or register to confirm your appointment booking.
                  </p>
                )}
                
                {selectedTimeSlot?.schedule_type === 'range-based' && (
                  <div className="alert alert-info mt-2 mb-0 range-info">
                    <small>
                      <strong>Flexible Appointment:</strong> You can discuss the exact timing and duration 
                      with the doctor during your appointment within the {selectedTimeSlot.formatted_time} window.
                    </small>
                  </div>
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

  // Pagination state (Fixed page size at 10)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10  // Fixed at 10, no changing allowed
  });

  // UI state
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  
  // Duplicate booking prevention state
  const [userAppointments, setUserAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  
  // NEW: My Appointments modal state
  const [showMyAppointments, setShowMyAppointments] = useState(false);
  
  // Auth popup states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState('mobile');
  const [authMode, setAuthMode] = useState('login');
  const [loginMethod, setLoginMethod] = useState('email');
  const [mobileLoginStep, setMobileLoginStep] = useState('mobile');
  const [userFormData, setUserFormData] = useState({
    mobileNumber: '',
    otp: '',
    name: '',
    email: '',
    password: '',
    dateOfBirth: '',
    loginMobile: '',
    loginOTP: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // NEW: State for OTP resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // NEW: Effect for the resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);


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

  // Load initial data function
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // Load specialties first
      const specialtiesResult = await specialtiesAPI.getAll();
      if (specialtiesResult.success) {
        setSpecialties(specialtiesResult.data);
      }

      // Load first page of doctors directly (always 10 per page)
      const doctorsResult = await doctorsAPI.getAll(1, 10);
      if (doctorsResult.success) {
        setDoctors(doctorsResult.data);
        
        // Set initial pagination state
        if (doctorsResult.pagination) {
          setPagination({
            currentPage: doctorsResult.pagination.current_page,
            totalPages: doctorsResult.pagination.total_pages,
            totalCount: doctorsResult.pagination.count,
            pageSize: 10
          });
        } else {
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalCount: doctorsResult.data.length,
            pageSize: 10
          });
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhanced loadDoctors function
  const loadDoctors = useCallback(async (page = 1, pageSize = 10) => {
    setDoctorsLoading(true);
    try {
      let doctorsResult;
      
      if (selectedSpecialty === 'all') {
        doctorsResult = await doctorsAPI.getAll(page, pageSize);
      } else {
        const specialty = specialties.find(s => s.name === selectedSpecialty);
        if (specialty) {
          doctorsResult = await doctorsAPI.getBySpecialty(specialty.id, page, pageSize);
        } else {
          doctorsResult = await doctorsAPI.getAll(page, pageSize);
        }
      }

      if (doctorsResult.success) {
        setDoctors(doctorsResult.data);
        
        // Update pagination state - ensure pageSize is always 10
        if (doctorsResult.pagination) {
          setPagination({
            currentPage: doctorsResult.pagination.current_page,
            totalPages: doctorsResult.pagination.total_pages,
            totalCount: doctorsResult.pagination.count,
            pageSize: 10  // Always keep it at 10, regardless of backend response
          });
        } else {
          // Fallback for non-paginated responses
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalCount: doctorsResult.data.length,
            pageSize: 10
          });
        }
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setDoctorsLoading(false);
    }
  }, [selectedSpecialty, specialties]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load doctors when specialty filter or pagination changes (Fixed page size)
  useEffect(() => {
    if (specialties.length > 0) {  // Only load doctors after specialties are loaded
      loadDoctors(pagination.currentPage, 10);  // Always use 10
    }
  }, [selectedSpecialty, pagination.currentPage, loadDoctors, specialties.length]);

  // Load user appointments when logged in
  useEffect(() => {
    if (isLoggedIn) {
      loadUserAppointments();
    } else {
      setUserAppointments([]);
    }
  }, [isLoggedIn]);

  // Page change handler (Fixed page size)
  const handlePageChange = useCallback((newPage) => {
    if (newPage !== pagination.currentPage) {
      setPagination(prev => ({
        ...prev,
        currentPage: newPage
      }));
    }

    // Clear selections when changing pages
    setSelectedDoctor(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setCurrentDateIndex(0);
  }, [pagination.currentPage]);

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

  // Function to load user's appointments
  const loadUserAppointments = useCallback(async () => {
    if (!isLoggedIn) return;
    
    setLoadingAppointments(true);
    try {
      const result = await appointmentsAPI.getMyAppointments();
      if (result.success) {
        // Keep all appointments (scheduled, completed, canceled)
        setUserAppointments(result.data);
      }
    } catch (error) {
      console.error('Error loading user appointments:', error);
    } finally {
      setLoadingAppointments(false);
    }
  }, [isLoggedIn]);

  // Check if user has existing appointment for the selected doctor/date
  const checkExistingAppointment = useCallback((doctorId, selectedDate) => {
    if (!isLoggedIn || !selectedDate) return null;
    
    return userAppointments.find(appointment => {
      const appointmentDate = appointment.schedule?.date || appointment.appointment_date;
      return appointment.doctor === parseInt(doctorId) && 
             appointmentDate === selectedDate.fullDate &&
             appointment.status === 'scheduled';
    });
  }, [isLoggedIn, userAppointments]);

  // Check for time conflicts
  const checkTimeConflict = useCallback((doctorId, selectedDate, selectedTimeSlot) => {
    if (!isLoggedIn || !selectedDate || !selectedTimeSlot) return null;
    
    const sameDateAppointments = userAppointments.filter(appointment => {
      const appointmentDate = appointment.schedule?.date || appointment.appointment_date;
      return appointment.doctor === parseInt(doctorId) && 
             appointmentDate === selectedDate.fullDate &&
             appointment.status === 'scheduled';
    });
    
    // Check for time overlaps
    for (const appointment of sameDateAppointments) {
      const existingStart = appointment.appointment_start_time;
      const existingEnd = appointment.appointment_end_time;
      const newStart = selectedTimeSlot.start_time;
      const newEnd = selectedTimeSlot.end_time;
      
      // Check if times overlap
      if (newStart < existingEnd && newEnd > existingStart) {
        return appointment;
      }
    }
    
    return null;
  }, [isLoggedIn, userAppointments]);

  // Check if a time slot is already booked by the user
  const isSlotBookedByUser = useCallback((doctorId, selectedDate, timeSlot) => {
    if (!isLoggedIn || !selectedDate || !timeSlot) return false;
    
    const conflict = checkTimeConflict(doctorId, selectedDate, timeSlot);
    return !!conflict;
  }, [isLoggedIn, checkTimeConflict]);

  // Event handlers
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
    setUserAppointments([]);
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

  // NEW: Handle My Appointments click
  const handleMyAppointments = useCallback(() => {
    setShowAuthDropdown(false);
    setShowMyAppointments(true);
    loadUserAppointments(); // Refresh appointments when opening
  }, [loadUserAppointments]);

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

  // Handle specialty change with proper pagination reset
  const handleSpecialtyChange = useCallback((specialty) => {
    setSelectedSpecialty(specialty);
    setSelectedDoctor(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setCurrentDateIndex(0);
    
    // Reset pagination to first page and ensure page size is 10
    setPagination({
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      pageSize: 10
    });
  }, []);

  // Enhanced confirm appointment with duplicate prevention
  const handleConfirmAppointment = useCallback(async () => {
    if (!isLoggedIn) {
      handleLogin();
      return;
    }

    if (!selectedDoctor || !selectedDate || !selectedTimeSlot) {
      alert('Please select a doctor, date, and time slot');
      return;
    }

    // Check for existing appointments
    const existingAppointment = checkExistingAppointment(selectedDoctor, selectedDate);
    if (existingAppointment) {
      const conflictTime = `${existingAppointment.appointment_start_time} - ${existingAppointment.appointment_end_time}`;
      const confirmOverride = window.confirm(
        `You already have an appointment with this doctor on ${selectedDate.fullDate} at ${conflictTime}.\n\n` +
        `Are you sure you want to book another appointment?`
      );
      if (!confirmOverride) {
        return;
      }
    }

    // Check for time conflicts
    const timeConflict = checkTimeConflict(selectedDoctor, selectedDate, selectedTimeSlot);
    if (timeConflict) {
      const conflictTime = `${timeConflict.appointment_start_time} - ${timeConflict.appointment_end_time}`;
      alert(
        `This appointment time conflicts with your existing appointment at ${conflictTime}.\n\n` +
        `Please select a different time slot.`
      );
      return;
    }

    setIsLoading(true);
    try {
      let appointmentData;

      if (selectedTimeSlot.schedule_type === 'slot-based') {
        appointmentData = {
          schedule_id: selectedTimeSlot.schedule_id,
          time_slot_id: selectedTimeSlot.id,
          notes: 'Appointment booked through website'
        };
      } else if (selectedTimeSlot.schedule_type === 'range-based') {
        appointmentData = {
          schedule_id: selectedTimeSlot.schedule_id,
          start_time: selectedTimeSlot.start_time,
          end_time: selectedTimeSlot.end_time,
          notes: 'Flexible timing appointment booked through website - exact timing to be confirmed with doctor'
        };
      }

      console.log('🚀 Booking appointment with data:', appointmentData);

      const result = await appointmentsAPI.book(selectedDoctor, appointmentData);
      
      if (result.success) {
        const appointmentType = selectedTimeSlot.schedule_type === 'range-based' ? 'flexible timing' : 'fixed time';
        alert(`${appointmentType.charAt(0).toUpperCase() + appointmentType.slice(1)} appointment booked successfully!`);
        
        // Reload user appointments and available slots
        await loadUserAppointments();
        await loadAvailableSlots(selectedDoctor);
        
        // Reset selections
        setSelectedDoctor(null);
        setSelectedDate(null);
        setSelectedTimeSlot(null);
      } else {
        // Handle specific error codes
        if (result.error && typeof result.error === 'object' && result.error.error_code) {
          switch (result.error.error_code) {
            case 'DUPLICATE_BOOKING':
              alert('You already have an appointment booked for this exact time. Please check your existing appointments.');
              break;
            case 'OVERLAPPING_APPOINTMENT':
              alert('This appointment overlaps with an existing appointment. Please select a different time.');
              break;
            case 'MAX_APPOINTMENTS_REACHED':
              alert('You have reached the maximum number of appointments (2) with this doctor for the selected date.');
              break;
            default:
              alert('Failed to book appointment: ' + (result.error.message || result.error));
          }
        } else {
          alert('Failed to book appointment: ' + result.error);
        }
      }
    } catch (error) {
      alert('Error booking appointment. Please try again.');
      console.error('Booking error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, selectedDoctor, selectedDate, selectedTimeSlot, handleLogin, loadAvailableSlots, loadUserAppointments, checkExistingAppointment, checkTimeConflict]);

  const handleCancelAppointment = useCallback(() => {
    setSelectedDoctor(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
  }, []);

  // Enhanced time slots function to handle both types
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
      if (schedule.time_range === 'slot-based') {
        // Handle slot-based schedules (existing logic)
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
                schedule_type: 'slot-based',
                formatted_time: slot.formatted_time || `${slot.start_time} - ${slot.end_time}`
              });
            }
          });
        }
      } else if (schedule.time_range === 'range-based') {
        // Handle range-based schedules - show as full time block
        const scheduleStartTime = schedule.start_time;
        let scheduleMinutes = 0;
        
        if (scheduleStartTime) {
          const timeParts = scheduleStartTime.split(':');
          const hours = parseInt(timeParts[0], 10);
          const minutes = parseInt(timeParts[1], 10);
          scheduleMinutes = hours * 60 + minutes;
        }
        
        // If it's today, only show if the schedule hasn't ended yet
        const isToday = selectedDate.fullDate === today;
        const isInFuture = !isToday || (scheduleMinutes > currentTime + 30);
        
        if (isInFuture && schedule.available_slots > 0) {
          // Format time for display
          const startTime12 = formatTime12Hour(schedule.start_time);
          const endTime12 = formatTime12Hour(schedule.end_time);
          
          timeSlots.push({
            id: `range-${schedule.id}`,
            schedule_id: schedule.id,
            schedule_type: 'range-based',
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            formatted_time: `${startTime12} - ${endTime12}`,
            range_display: `Flexible timing between ${startTime12} and ${endTime12}`,
            available_slots: schedule.available_slots
          });
        }
      }
    });

    return timeSlots;
  }, [availableSlots]);

  // Auth form validation functions
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
  const validateMobileLogin = () => {
  const errors = {};
  if (!userFormData.loginMobile.trim()) {
    errors.loginMobile = 'Mobile number is required';
  } else if (!/^\d{10}$/.test(userFormData.loginMobile.replace(/\s/g, ''))) {
    errors.loginMobile = 'Please enter a valid 10-digit mobile number';
  }
  return errors;
};

// MODIFIED: This validation is no longer needed as the button will be disabled
const validateOTPLogin = () => {
  const errors = {};
  if (!userFormData.loginOTP.trim()) {
    errors.loginOTP = 'OTP is required';
  } else if (userFormData.loginOTP.length < 6) { // Check for length instead of value
    errors.loginOTP = 'Please enter a 6-digit OTP';
  }
  return errors;
};

  // Form handlers
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
    
    // MODIFIED: Check for 6 digit demo OTP
    if (userFormData.otp === '111111') {
      setAuthStep('profile');
      setFormErrors({});
    } else {
      setFormErrors({ otp: 'Invalid OTP. Please enter 111111' });
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

  const handleMobileLoginSubmit = useCallback(async (e) => {
  e.preventDefault();
  
  const errors = validateMobileLogin();
  if (Object.keys(errors).length > 0) {
    setFormErrors(errors);
    return;
  }
  
  setIsLoading(true);
  setFormErrors({});
  
  try {
    const result = await authAPI.sendOTP(userFormData.loginMobile);
    
    if (result.success) {
      setMobileLoginStep('otp');
      setFormErrors({});
      setResendCooldown(30); // NEW: Start cooldown timer
    } else {
      setFormErrors({ 
        loginMobile: result.error 
      });
    }
  } catch (error) {
    setFormErrors({ 
      loginMobile: 'Network error. Please check your connection and try again.' 
    });
  } finally {
    setIsLoading(false);
  }
}, [userFormData.loginMobile]);

const handleOTPLoginSubmit = useCallback(async (e) => {
  e.preventDefault();
  
  // No need for client-side validation here anymore as button is disabled
  
  setIsLoading(true);
  setFormErrors({});
  
  try {
    const result = await authAPI.verifyOTPLogin(userFormData.loginMobile, userFormData.loginOTP);
    
    if (result.success) {
      const userData = authAPI.getUserData();
      setIsLoggedIn(true);
      setUserName(userData?.name || userData?.first_name || 'User');
      setShowAuthModal(false);
      setAuthStep('login-form');
      setLoginMethod('email');
      setMobileLoginStep('mobile');
      setUserFormData({
        mobileNumber: '',
        otp: '',
        name: '',
        email: '',
        password: '',
        dateOfBirth: '',
        loginMobile: '',
        loginOTP: ''
      });
      setFormErrors({});
    } else {
      setFormErrors({ 
        loginOTP: result.error 
      });
    }
  } catch (error) {
    setFormErrors({ 
      loginOTP: 'Network error. Please check your connection and try again.' 
    });
  } finally {
    setIsLoading(false);
  }
}, [userFormData.loginMobile, userFormData.loginOTP]);

// NEW: Handler for resending OTP
const handleResendOTP = useCallback(async () => {
  if (resendCooldown > 0) return;

  setIsResending(true);
  setFormErrors({});

  const result = await authAPI.sendOTP(userFormData.loginMobile);
  if (result.success) {
    alert('A new OTP has been sent to your number.');
    setResendCooldown(30); // Restart cooldown
  } else {
    setFormErrors({ loginOTP: 'Failed to resend OTP. Please try again.' });
  }
  
  setIsResending(false);
}, [userFormData.loginMobile, resendCooldown]);


  const closeAuthModal = useCallback(() => {
  setShowAuthModal(false);
  setAuthStep('mobile');
  setLoginMethod('email');
  setMobileLoginStep('mobile');
  setFormErrors({});
  setResendCooldown(0); // NEW: Reset cooldown on close
  setUserFormData({
    mobileNumber: '',
    otp: '',
    name: '',
    email: '',
    password: '',
    dateOfBirth: '',
    loginMobile: '',
    loginOTP: ''
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
                      onMouseLeave={() => setTimeout(() => setShowAuthDropdown(false), 1000)}
                    >
                      <button className="btn btn-teal btn-sm">
                        Welcome, {userName || 'User'}
                      </button>
                      
                      {showAuthDropdown && (
                        <div className="dropdown-menu show position-absolute end-0 mt-1 shadow">
                          <button className="dropdown-item">Profile</button>
                          <button 
                            className="dropdown-item"
                            onClick={handleMyAppointments}
                          >
                            My Appointments
                          </button>
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
                : `Showing ${pagination.totalCount} ${selectedSpecialty.toLowerCase()}${pagination.totalCount !== 1 ? 's' : ''}`}
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
                <>
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
                        checkExistingAppointment={checkExistingAppointment}
                        isSlotBookedByUser={isSlotBookedByUser}
                        onLogin={handleLogin}
                        onRegister={handleRegister}
                      />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  <PaginationControls
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    totalCount={pagination.totalCount}
                    pageSize={pagination.pageSize}
                    onPageChange={handlePageChange}
                    loading={doctorsLoading}
                  />
                </>
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
                      : `We currently don't have any ${selectedSpecialty.toLowerCase()}s available. Try Browse other specialties.`
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

      {/* My Appointments Modal */}
      <MyAppointmentsModal
        show={showMyAppointments}
        onClose={() => setShowMyAppointments(false)}
        appointments={userAppointments}
        loading={loadingAppointments}
        onRefresh={loadUserAppointments}
      />

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-md">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {authMode === 'register' ? 
                    (authStep === 'mobile' ? 'Create New Account' : 
                     authStep === 'otp' ? 'Verify Mobile Number' : 'Complete Your Profile')
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
  {authMode === 'login' ? (
    <>
      {/* Login Method Toggle */}
      <div className="mb-4">
        <div className="btn-group w-100" role="group">
          <input 
            type="radio" 
            className="btn-check" 
            name="loginMethod" 
            id="emailLogin" 
            autoComplete="off" 
            checked={loginMethod === 'email'}
            onChange={() => {
              setLoginMethod('email');
              setFormErrors({});
            }}
          />
          <label className="btn btn-outline-primary" htmlFor="emailLogin">
            📧 Email Login
          </label>

          <input 
            type="radio" 
            className="btn-check" 
            name="loginMethod" 
            id="mobileLogin" 
            autoComplete="off" 
            checked={loginMethod === 'mobile'}
            onChange={() => {
              setLoginMethod('mobile');
              setMobileLoginStep('mobile');
              setFormErrors({});
            }}
          />
          <label className="btn btn-outline-primary" htmlFor="mobileLogin">
            📱 Mobile Login
          </label>
        </div>
      </div>

      {/* Email Login Form */}
      {loginMethod === 'email' && (
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
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Logging in...
                </>
              ) : (
                'Login with Email'
              )}
            </button>
          </div>
        </form>
      )}

      {/* MODIFIED: Mobile Login Form with Resend OTP logic */}
      {loginMethod === 'mobile' && (
        <>
          {mobileLoginStep === 'mobile' ? (
            <form onSubmit={handleMobileLoginSubmit}>
              {formErrors.general && (
                <div className="alert alert-danger" role="alert">
                  {formErrors.general}
                </div>
              )}
              
              <div className="mb-3">
                <label htmlFor="loginMobile" className="form-label">Mobile Number *</label>
                <input
                  type="tel"
                  className={`form-control ${formErrors.loginMobile ? 'is-invalid' : ''}`}
                  id="loginMobile"
                  value={userFormData.loginMobile}
                  onChange={(e) => handleInputChange('loginMobile', e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  maxLength="10"
                  disabled={isLoading}
                />
                {formErrors.loginMobile && (
                  <div className="invalid-feedback">{formErrors.loginMobile}</div>
                )}
              </div>
              
              <div className="d-grid">
                <button type="submit" className="btn btn-teal" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Sending OTP...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOTPLoginSubmit}>
              <div className="text-center mb-4">
                <div className="alert alert-info">
                  <strong>OTP sent to:</strong> {userFormData.loginMobile}
                </div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="loginOTP" className="form-label">Enter OTP *</label>
                <input
                  type="text"
                  className={`form-control text-center ${formErrors.loginOTP ? 'is-invalid' : ''}`}
                  id="loginOTP"
                  value={userFormData.loginOTP}
                  onChange={(e) => handleInputChange('loginOTP', e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  style={{ fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                />
                {formErrors.loginOTP && (
                  <div className="invalid-feedback">{formErrors.loginOTP}</div>
                )}
              </div>
              
              <div className="d-grid gap-2">
                <button 
                  type="submit" 
                  className="btn btn-lime" 
                  disabled={isLoading || userFormData.loginOTP.length < 6}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Verifying...
                    </>
                  ) : (
                    'Verify OTP & Login'
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setMobileLoginStep('mobile');
                    setFormErrors({});
                  }}
                  disabled={isLoading}
                >
                  Change Number
                </button>
              </div>
              <div className="text-center mt-3">
                <small className="text-muted">
                  Didn't receive the OTP? 
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 ms-1"
                    onClick={handleResendOTP}
                    disabled={resendCooldown > 0 || isResending}
                  >
                    {isResending 
                      ? 'Sending...' 
                      : resendCooldown > 0 
                        ? `Resend in ${resendCooldown}s`
                        : 'Resend OTP'
                    }
                  </button>
                </small>
              </div>
            </form>
          )}
        </>
      )}
    </>
  ) : authStep === 'mobile' ? (
    // Registration mobile step
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
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Sending OTP...
            </>
          ) : (
            'Send OTP'
          )}
        </button>
      </div>
    </form>
  ) : authStep === 'otp' ? (
    // MODIFIED: Registration OTP step
    <form onSubmit={handleOtpSubmit}>
      <div className="text-center mb-4">
        <div className="alert alert-info">
          <strong>OTP sent to:</strong> {userFormData.mobileNumber}
          <br />
          <small>For demo purposes, enter: <strong>111111</strong></small>
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
          placeholder="Enter 6-digit OTP"
          maxLength="6"
          style={{ fontSize: '1.5rem', letterSpacing: '0.5rem' }}
        />
        {formErrors.otp && (
          <div className="invalid-feedback">{formErrors.otp}</div>
        )}
      </div>
      
      <div className="d-grid gap-2">
        <button 
            type="submit" 
            className="btn btn-lime"
            disabled={userFormData.otp.length < 6}
        >
          Verify OTP
        </button>
        <button 
          type="button" 
          className="btn btn-outline-secondary"
          onClick={() => setAuthStep('mobile')}
        >
          Change Number
        </button>
      </div>
    </form>
  ) : (
    // Registration profile step
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
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Creating Account...
            </>
          ) : (
            'Complete Registration'
          )}
        </button>
      </div>
    </form>
  )}
</div>
              <div className="modal-footer">
                <div className="text-center w-100">
                  
                  {authMode === 'login' && (
                    <small className="text-muted">
                      New User? 
                      <button 
                        className="btn btn-link p-0 text-decoration-none ms-1"
                        onClick={() => {
                          setAuthMode('register');
                          setAuthStep('mobile');
                          setFormErrors({});
                        }}
                      >
                        Register here
                      </button>
                    </small>
                  )}
                  
                  {authMode === 'register' && authStep === 'mobile' && (
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
                  
                  {/* MODIFIED: Registration Resend Button */}
                  {authMode === 'register' && authStep === 'otp' && (
                    <small className="text-muted">
                      Didn't receive OTP? 
                      <button 
                        className="btn btn-link p-0 text-decoration-none ms-1"
                        onClick={() => {
                          alert('OTP resent! (Demo: still use 111111)');
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