# Create this file: backend/authentication/management/commands/populate_db.py

import random
from datetime import datetime, timedelta, time
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from authentication.models import (
    Specialty, Language, Doctor, DoctorSchedule, 
    Patient, MedicalHistory, Appointment
)

class Command(BaseCommand):
    help = 'Populate database with sample data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting database population...'))
        
        # Clear existing data (except superuser)
        self.clear_data()
        
        # Create sample data
        self.create_specialties()
        self.create_languages()
        self.create_doctors()
        self.create_schedules()
        self.create_sample_patients()
        
        self.stdout.write(self.style.SUCCESS('Database populated successfully!'))

    def clear_data(self):
        """Clear existing data except superuser"""
        self.stdout.write('Clearing existing data...')
        
        # Keep superuser, delete other users
        User.objects.filter(is_superuser=False).delete()
        
        # Clear all related data
        Doctor.objects.all().delete()
        DoctorSchedule.objects.all().delete()
        Patient.objects.all().delete()
        MedicalHistory.objects.all().delete()
        Appointment.objects.all().delete()
        Specialty.objects.all().delete()
        Language.objects.all().delete()

    def create_specialties(self):
        """Create medical specialties"""
        self.stdout.write('Creating specialties...')
        
        specialties = [
            'Cardiologist',
            'Neurologist', 
            'Orthopedic Surgeon',
            'Pediatrician',
            'Gastroenterologist',
            'Dermatologist',
            'Psychiatrist',
            'Ophthalmologist',
            'ENT Specialist',
            'Endocrinologist',
            'Urologist',
            'Oncologist'
        ]
        
        for name in specialties:
            Specialty.objects.get_or_create(name=name)
        
        self.stdout.write(f'Created {len(specialties)} specialties')

    def create_languages(self):
        """Create languages"""
        self.stdout.write('Creating languages...')
        
        languages = [
            'English',
            'Hindi', 
            'Gujarati',
            'Marathi',
            'Telugu',
            'Tamil',
            'Bengali',
            'Punjabi'
        ]
        
        for name in languages:
            Language.objects.get_or_create(name=name)
            
        self.stdout.write(f'Created {len(languages)} languages')

    def create_doctors(self):
        """Create sample doctors"""
        self.stdout.write('Creating doctors...')
        
        doctors_data = [
            {
                'first_name': 'Rajesh',
                'last_name': 'Kumar',
                'degree': 'MBBS, MD Cardiology',
                'years_of_experience': 15,
                'bio': 'Dr. Rajesh Kumar is a highly experienced Cardiologist with over 15 years of dedicated practice in cardiovascular medicine. He specializes in interventional cardiology and has performed over 5000 successful procedures.',
                'specialty': 'Cardiologist'
            },
            {
                'first_name': 'Priya',
                'last_name': 'Sharma', 
                'degree': 'MBBS, MD Neurology',
                'years_of_experience': 12,
                'bio': 'Dr. Priya Sharma is a renowned Neurologist specializing in stroke care and neurodegenerative diseases. Her expertise includes advanced neuroimaging and minimally invasive procedures.',
                'specialty': 'Neurologist'
            },
            {
                'first_name': 'Amit',
                'last_name': 'Patel',
                'degree': 'MBBS, MS Orthopedics', 
                'years_of_experience': 18,
                'bio': 'Dr. Amit Patel is a leading Orthopedic Surgeon with extensive experience in joint replacement surgeries and sports medicine. He has successfully performed over 3000 joint replacement procedures.',
                'specialty': 'Orthopedic Surgeon'
            },
            {
                'first_name': 'Sneha',
                'last_name': 'Reddy',
                'degree': 'MBBS, MD Pediatrics',
                'years_of_experience': 10,
                'bio': 'Dr. Sneha Reddy is a compassionate Pediatrician specializing in child development and pediatric emergency care. She is known for her gentle approach with children and comprehensive care.',
                'specialty': 'Pediatrician'
            },
            {
                'first_name': 'Vikram',
                'last_name': 'Singh',
                'degree': 'MBBS, MD Gastroenterology', 
                'years_of_experience': 14,
                'bio': 'Dr. Vikram Singh is an expert Gastroenterologist with specialization in advanced endoscopic procedures and liver diseases. He has been recognized for his innovative treatment approaches.',
                'specialty': 'Gastroenterologist'
            },
            {
                'first_name': 'Kavitha',
                'last_name': 'Nair',
                'degree': 'MBBS, MD Dermatology',
                'years_of_experience': 11,
                'bio': 'Dr. Kavitha Nair is a skilled Dermatologist specializing in cosmetic dermatology and skin cancer treatment. She is known for her expertise in laser treatments and advanced skin care procedures.',
                'specialty': 'Dermatologist'
            },
            {
                'first_name': 'Arjun',
                'last_name': 'Mehta',
                'degree': 'MBBS, MD Psychiatry',
                'years_of_experience': 9,
                'bio': 'Dr. Arjun Mehta is a dedicated Psychiatrist specializing in anxiety disorders, depression, and cognitive behavioral therapy. He believes in holistic mental health care.',
                'specialty': 'Psychiatrist'
            },
            {
                'first_name': 'Ravi',
                'last_name': 'Gupta',
                'degree': 'MBBS, MS Ophthalmology',
                'years_of_experience': 16,
                'bio': 'Dr. Ravi Gupta is an experienced Ophthalmologist specializing in cataract and retinal surgeries. He has performed over 8000 successful eye surgeries.',
                'specialty': 'Ophthalmologist'
            }
        ]
        
        all_languages = list(Language.objects.all())
        
        for doctor_data in doctors_data:
            # Create doctor
            specialty = Specialty.objects.get(name=doctor_data['specialty'])
            
            doctor = Doctor.objects.create(
                first_name=doctor_data['first_name'],
                last_name=doctor_data['last_name'],
                degree=doctor_data['degree'],
                years_of_experience=doctor_data['years_of_experience'],
                bio=doctor_data['bio']
            )
            
            # Add specialty
            doctor.specialties.add(specialty)
            
            # Add random languages (2-4 languages per doctor)
            languages_to_add = random.sample(all_languages, random.randint(2, 4))
            doctor.languages.set(languages_to_add)
            
        self.stdout.write(f'Created {len(doctors_data)} doctors')

    def create_schedules(self):
        """Create schedules for doctors"""
        self.stdout.write('Creating doctor schedules...')
        
        doctors = Doctor.objects.all()
        
        # Create schedules for next 30 days
        start_date = datetime.now().date()
        
        schedule_count = 0
        
        for doctor in doctors:
            for i in range(30):  # Next 30 days
                current_date = start_date + timedelta(days=i)
                
                # Skip some days randomly (doctors don't work every day)
                if random.random() < 0.3:  # 30% chance to skip a day
                    continue
                
                # Morning slot
                if random.random() < 0.8:  # 80% chance for morning slot
                    morning_schedule = DoctorSchedule.objects.create(
                        doctor=doctor,
                        date=current_date,
                        time_range='slot-based',
                        start_time=time(9, 0),  # 9:00 AM
                        end_time=time(12, 0),   # 12:00 PM
                        slot_duration=30,       # 30 minutes each slot
                        available_slots=6,      # Will be auto-calculated
                        is_active=True
                    )
                    schedule_count += 1
                
                # Evening slot
                if random.random() < 0.7:  # 70% chance for evening slot
                    evening_schedule = DoctorSchedule.objects.create(
                        doctor=doctor,
                        date=current_date,
                        time_range='slot-based',
                        start_time=time(14, 0),  # 2:00 PM
                        end_time=time(17, 0),    # 5:00 PM
                        slot_duration=30,        # 30 minutes each slot
                        available_slots=6,       # Will be auto-calculated
                        is_active=True
                    )
                    schedule_count += 1
        
        self.stdout.write(f'Created {schedule_count} schedules')

    def create_sample_patients(self):
        """Create a few sample patients and appointments"""
        self.stdout.write('Creating sample patients...')
        
        # Create some sample users first
        sample_users = [
            {
                'username': 'patient1',
                'email': 'patient1@example.com',
                'first_name': 'John',
                'last_name': 'Doe',
                'password': 'password123'
            },
            {
                'username': 'patient2', 
                'email': 'patient2@example.com',
                'first_name': 'Jane',
                'last_name': 'Smith',
                'password': 'password123'
            },
            {
                'username': 'patient3',
                'email': 'patient3@example.com', 
                'first_name': 'Mike',
                'last_name': 'Johnson',
                'password': 'password123'
            }
        ]
        
        for user_data in sample_users:
            # Create user
            user = User.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                password=user_data['password']
            )
            
            # Create patient profile
            patient = Patient.objects.create(
                user=user,
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                date_of_birth=datetime(1990, 1, 1).date(),
                phone_number=f'+91-98765-4321{random.randint(0, 9)}',
                address=f'{random.randint(100, 999)} Sample Street, Vadodara, Gujarat'
            )
            
            # Create some medical history
            MedicalHistory.objects.create(
                patient=patient,
                diagnosis='Regular Checkup',
                diagnosis_date=datetime.now().date() - timedelta(days=30),
                treatment='Blood pressure and diabetes screening',
                notes='Patient is healthy, recommended annual checkup'
            )
        
        self.stdout.write(f'Created {len(sample_users)} sample patients')

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear-only',
            action='store_true',
            help='Only clear data, do not populate',
        )