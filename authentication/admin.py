from django.contrib import admin
from .models import (
    Patient, MedicalHistory, Doctor, Specialty, Language,
    DoctorSchedule, Appointment
)

admin.site.register(Patient)
admin.site.register(MedicalHistory)
admin.site.register(Specialty)
admin.site.register(Language)

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'get_specialties')
    
    def get_specialties(self, obj):
        return ", ".join([s.name for s in obj.specialties.all()])
    get_specialties.short_description = 'Specialties'

@admin.register(DoctorSchedule)
class DoctorScheduleAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'date', 'start_time', 'end_time', 'available_slots', 'is_active')
    list_filter = ('is_active', 'date', 'doctor')

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'schedule_date', 'schedule_time', 'status')
    list_filter = ('status', 'doctor')
    
    def schedule_date(self, obj):
        return obj.schedule.date
    
    def schedule_time(self, obj):
        return f"{obj.schedule.start_time} - {obj.schedule.end_time}"