from rest_framework import serializers
from .models import Appointment

class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = '__all__'
    
    def get_patient_name(self, obj):
        return str(obj.patient)
    
    def get_doctor_name(self, obj):
        return str(obj.doctor)