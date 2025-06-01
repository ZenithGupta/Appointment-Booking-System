from django.contrib import admin
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
    list_display = ('doctor', 'date', 'start_time', 'end_time', 'available_slots', 'is_active')
    list_filter = ('is_active', 'date', 'doctor')

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
    list_display = ('patient', 'doctor', 'schedule', 'status', 'created_at')
    list_filter = ('status', 'doctor')
    search_fields = ('patient__first_name', 'patient__last_name', 'doctor__first_name', 'doctor__last_name')