from django.db import models
from django.conf import settings

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
    specialties = models.ManyToManyField(Specialty, related_name='doctors')
    languages = models.ManyToManyField(Language, related_name='doctors')
    bio = models.TextField()
    profile_picture = models.ImageField(upload_to='doctors/', blank=True, null=True)
    
    def __str__(self):
        return f"Dr. {self.first_name} {self.last_name}"

class DoctorSchedule(models.Model):
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='schedules')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    available_slots = models.PositiveIntegerField()
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['doctor', 'date', 'start_time', 'end_time']
        ordering = ['date', 'start_time']
    
    def __str__(self):
        return f"{self.doctor} - {self.date} ({self.start_time} to {self.end_time})"

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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.patient} with {self.doctor} on {self.schedule.date} at {self.schedule.start_time}"