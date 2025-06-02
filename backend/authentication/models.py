from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime, timedelta, time

# Doctor related models
class Specialty(models.Model):
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Specialties"

class Language(models.Model):
    name = models.CharField(max_length=50)
    
    def __str__(self):
        return self.name

class Doctor(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='doctor_profile'
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    degree = models.CharField(
        max_length=200,
        default="MBBS", 
        help_text="Doctor's degree(s) e.g., MBBS, MD, PhD"
    )
    years_of_experience = models.PositiveIntegerField(
        default=0,
        help_text="Number of years of medical experience"
    )
    specialties = models.ManyToManyField(Specialty, related_name='doctors')
    languages = models.ManyToManyField(Language, related_name='doctors')
    bio = models.TextField()
    profile_picture = models.ImageField(upload_to='doctors/', blank=True, null=True)
    
    def __str__(self):
        return f"Dr. {self.first_name} {self.last_name}"

class DoctorSchedule(models.Model):
    TIME_RANGE_CHOICES = [
        ('slot-based', 'Slot Based - Specific time slots'),
        ('range-based', 'Range Based - Flexible within time range'),
    ]
    
    SLOT_DURATION_CHOICES = [
        (15, '15 minutes'),
        (30, '30 minutes'),
        (45, '45 minutes'),
        (60, '1 hour'),
        (90, '1.5 hours'),
        (120, '2 hours'),
    ]
    
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='schedules')
    date = models.DateField()
    time_range = models.CharField(
        max_length=20, 
        choices=TIME_RANGE_CHOICES, 
        default='slot-based',
        help_text="Choose how patients can book appointments"
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_duration = models.PositiveIntegerField(
        choices=SLOT_DURATION_CHOICES, 
        default=30,
        help_text="Duration of each appointment (only for slot-based)"
    )
    available_slots = models.PositiveIntegerField()
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['doctor', 'date', 'start_time', 'end_time']
        ordering = ['date', 'start_time']
    
    def clean(self):
        """Validate that schedule is not in the past"""
        super().clean()
        
        if self.date and self.start_time:
            # Get current date and time
            now = timezone.now()
            current_date = now.date()
            current_time = now.time()
            
            # Check if date is in the past
            if self.date < current_date:
                raise ValidationError({
                    'date': 'Schedule date cannot be in the past.'
                })
            
            # If it's today, check if start time is in the past (with 30 min buffer)
            if self.date == current_date:
                # Add 30 minutes buffer to current time
                buffer_time = (now + timedelta(minutes=30)).time()
                if self.start_time <= buffer_time:
                    raise ValidationError({
                        'start_time': f'Schedule time must be at least 30 minutes in the future. Current time: {current_time.strftime("%H:%M")}'
                    })
        
        # Validate end time is after start time
        if self.start_time and self.end_time:
            if self.end_time <= self.start_time:
                raise ValidationError({
                    'end_time': 'End time must be after start time.'
                })
    
    def save(self, *args, **kwargs):
        # Run validation before saving
        self.full_clean()
        
        # Auto-calculate available slots for slot-based schedules
        if self.time_range == 'slot-based':
            self.available_slots = self.calculate_total_slots()
        
        is_new = not self.pk
        super().save(*args, **kwargs)
        
        # Generate TimeSlots for slot-based schedules
        if is_new and self.time_range == 'slot-based':
            self.generate_time_slots()
    
    def __str__(self):
        return f"{self.doctor} - {self.date} ({self.get_time_range_display()})"
    
    def calculate_total_slots(self):
        """Calculate total number of slots for slot-based scheduling"""
        start_datetime = datetime.combine(self.date, self.start_time)
        end_datetime = datetime.combine(self.date, self.end_time)
        total_minutes = (end_datetime - start_datetime).total_seconds() / 60
        return int(total_minutes // self.slot_duration)
    
    def generate_time_slots(self):
        """Generate individual time slots for slot-based scheduling"""
        if self.time_range != 'slot-based':
            return
        
        current_time = datetime.combine(self.date, self.start_time)
        end_time = datetime.combine(self.date, self.end_time)
        slot_duration = timedelta(minutes=self.slot_duration)
        
        while current_time + slot_duration <= end_time:
            slot_end = current_time + slot_duration
            
            TimeSlot.objects.create(
                schedule=self,
                start_time=current_time.time(),
                end_time=slot_end.time()
            )
            
            current_time = slot_end
    
    def get_available_time_slots(self):
        """Get available time slots for slot-based scheduling"""
        if self.time_range == 'slot-based':
            return self.time_slots.filter(is_booked=False).order_by('start_time')
        else:
            return {
                'start_time': self.start_time,
                'end_time': self.end_time,
                'type': 'range-based'
            }

class TimeSlot(models.Model):
    """Individual time slots for slot-based appointments"""
    schedule = models.ForeignKey(DoctorSchedule, on_delete=models.CASCADE, related_name='time_slots')
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_booked = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ['schedule', 'start_time', 'end_time']
        ordering = ['start_time']
    
    def clean(self):
        """Validate that time slot is not in the past"""
        super().clean()
        
        if self.schedule and self.schedule.date and self.start_time:
            now = timezone.now()
            current_date = now.date()
            current_time = now.time()
            
            # If it's today, check if start time is in the past
            if self.schedule.date == current_date:
                buffer_time = (now + timedelta(minutes=30)).time()
                if self.start_time <= buffer_time:
                    raise ValidationError({
                        'start_time': 'Time slot cannot be in the past or too close to current time.'
                    })
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.schedule.doctor} - {self.schedule.date} ({self.start_time} to {self.end_time})"

# Patient related models
class Patient(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='patient_profile'
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    phone_number = models.CharField(max_length=15)
    address = models.TextField()
    
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_number = models.CharField(max_length=15, blank=True)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class MedicalHistory(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='medical_histories')
    diagnosis = models.CharField(max_length=200)
    diagnosis_date = models.DateField()
    treatment = models.TextField()
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.diagnosis} - {self.patient}"

# Appointment related models
class Appointment(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('canceled', 'Canceled'),
        ('no_show', 'No Show'),
    ]
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    schedule = models.ForeignKey(DoctorSchedule, on_delete=models.CASCADE, related_name='appointments')
    time_slot = models.ForeignKey(TimeSlot, on_delete=models.CASCADE, related_name='appointments', null=True, blank=True)
    appointment_start_time = models.TimeField(help_text="Specific appointment start time")
    appointment_end_time = models.TimeField(help_text="Specific appointment end time")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['schedule__date', 'appointment_start_time']
    
    def clean(self):
        """Validate that appointment is not in the past"""
        super().clean()
        
        if self.schedule and self.schedule.date and self.appointment_start_time:
            now = timezone.now()
            current_date = now.date()
            current_time = now.time()
            
            # Check if appointment date is in the past
            if self.schedule.date < current_date:
                raise ValidationError({
                    'schedule': 'Appointment date cannot be in the past.'
                })
            
            # If it's today, check if appointment time is in the past
            if self.schedule.date == current_date:
                buffer_time = (now + timedelta(minutes=15)).time()
                if self.appointment_start_time <= buffer_time:
                    raise ValidationError({
                        'appointment_start_time': 'Appointment time must be at least 15 minutes in the future.'
                    })
    
    def save(self, *args, **kwargs):
        # Run validation before saving
        self.full_clean()
        
        # For slot-based appointments, ensure time_slot is provided
        if self.schedule.time_range == 'slot-based' and self.time_slot:
            self.appointment_start_time = self.time_slot.start_time
            self.appointment_end_time = self.time_slot.end_time
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.patient} with {self.doctor} on {self.schedule.date} at {self.appointment_start_time}"