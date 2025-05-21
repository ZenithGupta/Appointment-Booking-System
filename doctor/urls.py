from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'doctors', views.DoctorViewSet)
router.register(r'schedules', views.DoctorScheduleViewSet)
router.register(r'specialties', views.SpecialtyViewSet)
router.register(r'languages', views.LanguageViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('by-specialty/<int:specialty_id>/', views.DoctorsBySpecialtyView.as_view(), name='doctors-by-specialty'),
    path('doctors/<int:doctor_id>/available-slots/', views.AvailableSlotsView.as_view(), name='available-slots'),
]