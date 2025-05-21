from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Appointment
from .serializers import AppointmentSerializer
from doctor.models import Doctor, DoctorSchedule
from patient.models import Patient

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