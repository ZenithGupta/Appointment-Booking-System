from rest_framework import generics, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta
from django.db import transaction
import re

from .models import (
    Doctor, DoctorSchedule, Specialty, Language, TimeSlot,
    Patient, MedicalHistory, Appointment
)
from .serializers import (
    UserSerializer, DoctorSerializer, DoctorScheduleSerializer, LoginSerializer,
    SpecialtySerializer, LanguageSerializer, PatientSerializer,
    MedicalHistorySerializer, AppointmentSerializer, BookAppointmentSerializer
)
from .enhanced_validation import (
    get_current_ist_time,
    validate_not_in_past,
    validate_appointment_booking,
    log_security_attempt,
    get_client_ip
)
import logging
logger = logging.getLogger(__name__)

class CustomPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        logger.info(f"📝 Registration attempt with data: {request.data}")
        
        mobile_number = request.data.get('mobile_number', '').strip()
        
        # MODIFIED: Add validation for mobile number uniqueness
        if mobile_number and Patient.objects.filter(phone_number=mobile_number).exists():
            return Response({
                "error": "A user with this mobile number already exists."
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        date_of_birth = request.data.get('date_of_birth', '2000-01-01')

        with transaction.atomic():
            user = serializer.save()
            patient_data = {
                'user': user,
                'first_name': user.first_name or 'Unknown',
                'last_name': user.last_name or 'User',
                'date_of_birth': date_of_birth,
                'phone_number': mobile_number,
                'address': ''
            }
            Patient.objects.create(**patient_data)
            logger.info(f"✅ User and patient profile created for: {user.email}")

        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token

        return Response({
            "user": UserSerializer(user).data,
            "refresh": str(refresh),
            "access": str(access_token),
            "mobile_number": mobile_number
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        logger.info(f"🔍 Login attempt: {email}")
        
        if not email or not password:
            return Response({
                'error': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            logger.info(f"🔍 User found: {user.username}")
            
            authenticated_user = authenticate(username=user.username, password=password)
            logger.info(f"🔍 Authentication result: {authenticated_user}")
            
            if authenticated_user and authenticated_user.is_active:
                refresh = RefreshToken.for_user(authenticated_user)
                access_token = refresh.access_token
                
                logger.info("✅ Login successful!")
                
                return Response({
                    'refresh': str(refresh),
                    'access': str(access_token),
                    'user_id': authenticated_user.id,
                    'email': authenticated_user.email,
                    'username': authenticated_user.username,
                    'first_name': authenticated_user.first_name,
                    'last_name': authenticated_user.last_name
                })
            else:
                logger.warning("❌ Authentication failed")
                return Response({
                    'error': 'Invalid credentials'
                }, status=status.HTTP_401_UNAUTHORIZED)
                
        except User.DoesNotExist:
            logger.warning("❌ User not found")
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

class SpecialtyViewSet(viewsets.ModelViewSet):
    queryset = Specialty.objects.all()
    serializer_class = SpecialtySerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

class LanguageViewSet(viewsets.ModelViewSet):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    filterset_fields = ['specialties', 'languages']
    search_fields = ['first_name', 'last_name', 'bio']
    pagination_class = CustomPagination
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

class DoctorsBySpecialtyView(generics.ListAPIView):
    serializer_class = DoctorSerializer
    permission_classes = [AllowAny]
    pagination_class = CustomPagination
    
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
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        try:
            schedule_date = serializer.validated_data.get('date')
            start_time = serializer.validated_data.get('start_time')
            
            validation_result = validate_not_in_past(schedule_date, start_time, buffer_minutes=30)
            
            if not validation_result['valid']:
                log_security_attempt(
                    user=self.request.user,
                    action='PAST_SCHEDULE_CREATION_ATTEMPT',
                    details=f"Attempted to create schedule for {schedule_date} at {start_time}. {validation_result['message']}",
                    ip_address=get_client_ip(self.request)
                )
                
                from rest_framework import serializers as drf_serializers
                raise drf_serializers.ValidationError({
                    'error': validation_result['message'],
                    'current_ist': validation_result['current_ist'].strftime('%Y-%m-%d %H:%M:%S IST')
                })
            
            serializer.save()
            
        except ValidationError as e:
            from rest_framework import serializers as drf_serializers
            raise drf_serializers.ValidationError(e.message_dict)

class AvailableSlotsView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, doctor_id):
        try:
            doctor = Doctor.objects.get(id=doctor_id)
        except Doctor.DoesNotExist:
            return Response({'error': 'Doctor not found'}, status=status.HTTP_404_NOT_FOUND)
        
        now_ist = get_current_ist_time()
        today = now_ist.date()
        current_time = now_ist.time()
        
        end_date = today + timedelta(days=30)
        
        available_slots = DoctorSchedule.objects.filter(
            doctor=doctor,
            date__gte=today,
            date__lte=end_date,
            is_active=True,
            available_slots__gt=0
        ).order_by('date', 'start_time')
        
        filtered_slots = []
        
        for schedule in available_slots:
            if schedule.date == today:
                buffer_time = (now_ist + timedelta(minutes=30)).time()
                if schedule.start_time > buffer_time:
                    filtered_slots.append(schedule)
            else:
                filtered_slots.append(schedule)
        
        serializer = DoctorScheduleSerializer(filtered_slots, many=True)
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
            
            validation_result = validate_not_in_past(schedule.date, schedule.start_time)
            
            if not validation_result['valid']:
                return Response({
                    'error': 'This schedule is no longer available',
                    'message': validation_result['message']
                }, status=status.HTTP_400_BAD_REQUEST)
            
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

class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Patient.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class MedicalHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = MedicalHistorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return MedicalHistory.objects.filter(patient__user=self.request.user)
    
    def perform_create(self, serializer):
        patient = get_object_or_404(Patient, user=self.request.user)
        serializer.save(patient=patient)

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        try:
            patient = Patient.objects.get(user=self.request.user)
            return Appointment.objects.filter(patient=patient)
        except Patient.DoesNotExist:
            return Appointment.objects.none()
    
    def perform_create(self, serializer):
        patient, created = Patient.objects.get_or_create(
            user=self.request.user,
            defaults={
                'first_name': self.request.user.first_name or 'Unknown',
                'last_name': self.request.user.last_name or 'User',
                'date_of_birth': '2000-01-01',
                'phone_number': '',
                'address': ''
            }
        )
        serializer.save(patient=patient)

class BookAppointmentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, doctor_id):
        client_ip = get_client_ip(request)
        logger.info(f"📅 Appointment booking attempt by {request.user.username} for doctor {doctor_id}")
        
        serializer = BookAppointmentSerializer(data=request.data)
        if not serializer.is_valid():
            log_security_attempt(
                user=request.user,
                action='INVALID_BOOKING_DATA',
                details=f"Invalid booking data: {serializer.errors}",
                ip_address=client_ip
            )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        schedule_id = data['schedule_id']
        
        try:
            schedule = DoctorSchedule.objects.get(id=schedule_id, doctor_id=doctor_id)
        except DoctorSchedule.DoesNotExist:
            return Response({
                'error': 'Schedule not found',
                'error_code': 'SCHEDULE_NOT_FOUND'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if schedule.time_range == 'slot-based':
            time_slot_id = data.get('time_slot_id')
            try:
                time_slot = TimeSlot.objects.get(
                    id=time_slot_id,
                    schedule=schedule,
                    is_booked=False
                )
                appointment_start_time = time_slot.start_time
                appointment_end_time = time_slot.end_time
            except TimeSlot.DoesNotExist:
                log_security_attempt(
                    user=request.user,
                    action='INVALID_TIME_SLOT',
                    details=f"Attempted to book invalid time slot {time_slot_id}",
                    ip_address=client_ip
                )
                return Response({
                    'error': 'Time slot not available',
                    'error_code': 'TIME_SLOT_NOT_AVAILABLE'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            appointment_start_time = data.get('start_time')
            appointment_end_time = data.get('end_time')
            time_slot = None
        
        validation_result = validate_appointment_booking(
            doctor_id=doctor_id,
            schedule_id=schedule_id,
            date=schedule.date,
            start_time=appointment_start_time,
            end_time=appointment_end_time,
            user=request.user
        )
        
        if not validation_result['valid']:
            if validation_result.get('error_code') in ['PAST_TIME', 'DATE_MISMATCH']:
                log_security_attempt(
                    user=request.user,
                    action='PAST_BOOKING_ATTEMPT',
                    details=f"Attempted to book past appointment: {validation_result['message']}",
                    ip_address=client_ip
                )
            
            return Response({
                'error': validation_result['message'],
                'error_code': validation_result.get('error_code'),
                'current_ist': validation_result['current_ist'].strftime('%Y-%m-%d %H:%M:%S IST')
            }, status=status.HTTP_400_BAD_REQUEST)
        
        patient, created = Patient.objects.get_or_create(
            user=request.user,
            defaults={
                'first_name': request.user.first_name or 'Unknown',
                'last_name': request.user.last_name or 'User',
                'date_of_birth': data.get('date_of_birth', '2000-01-01'),
                'phone_number': data.get('phone_number', ''),
                'address': data.get('address', '')
            }
        )
        
        try:
            if time_slot:
                time_slot.is_booked = True
                time_slot.save()
            
            appointment = Appointment.objects.create(
                patient=patient,
                doctor_id=doctor_id,
                schedule=schedule,
                time_slot=time_slot,
                appointment_start_time=appointment_start_time,
                appointment_end_time=appointment_end_time,
                notes=data.get('notes', '')
            )
            
            schedule.available_slots -= 1
            schedule.save()
            
            logger.info(f"✅ Appointment booked successfully: {appointment.id} by {request.user.username}")
            
            return Response({
                'message': 'Appointment booked successfully',
                'appointment': AppointmentSerializer(appointment).data,
                'booking_time_ist': get_current_ist_time().strftime('%Y-%m-%d %H:%M:%S IST')
            }, status=status.HTTP_201_CREATED)
            
        except ValidationError as e:
            if time_slot:
                time_slot.is_booked = False
                time_slot.save()
            
            return Response({
                'error': str(e),
                'error_code': 'VALIDATION_ERROR'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            if time_slot:
                time_slot.is_booked = False
                time_slot.save()
            
            logger.error(f"❌ Error creating appointment: {str(e)}", exc_info=True)
            return Response({
                'error': 'Failed to create appointment',
                'error_code': 'CREATION_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CancelAppointmentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, appointment_id):
        try:
            appointment = Appointment.objects.get(
                id=appointment_id,
                patient__user=request.user
            )
        except Appointment.DoesNotExist:
            return Response({
                'error': 'Appointment not found',
                'error_code': 'APPOINTMENT_NOT_FOUND'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if appointment.status != 'scheduled':
            return Response({
                'error': 'This appointment cannot be canceled',
                'error_code': 'CANNOT_CANCEL'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        now_ist = get_current_ist_time()
        appointment_datetime = datetime.combine(
            appointment.schedule.date, 
            appointment.appointment_start_time
        )
        
        if appointment.schedule.date == now_ist.date():
            time_until_appointment = (appointment_datetime.time().hour * 60 + appointment_datetime.time().minute) - (now_ist.hour * 60 + now_ist.minute)
            
            if time_until_appointment < 120:
                return Response({
                    'error': 'Cannot cancel appointment less than 2 hours before the scheduled time',
                    'error_code': 'TOO_LATE_TO_CANCEL'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        appointment.status = 'canceled'
        appointment.save()
        
        if appointment.time_slot:
            appointment.time_slot.is_booked = False
            appointment.time_slot.save()
        
        schedule = appointment.schedule
        schedule.available_slots += 1
        schedule.save()
        
        logger.info(f"❌ Appointment {appointment_id} canceled by {request.user.username}")
        
        return Response({
            'message': 'Appointment canceled successfully',
            'canceled_at_ist': now_ist.strftime('%Y-%m-%d %H:%M:%S IST')
        }, status=status.HTTP_200_OK)
    
class SendOTPView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        mobile_number = request.data.get('mobile_number', '').strip()
        
        if not mobile_number:
            return Response({
                'error': 'Mobile number is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not re.match(r'^\d{10}$', mobile_number):
            return Response({
                'error': 'Please enter a valid 10-digit mobile number'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            patient = Patient.objects.select_related('user').get(
                phone_number=mobile_number
            )
            
            if not patient.user or not patient.user.is_active:
                return Response({
                    'error': 'No active account found with this mobile number'
                }, status=status.HTTP_404_NOT_FOUND)
            
            logger.info(f"📱 OTP requested for mobile: {mobile_number}")
            
            return Response({
                'message': 'OTP sent successfully',
                'mobile_number': mobile_number,
                'demo_otp': '111'
            }, status=status.HTTP_200_OK)
            
        except Patient.DoesNotExist:
            return Response({
                'error': 'No account found with this mobile number. Please register first.'
            }, status=status.HTTP_404_NOT_FOUND)

class VerifyOTPLoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        mobile_number = request.data.get('mobile_number', '').strip()
        otp = request.data.get('otp', '').strip()
        
        if not mobile_number or not otp:
            return Response({
                'error': 'Mobile number and OTP are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if otp != '111':
            return Response({
                'error': 'Invalid OTP. Please try again.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            patient = Patient.objects.select_related('user').get(
                phone_number=mobile_number
            )
            
            user = patient.user
            
            if not user or not user.is_active:
                return Response({
                    'error': 'Account is not active'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            logger.info(f"✅ Mobile login successful for: {mobile_number}")
            
            return Response({
                'refresh': str(refresh),
                'access': str(access_token),
                'user_id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'mobile_number': mobile_number,
                'login_method': 'mobile'
            }, status=status.HTTP_200_OK)
            
        except Patient.DoesNotExist:
            return Response({
                'error': 'No account found with this mobile number'
            }, status=status.HTTP_404_NOT_FOUND)