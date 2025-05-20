from rest_framework import viewsets, generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from .models import Patient, Doctor, DoctorSchedule, Appointment
from .serializers import (
    UserSerializer, PatientSerializer, DoctorSerializer,
    DoctorScheduleSerializer, AppointmentSerializer
)
from datetime import datetime, timedelta

# Authentication Views
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

# Doctor Views
class DoctorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer

# Appointment Views
class AvailableSlotsView(APIView):
    def get(self, request, doctor_id):
        # Get today's date
        today = datetime.now().date()
        # Get end date (30 days from now)
        end_date = today + timedelta(days=30)
        
        # Get doctor or return 404
        doctor = get_object_or_404(Doctor, id=doctor_id)
        
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
    
    def post(self, request, doctor_id, appointment_id):
        # Get the appointment
        appointment = get_object_or_404(
            Appointment, 
            id=appointment_id, 
            doctor_id=doctor_id,
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
