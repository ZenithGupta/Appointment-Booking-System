from django.contrib import admin
from django.utils import timezone
from .models import (
    Doctor, DoctorSchedule, Specialty, Language,
    Patient, MedicalHistory, Appointment
)

# Doctor related admin
admin.site.register(Specialty)
admin.site.register(Language)

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'degree', 'years_of_experience', 'get_specialties')
    list_filter = ('years_of_experience', 'specialties')
    search_fields = ('first_name', 'last_name', 'degree')
    
    def get_specialties(self, obj):
        return ", ".join([s.name for s in obj.specialties.all()])
    get_specialties.short_description = 'Specialties'

@admin.register(DoctorSchedule)
class DoctorScheduleAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'date', 'start_time', 'end_time', 'available_slots', 'is_active', 'is_past')
    list_filter = ('is_active', 'date', 'doctor')
    
    def is_past(self, obj):
        """Show if schedule is in the past"""
        today = timezone.now().date()
        current_time = timezone.now().time()
        
        if obj.date < today:
            return "Past Date"
        elif obj.date == today and obj.end_time < current_time:
            return "Past Time"
        else:
            return "Future"
    
    is_past.short_description = 'Status'
    
    def get_queryset(self, request):
        """Optionally hide past schedules by default"""
        qs = super().get_queryset(request)
        # Uncomment next line to hide past schedules by default
        # qs = qs.filter(date__gte=timezone.now().date())
        return qs

# Patient related admin
@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'date_of_birth', 'phone_number')
    search_fields = ('first_name', 'last_name', 'phone_number')

@admin.register(MedicalHistory)
class MedicalHistoryAdmin(admin.ModelAdmin):
    list_display = ('patient', 'diagnosis', 'diagnosis_date')
    list_filter = ('diagnosis_date',)

# Appointment related admin
@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'schedule', 'status', 'created_at', 'appointment_date', 'is_past')
    list_filter = ('status', 'doctor', 'schedule__date')
    search_fields = ('patient__first_name', 'patient__last_name', 'doctor__first_name', 'doctor__last_name')
    
    def appointment_date(self, obj):
        return obj.schedule.date
    appointment_date.short_description = 'Date'
    
    def is_past(self, obj):
        """Show if appointment is in the past"""
        today = timezone.now().date()
        current_time = timezone.now().time()
        
        if obj.schedule.date < today:
            return "Past"
        elif obj.schedule.date == today and obj.appointment_end_time < current_time:
            return "Past"
        else:
            return "Future"
    
    is_past.short_description = 'Status'