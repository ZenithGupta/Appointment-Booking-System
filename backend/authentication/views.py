from rest_framework import generics, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta

from .models import (
    Doctor, DoctorSchedule, Specialty, Language,
    Patient, MedicalHistory, Appointment
)
from .serializers import (
    UserSerializer, DoctorSerializer, DoctorScheduleSerializer,
    SpecialtySerializer, LanguageSerializer, PatientSerializer,
    MedicalHistorySerializer, AppointmentSerializer
)

# Authentication views
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            "user": UserSerializer(user).data,
            "token": token.key
        })

class CustomLoginView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        token = Token.objects.get(key=response.data['token'])
        user = token.user
        return Response({
            'token': token.key,
            'user_id': user.id,
            'email': user.email
        })

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        request.user.auth_token.delete()
        return Response(status=status.HTTP_200_OK)

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        new_password = request.data.get('new_password')
        
        if not new_password:
            return Response({"error": "New password is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(new_password)
        user.save()
        return Response({"success": "Password updated successfully"}, status=status.HTTP_200_OK)

# Doctor views
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

# Patient views
class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see their own patient profile
        return Patient.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class MedicalHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = MedicalHistorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see their own medical history
        return MedicalHistory.objects.filter(patient__user=self.request.user)
    
    def perform_create(self, serializer):
        patient = get_object_or_404(Patient, user=self.request.user)
        serializer.save(patient=patient)

# Appointment views
class AppointmentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see their own appointments
        patient = get_object_or_404(Patient, user=self.request.user)
        return Appointment.objects.filter(patient=patient)

class BookAppointmentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, doctor_id):
        # Get the schedule
        schedule_id = request.data.get('schedule_id')
        schedule = get_object_or_404(DoctorSchedule, id=schedule_id, doctor_id=doctor_id)
        
        # Check if slots are available
        if schedule.available_slots <= 0:
            return Response({
                'message': 'No available slots for this schedule'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create patient for this user
        patient, created = Patient.objects.get_or_create(
            user=request.user,
            defaults={
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                # You'll need to collect these fields separately
                'date_of_birth': request.data.get('date_of_birth'),
                'phone_number': request.data.get('phone_number'),
                'address': request.data.get('address', '')
            }
        )
        
        # Create appointment
        appointment = Appointment.objects.create(
            patient=patient,
            doctor_id=doctor_id,
            schedule=schedule,
            notes=request.data.get('notes', '')
        )
        
        # Reduce available slots
        schedule.available_slots -= 1
        schedule.save()
        
        return Response({
            'message': 'Appointment booked successfully',
            'appointment': AppointmentSerializer(appointment).data
        }, status=status.HTTP_201_CREATED)

class CancelAppointmentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, appointment_id):
        # Get the appointment
        appointment = get_object_or_404(
            Appointment, 
            id=appointment_id,
            patient__user=request.user
        )
        
        # Check if appointment can be canceled
        if appointment.status != 'scheduled':
            return Response({
                'message': 'This appointment cannot be canceled'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update status
        appointment.status = 'canceled'
        appointment.save()
        
        # Increase available slots
        schedule = appointment.schedule
        schedule.available_slots += 1
        schedule.save()
        
        return Response({
            'message': 'Appointment canceled successfully'
        }, status=status.HTTP_200_OK)