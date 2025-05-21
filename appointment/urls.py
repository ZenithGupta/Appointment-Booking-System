from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'my-appointments', views.AppointmentViewSet, basename='my-appointments')

urlpatterns = [
    path('', include(router.urls)),
    path('book/<int:doctor_id>/', views.BookAppointmentView.as_view(), name='book-appointment'),
    path('cancel/<int:appointment_id>/', views.CancelAppointmentView.as_view(), name='cancel-appointment'),
]