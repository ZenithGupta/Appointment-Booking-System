from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import (
    Doctor, DoctorSchedule, Specialty, Language, TimeSlot,
    Patient, MedicalHistory, Appointment
)

# User serializers with proper password handling
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password']
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True}
        }
    
    def create(self, validated_data):
        # Extract password and create user with proper password hashing
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)  # This properly hashes the password
        user.save()
        return user

# Custom login serializer for email-based authentication
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        if email and password:
            # Find user by email
            try:
                user = User.objects.get(email=email)
                # Authenticate using username and password
                user = authenticate(username=user.username, password=password)
                if user:
                    if user.is_active:
                        data['user'] = user
                    else:
                        raise serializers.ValidationError('User account is disabled.')
                else:
                    raise serializers.ValidationError('Invalid credentials.')
            except User.DoesNotExist:
                raise serializers.ValidationError('Invalid credentials.')
        else:
            raise serializers.ValidationError('Email and password are required.')
        
        return data

# Doctor related serializers
class SpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialty
        fields = '__all__'

class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = '__all__'

class DoctorSerializer(serializers.ModelSerializer):
    specialties = SpecialtySerializer(many=True, read_only=True)
    languages = LanguageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Doctor
        fields = '__all__'

class TimeSlotSerializer(serializers.ModelSerializer):
    formatted_time = serializers.SerializerMethodField()
    
    class Meta:
        model = TimeSlot
        fields = '__all__'
    
    def get_formatted_time(self, obj):
        return f"{obj.start_time.strftime('%I:%M %p')} - {obj.end_time.strftime('%I:%M %p')}"

class DoctorScheduleSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()
    time_range_display = serializers.CharField(source='get_time_range_display', read_only=True)
    slot_duration_display = serializers.CharField(source='get_slot_duration_display', read_only=True)
    available_time_slots = serializers.SerializerMethodField()
    
    class Meta:
        model = DoctorSchedule
        fields = '__all__'
    
    def get_doctor_name(self, obj):
        return str(obj.doctor)
    
    def get_available_time_slots(self, obj):
        if obj.time_range == 'slot-based':
            available_slots = obj.time_slots.filter(is_booked=False)
            return TimeSlotSerializer(available_slots, many=True).data
        else:
            return {
                'type': 'range-based',
                'start_time': obj.start_time.strftime('%H:%M'),
                'end_time': obj.end_time.strftime('%H:%M'),
                'message': 'Flexible appointment timing within the given range'
            }

# Patient related serializers
class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = '__all__'

class MedicalHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalHistory
        fields = '__all__'

# Appointment related serializers
class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    appointment_time_formatted = serializers.SerializerMethodField()
    schedule_type = serializers.CharField(source='schedule.time_range', read_only=True)
    
    class Meta:
        model = Appointment
        fields = '__all__'
    
    def get_patient_name(self, obj):
        return str(obj.patient)
    
    def get_doctor_name(self, obj):
        return str(obj.doctor)
    
    def get_appointment_time_formatted(self, obj):
        return f"{obj.appointment_start_time.strftime('%I:%M %p')} - {obj.appointment_end_time.strftime('%I:%M %p')}"

class BookAppointmentSerializer(serializers.Serializer):
    schedule_id = serializers.IntegerField()
    time_slot_id = serializers.IntegerField(required=False, help_text="Required for slot-based appointments")
    start_time = serializers.TimeField(required=False, help_text="Required for range-based appointments")
    end_time = serializers.TimeField(required=False, help_text="Required for range-based appointments")
    notes = serializers.CharField(required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False)
    phone_number = serializers.CharField(required=False)
    address = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        schedule_id = data.get('schedule_id')
        try:
            schedule = DoctorSchedule.objects.get(id=schedule_id)
            
            if schedule.time_range == 'slot-based':
                if not data.get('time_slot_id'):
                    raise serializers.ValidationError("time_slot_id is required for slot-based appointments")
            else:  # range-based
                if not data.get('start_time') or not data.get('end_time'):
                    raise serializers.ValidationError("start_time and end_time are required for range-based appointments")
                    
        except DoctorSchedule.DoesNotExist:
            raise serializers.ValidationError("Schedule not found")
        
        return data