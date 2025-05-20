from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'doctors', views.DoctorViewSet)

urlpatterns = [
    # Auth endpoints
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.CustomLoginView.as_view(), name='login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/profile/', views.UserProfileView.as_view(), name='profile'),
    
    # Doctor endpoints
    path('', include(router.urls)),
    
    # Appointment endpoints
    path('doctors/<int:doctor_id>/appointment/available-slots/', 
         views.AvailableSlotsView.as_view(), 
         name='available-slots'),
    path('doctors/<int:doctor_id>/appointment/book/', 
         views.BookAppointmentView.as_view(), 
         name='book-appointment'),
    path('doctors/<int:doctor_id>/appointment/<int:appointment_id>/cancel/', 
         views.CancelAppointmentView.as_view(), 
         name='cancel-appointment'),
]