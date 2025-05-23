from rest_framework import serializers
from .models import Doctor, DoctorSchedule, Specialty, Language

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
    specialty_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True, 
        required=False,
        help_text="List of specialty IDs to assign to this doctor"
    )
    language_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True, 
        required=False,
        help_text="List of language IDs to assign to this doctor"
    )
    
    class Meta:
        model = Doctor
        fields = ['id', 'user', 'first_name', 'last_name', 'time_range', 'bio', 'profile_picture',
                 'specialties', 'languages', 'specialty_ids', 'language_ids']
    
    def create(self, validated_data):
        # Extract the IDs for many-to-many relationships
        specialty_ids = validated_data.pop('specialty_ids', [])
        language_ids = validated_data.pop('language_ids', [])
        
        # Create the doctor
        doctor = Doctor.objects.create(**validated_data)
        
        # Set many-to-many relationships
        if specialty_ids:
            doctor.specialties.set(specialty_ids)
        if language_ids:
            doctor.languages.set(language_ids)
            
        return doctor
    
    def update(self, instance, validated_data):
        # Extract the IDs for many-to-many relationships
        specialty_ids = validated_data.pop('specialty_ids', None)
        language_ids = validated_data.pop('language_ids', None)
        
        # Update regular fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update many-to-many relationships if provided
        if specialty_ids is not None:
            instance.specialties.set(specialty_ids)
        if language_ids is not None:
            instance.languages.set(language_ids)
            
        return instance

class DoctorScheduleSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = DoctorSchedule
        fields = '__all__'
    
    def get_doctor_name(self, obj):
        return str(obj.doctor)