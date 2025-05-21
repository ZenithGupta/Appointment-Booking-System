from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'profile', views.PatientViewSet, basename='patient')
router.register(r'medical-history', views.MedicalHistoryViewSet, basename='medical-history')

urlpatterns = [
    path('', include(router.urls)),
]