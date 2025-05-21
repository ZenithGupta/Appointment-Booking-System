from django.contrib import admin
from .models import Patient, MedicalHistory

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'date_of_birth', 'phone_number')
    search_fields = ('first_name', 'last_name', 'phone_number')

@admin.register(MedicalHistory)
class MedicalHistoryAdmin(admin.ModelAdmin):
    list_display = ('patient', 'diagnosis', 'diagnosis_date')
    list_filter = ('diagnosis_date',)