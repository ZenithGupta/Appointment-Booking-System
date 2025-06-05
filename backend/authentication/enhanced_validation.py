from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime, timedelta
import pytz
import logging

logger = logging.getLogger(__name__)

# Get IST timezone
IST = pytz.timezone('Asia/Kolkata')

def get_current_ist_time():
    """Get current time in IST"""
    return timezone.now().astimezone(IST)

def validate_not_in_past(date, time=None, buffer_minutes=30):
    """
    Validate that a date/time is not in the past (IST timezone)
    
    Args:
        date: Date object or string (YYYY-MM-DD)
        time: Time object or string (HH:MM:SS) - optional
        buffer_minutes: Minimum minutes in the future required
    
    Returns:
        dict: {'valid': bool, 'message': str, 'current_ist': datetime}
    """
    try:
        # Get current IST time
        now_ist = get_current_ist_time()
        current_date_ist = now_ist.date()
        current_time_ist = now_ist.time()
        
        # Convert date if it's a string
        if isinstance(date, str):
            date = datetime.strptime(date, '%Y-%m-%d').date()
        
        # Convert time if it's a string
        if isinstance(time, str):
            time = datetime.strptime(time, '%H:%M:%S').time()
        
        # Check if date is in the past
        if date < current_date_ist:
            return {
                'valid': False,
                'message': f'Date {date} is in the past. Current date (IST): {current_date_ist}',
                'current_ist': now_ist
            }
        
        # If time is provided and it's today, check time
        if time and date == current_date_ist:
            # Calculate buffer time
            buffer_time = (now_ist + timedelta(minutes=buffer_minutes)).time()
            
            if time <= buffer_time:
                return {
                    'valid': False,
                    'message': f'Time {time} is too close to current time. Must be at least {buffer_minutes} minutes in future. Current time (IST): {current_time_ist.strftime("%H:%M:%S")}',
                    'current_ist': now_ist
                }
        
        return {
            'valid': True,
            'message': 'Date/time is valid',
            'current_ist': now_ist
        }
        
    except Exception as e:
        logger.error(f"❌ Error in validate_not_in_past: {str(e)}")
        return {
            'valid': False,
            'message': f'Validation error: {str(e)}',
            'current_ist': get_current_ist_time()
        }

def validate_schedule_time(schedule_date, start_time, end_time=None):
    """
    Validate schedule timing with IST support
    
    Args:
        schedule_date: Date of the schedule
        start_time: Start time
        end_time: End time (optional)
    
    Returns:
        dict: Validation result
    """
    # Check if schedule date/time is not in past
    result = validate_not_in_past(schedule_date, start_time, buffer_minutes=30)
    
    if not result['valid']:
        return result
    
    # Additional validation for end time
    if end_time:
        if isinstance(start_time, str):
            start_time = datetime.strptime(start_time, '%H:%M:%S').time()
        if isinstance(end_time, str):
            end_time = datetime.strptime(end_time, '%H:%M:%S').time()
        
        if end_time <= start_time:
            return {
                'valid': False,
                'message': 'End time must be after start time',
                'current_ist': result['current_ist']
            }
    
    return result

def validate_appointment_booking(doctor_id, schedule_id, date, start_time, end_time=None, user=None):
    """
    Comprehensive validation for appointment booking
    
    Args:
        doctor_id: ID of the doctor
        schedule_id: ID of the schedule
        date: Appointment date
        start_time: Appointment start time
        end_time: Appointment end time (optional)
        user: User object (optional)
    
    Returns:
        dict: Validation result with detailed info
    """
    try:
        from authentication.models import DoctorSchedule, Appointment, Doctor
        
        now_ist = get_current_ist_time()
        
        # 1. Validate appointment time is not in past
        time_validation = validate_not_in_past(date, start_time, buffer_minutes=15)
        if not time_validation['valid']:
            return {
                'valid': False,
                'error_code': 'PAST_TIME',
                'message': time_validation['message'],
                'current_ist': now_ist
            }
        
        # 2. Check if doctor exists
        try:
            doctor = Doctor.objects.get(id=doctor_id)
        except Doctor.DoesNotExist:
            return {
                'valid': False,
                'error_code': 'DOCTOR_NOT_FOUND',
                'message': f'Doctor with ID {doctor_id} not found',
                'current_ist': now_ist
            }
        
        # 3. Check if schedule exists and is active
        try:
            schedule = DoctorSchedule.objects.get(
                id=schedule_id, 
                doctor_id=doctor_id, 
                is_active=True
            )
        except DoctorSchedule.DoesNotExist:
            return {
                'valid': False,
                'error_code': 'SCHEDULE_NOT_FOUND',
                'message': f'Schedule with ID {schedule_id} not found or inactive',
                'current_ist': now_ist
            }
        
        # 4. Validate schedule date matches appointment date
        if isinstance(date, str):
            date = datetime.strptime(date, '%Y-%m-%d').date()
        
        if schedule.date != date:
            return {
                'valid': False,
                'error_code': 'DATE_MISMATCH',
                'message': f'Schedule date {schedule.date} does not match appointment date {date}',
                'current_ist': now_ist
            }
        
        # 5. Check if schedule has available slots
        if schedule.available_slots <= 0:
            return {
                'valid': False,
                'error_code': 'NO_SLOTS_AVAILABLE',
                'message': f'No available slots for this schedule',
                'current_ist': now_ist
            }
        
        # 6. If user is provided, check for duplicate/conflicting appointments
        if user:
            existing_appointments = Appointment.objects.filter(
                patient__user=user,
                schedule__date=date,
                status='scheduled'
            )
            
            # Check for same doctor on same date
            same_doctor_appointments = existing_appointments.filter(doctor_id=doctor_id)
            if same_doctor_appointments.count() >= 2:  # Limit to 2 appointments per doctor per day
                return {
                    'valid': False,
                    'error_code': 'MAX_APPOINTMENTS_REACHED',
                    'message': f'Maximum 2 appointments per doctor per day reached',
                    'current_ist': now_ist
                }
            
            # Check for time conflicts
            if isinstance(start_time, str):
                start_time = datetime.strptime(start_time, '%H:%M:%S').time()
            if end_time and isinstance(end_time, str):
                end_time = datetime.strptime(end_time, '%H:%M:%S').time()
            
            for appointment in existing_appointments:
                existing_start = appointment.appointment_start_time
                existing_end = appointment.appointment_end_time
                
                # Check for time overlap
                if end_time:
                    if start_time < existing_end and end_time > existing_start:
                        return {
                            'valid': False,
                            'error_code': 'OVERLAPPING_APPOINTMENT',
                            'message': f'Appointment time overlaps with existing appointment at {existing_start}-{existing_end}',
                            'current_ist': now_ist,
                            'conflicting_appointment': {
                                'doctor': appointment.doctor.first_name + ' ' + appointment.doctor.last_name,
                                'time': f'{existing_start}-{existing_end}'
                            }
                        }
                else:
                    # For single time slot, check if exact time already booked
                    if start_time == existing_start:
                        return {
                            'valid': False,
                            'error_code': 'DUPLICATE_BOOKING',
                            'message': f'You already have an appointment at this exact time',
                            'current_ist': now_ist
                        }
        
        # 7. Validate time is within schedule bounds
        schedule_start = schedule.start_time
        schedule_end = schedule.end_time
        
        if start_time < schedule_start or start_time >= schedule_end:
            return {
                'valid': False,
                'error_code': 'TIME_OUT_OF_BOUNDS',
                'message': f'Appointment time {start_time} is outside schedule bounds {schedule_start}-{schedule_end}',
                'current_ist': now_ist
            }
        
        if end_time and end_time > schedule_end:
            return {
                'valid': False,
                'error_code': 'TIME_OUT_OF_BOUNDS',
                'message': f'Appointment end time {end_time} is outside schedule bounds {schedule_start}-{schedule_end}',
                'current_ist': now_ist
            }
        
        # All validations passed
        return {
            'valid': True,
            'message': 'Appointment booking is valid',
            'current_ist': now_ist,
            'schedule': schedule,
            'doctor': doctor
        }
        
    except Exception as e:
        logger.error(f"❌ Error in validate_appointment_booking: {str(e)}", exc_info=True)
        return {
            'valid': False,
            'error_code': 'VALIDATION_ERROR',
            'message': f'Validation error: {str(e)}',
            'current_ist': get_current_ist_time()
        }

def log_security_attempt(user, action, details, ip_address=None):
    """
    Log security-related attempts (like trying to book past appointments)
    
    Args:
        user: User object
        action: Action attempted (e.g., 'PAST_BOOKING_ATTEMPT')
        details: Additional details about the attempt
        ip_address: IP address of the request
    """
    try:
        now_ist = get_current_ist_time()
        user_info = f"User: {user.username} ({user.email})" if user else "Anonymous"
        ip_info = f"IP: {ip_address}" if ip_address else "IP: Unknown"
        
        logger.warning(f"🚨 SECURITY ALERT [{action}] at {now_ist.strftime('%Y-%m-%d %H:%M:%S IST')}")
        logger.warning(f"   {user_info}")
        logger.warning(f"   {ip_info}")
        logger.warning(f"   Details: {details}")
        
    except Exception as e:
        logger.error(f"❌ Error logging security attempt: {str(e)}")

# Helper function to get client IP
def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip