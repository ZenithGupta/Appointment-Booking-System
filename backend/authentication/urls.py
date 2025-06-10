from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

# Create router and register viewsets
router = DefaultRouter()

# Doctor related routes
router.register(r'doctors', views.DoctorViewSet)
router.register(r'schedules', views.DoctorScheduleViewSet)
router.register(r'specialties', views.SpecialtyViewSet)
router.register(r'languages', views.LanguageViewSet)

# Patient related routes
router.register(r'patient/profile', views.PatientViewSet, basename='patient')
router.register(r'patient/medical-history', views.MedicalHistoryViewSet, basename='medical-history')

# Appointment related routes
router.register(r'appointment/my-appointments', views.AppointmentViewSet, basename='my-appointments')

urlpatterns = [
    # Authentication URLs (JWT)
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    
    # NEW: Mobile login endpoints
    path('send-otp/', views.SendOTPView.as_view(), name='send-otp'),
    path('verify-otp-login/', views.VerifyOTPLoginView.as_view(), name='verify-otp-login'),
    
    # Doctor specific URLs
    path('doctors/by-specialty/<int:specialty_id>/', views.DoctorsBySpecialtyView.as_view(), name='doctors-by-specialty'),
    path('doctors/<int:doctor_id>/available-slots/', views.AvailableSlotsView.as_view(), name='available-slots'),
    path('doctors/<int:doctor_id>/schedules/<int:schedule_id>/available-slots/', 
         views.AvailableTimeSlotsView.as_view(), 
         name='available-time-slots'),
    
    # Appointment specific URLs
    path('appointment/book/<int:doctor_id>/', views.BookAppointmentView.as_view(), name='book-appointment'),
    path('appointment/cancel/<int:appointment_id>/', views.CancelAppointmentView.as_view(), name='cancel-appointment'),
    
    # Include router URLs
    path('', include(router.urls)),
]