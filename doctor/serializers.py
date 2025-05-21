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
    
    class Meta:
        model = Doctor
        fields = '__all__'

class DoctorScheduleSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = DoctorSchedule
        fields = '__all__'
    
    def get_doctor_name(self, obj):
        return str(obj.doctor)