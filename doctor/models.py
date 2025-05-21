from django.db import models
from django.conf import settings

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