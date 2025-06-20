from django.contrib import admin
from django.utils import timezone
from .models import (
    Doctor, DoctorSchedule, Specialty, Language,
    Patient, MedicalHistory, Appointment
)
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

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
        today = timezone.now().date()
        current_time = timezone.now().time()
        if obj.date < today or (obj.date == today and obj.end_time < current_time):
            return "Past"
        return "Future"
    is_past.short_description = 'Status'
    
    # MODIFIED: Control which records are visible based on permissions and role
    def get_queryset(self, request):
        qs = super().get_queryset(request)

        # Doctors are a special case: they have permission but should only see their own data.
        if request.user.groups.filter(name='Doctor').exists():
            return qs.filter(doctor__user=request.user)
        
        # Superusers or users with general 'view_doctorschedule' permission see everything.
        # This is how 'Hospital Admin' gets access now.
        if request.user.is_superuser or request.user.has_perm('authentication.view_doctorschedule'):
            return qs
            
        # Other users (if any) see nothing
        return qs.none()

# Patient related admin
@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'date_of_birth', 'phone_number')
    search_fields = ('first_name', 'last_name', 'phone_number')

@admin.register(MedicalHistory)
class MedicalHistoryAdmin(admin.ModelAdmin):
    list_display = ('patient', 'diagnosis', 'diagnosis_date')
    list_filter = ('diagnosis_date',)

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    base_list_display = ('patient', 'doctor', 'schedule', 'status', 'is_past')
    list_filter = ('status', 'doctor', 'schedule__date')
    search_fields = ('patient__first_name', 'patient__last_name', 'doctor__first_name', 'doctor__last_name')
    
    def get_list_display(self, request):
        # Superuser can get extra technical fields
        if request.user.is_superuser:
            return self.base_list_display + ('created_at',)
        return self.base_list_display

    # MODIFIED: Control which records are visible based on permissions and role
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        
        # Superusers or users with 'view_appointment' permission see all appointments.
        if request.user.is_superuser or request.user.has_perm('authentication.view_appointment'):
            return qs
            
        # Doctors are a special case: they can view appointments, but only their own.
        if request.user.groups.filter(name='Doctor').exists():
            return qs.filter(doctor__user=request.user)
            
        return qs.none()

    def is_past(self, obj):
        today = timezone.now().date()
        current_time = timezone.now().time()
        if obj.schedule.date < today or (obj.schedule.date == today and obj.appointment_end_time < current_time):
            return "Past"
        return "Future"
    is_past.short_description = 'Status'

# --- Superuser-Only Token Management ---
# Using more robust permission checks to ensure these are only visible to superusers.

class SuperuserOnlyAdmin(admin.ModelAdmin):
    """A mixin to make a ModelAdmin strictly for superusers."""
    def has_permission(self, request):
        return request.user.is_superuser

    def has_view_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_add_permission(self, request):
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser

class OutstandingTokenAdmin(SuperuserOnlyAdmin):
    list_display = ('id', 'user', 'jti', 'created_at', 'expires_at')
    search_fields = ('user__username', 'jti')
    ordering = ('-created_at',)

class BlacklistedTokenAdmin(SuperuserOnlyAdmin):
    list_display = ('id', 'token_jti', 'blacklisted_at')
    search_fields = ('token__jti',)
    ordering = ('-blacklisted_at',)
    def token_jti(self, obj):
        return obj.token.jti
    token_jti.short_description = 'Token JTI'

if admin.site.is_registered(OutstandingToken):
    admin.site.unregister(OutstandingToken)

if admin.site.is_registered(BlacklistedToken):
    admin.site.unregister(BlacklistedToken)

admin.site.register(OutstandingToken, OutstandingTokenAdmin)
admin.site.register(BlacklistedToken, BlacklistedTokenAdmin)