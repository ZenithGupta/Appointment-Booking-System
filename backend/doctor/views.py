from rest_framework import viewsets, generics
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Doctor, DoctorSchedule, Specialty, Language
from .serializers import (
    DoctorSerializer, DoctorScheduleSerializer, 
    SpecialtySerializer, LanguageSerializer
)

class SpecialtyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Specialty.objects.all()
    serializer_class = SpecialtySerializer
    permission_classes = [AllowAny]

class LanguageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer
    permission_classes = [AllowAny]

class DoctorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['specialties', 'languages']
    search_fields = ['first_name', 'last_name', 'bio']

class DoctorsBySpecialtyView(generics.ListAPIView):
    serializer_class = DoctorSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        specialty_id = self.kwargs['specialty_id']
        return Doctor.objects.filter(specialties__id=specialty_id)

class DoctorScheduleViewSet(viewsets.ModelViewSet):
    queryset = DoctorSchedule.objects.all()
    serializer_class = DoctorScheduleSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]

class AvailableSlotsView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, doctor_id):
        from datetime import datetime, timedelta
        
        # Get today's date
        today = datetime.now().date()
        # Get end date (30 days from now by default)
        doctor = Doctor.objects.get(id=doctor_id)
        end_date = today + timedelta(days=30)
        
        # Get available schedules
        available_slots = DoctorSchedule.objects.filter(
            doctor=doctor,
            date__gte=today,
            date__lte=end_date,
            is_active=True,
            available_slots__gt=0
        ).order_by('date', 'start_time')
        
        serializer = DoctorScheduleSerializer(available_slots, many=True)
        return Response(serializer.data)