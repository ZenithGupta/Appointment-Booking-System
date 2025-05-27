from rest_framework import generics, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta

from .models import (
    Doctor, DoctorSchedule, Specialty, Language, TimeSlot,
    Patient, MedicalHistory, Appointment
)
from .serializers import (
    UserSerializer, DoctorSerializer, DoctorScheduleSerializer,
    SpecialtySerializer, LanguageSerializer, PatientSerializer,
    MedicalHistorySerializer, AppointmentSerializer, BookAppointmentSerializer
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
        
        # Create JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        return Response({
            "user": UserSerializer(user).data,
            "refresh": str(refresh),
            "access": str(access_token)
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({
                'error': 'Please provide both username and password'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        
        if user:
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            return Response({
                'refresh': str(refresh),
                'access': str(access_token),
                'user_id': user.id,
                'email': user.email,
                'username': user.username
            })
        else:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

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

# Doctor related views
class SpecialtyViewSet(viewsets.ModelViewSet):
    queryset = Specialty.objects.all()
    serializer_class = SpecialtySerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]  # Anyone can view specialties
        else:
            permission_classes = [IsAuthenticated]  # Must be logged in to create/edit/delete
        return [permission() for permission in permission_classes]

class LanguageViewSet(viewsets.ModelViewSet):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]  # Anyone can view languages
        else:
            permission_classes = [IsAuthenticated]  # Must be logged in to create/edit/delete
        return [permission() for permission in permission_classes]

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    filterset_fields = ['specialties', 'languages']
    search_fields = ['first_name', 'last_name', 'bio']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]  # Anyone can view doctors
        else:
            permission_classes = [IsAuthenticated]  # Must be logged in to create/edit/delete
        return [permission() for permission in permission_classes]

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
            permission_classes = [AllowAny]  # Anyone can view schedules
        else:
            permission_classes = [IsAuthenticated]  # Must be logged in to create/edit/delete
        return [permission() for permission in permission_classes]

class AvailableSlotsView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, doctor_id):
        # Get today's date
        today = datetime.now().date()
        # Get end date (30 days from now by default)
        try:
            doctor = Doctor.objects.get(id=doctor_id)
        except Doctor.DoesNotExist:
            return Response({'error': 'Doctor not found'}, status=status.HTTP_404_NOT_FOUND)
        
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

class AvailableTimeSlotsView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, doctor_id, schedule_id):
        try:
            schedule = DoctorSchedule.objects.get(
                id=schedule_id, 
                doctor_id=doctor_id, 
                is_active=True
            )
            serializer = DoctorScheduleSerializer(schedule)
            return Response({
                'schedule': serializer.data,
                'available_slots': serializer.data['available_time_slots']
            })
        except DoctorSchedule.DoesNotExist:
            return Response(
                {'error': 'Schedule not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

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
class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see their own appointments
        try:
            patient = Patient.objects.get(user=self.request.user)
            return Appointment.objects.filter(patient=patient)
        except Patient.DoesNotExist:
            return Appointment.objects.none()
    
    def perform_create(self, serializer):
        # Get or create patient for this user
        patient, created = Patient.objects.get_or_create(
            user=self.request.user,
            defaults={
                'first_name': self.request.user.first_name or 'Unknown',
                'last_name': self.request.user.last_name or 'User',
                'date_of_birth': '2000-01-01',  # Default date
                'phone_number': '',
                'address': ''
            }
        )
        serializer.save(patient=patient)

class BookAppointmentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, doctor_id):
        serializer = BookAppointmentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        schedule_id = data['schedule_id']
        
        # Get the schedule
        try:
            schedule = DoctorSchedule.objects.get(id=schedule_id, doctor_id=doctor_id)
        except DoctorSchedule.DoesNotExist:
            return Response({
                'message': 'Schedule not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if there are available slots
        if schedule.available_slots <= 0:
            return Response({
                'message': 'No available slots for this schedule'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create patient for this user
        patient, created = Patient.objects.get_or_create(
            user=request.user,
            defaults={
                'first_name': request.user.first_name or 'Unknown',
                'last_name': request.user.last_name or 'User',
                'date_of_birth': data.get('date_of_birth'),
                'phone_number': data.get('phone_number', ''),
                'address': data.get('address', '')
            }
        )
        
        # Handle slot-based vs range-based appointments
        time_slot = None
        if schedule.time_range == 'slot-based':
            # For slot-based appointments
            time_slot_id = data.get('time_slot_id')
            try:
                time_slot = TimeSlot.objects.get(
                    id=time_slot_id,
                    schedule=schedule,
                    is_booked=False
                )
                time_slot.is_booked = True
                time_slot.save()
                
                appointment_start_time = time_slot.start_time
                appointment_end_time = time_slot.end_time
                
            except TimeSlot.DoesNotExist:
                return Response({
                    'message': 'Time slot not available'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            # For range-based appointments
            appointment_start_time = data.get('start_time')
            appointment_end_time = data.get('end_time')
        
        # Create appointment
        appointment = Appointment.objects.create(
            patient=patient,
            doctor_id=doctor_id,
            schedule=schedule,
            time_slot=time_slot,
            appointment_start_time=appointment_start_time,
            appointment_end_time=appointment_end_time,
            notes=data.get('notes', '')
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
        try:
            appointment = Appointment.objects.get(
                id=appointment_id,
                patient__user=request.user
            )
        except Appointment.DoesNotExist:
            return Response({
                'message': 'Appointment not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if appointment can be canceled
        if appointment.status != 'scheduled':
            return Response({
                'message': 'This appointment cannot be canceled'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update status
        appointment.status = 'canceled'
        appointment.save()
        
        # Mark time slot as available if it was slot-based
        if appointment.time_slot:
            appointment.time_slot.is_booked = False
            appointment.time_slot.save()
        
        # Increase available slots
        schedule = appointment.schedule
        schedule.available_slots += 1
        schedule.save()
        
        return Response({
            'message': 'Appointment canceled successfully'
        }, status=status.HTTP_200_OK)