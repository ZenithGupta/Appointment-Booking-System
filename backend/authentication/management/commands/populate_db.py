# Save this as: backend/authentication/management/commands/populate_db.py

import random
from datetime import datetime, timedelta, time
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from authentication.models import (
    Specialty, Language, Doctor, DoctorSchedule, 
    Patient, MedicalHistory, Appointment
)
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Populate database with sample data including both slot-based and range-based schedules'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear-only',
            action='store_true',
            help='Only clear data, do not populate',
        )
        parser.add_argument(
            '--no-clear',
            action='store_true',
            help='Do not clear existing data, just add more',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting database population...'))
        
        # Show current database status
        self.stdout.write('Current database status:')
        self.stdout.write(f'  - Doctors: {Doctor.objects.count()}')
        self.stdout.write(f'  - Schedules: {DoctorSchedule.objects.count()}')
        self.stdout.write(f'  - Users: {User.objects.count()}')
        self.stdout.write(f'  - Patients: {Patient.objects.count()}')
        
        # Clear existing data unless --no-clear is specified
        if not options['no_clear']:
            self.clear_data()
        else:
            self.stdout.write('Skipping data clearing (--no-clear specified)')
        
        if options['clear_only']:
            self.stdout.write(self.style.SUCCESS('Data cleared successfully!'))
            return
        
        # Create setup groups and Hospital Admin
        self.create_setup_groups()
        self.create_hospital_admin()
        
        # Create sample data
        self.create_specialties()
        self.create_languages()
        self.create_doctors()
        self.create_mixed_schedules()  # NEW: Mixed schedule types
        self.create_sample_patients()
        
        # Final summary
        self.stdout.write(self.style.SUCCESS('\n=== FINAL DATABASE SUMMARY ==='))
        self.stdout.write(f'✅ Specialties: {Specialty.objects.count()}')
        self.stdout.write(f'✅ Languages: {Language.objects.count()}')
        self.stdout.write(f'✅ Doctors: {Doctor.objects.count()}')
        self.stdout.write(f'✅ Total Schedules: {DoctorSchedule.objects.count()}')
        self.stdout.write(f'   - Slot-based: {DoctorSchedule.objects.filter(time_range="slot-based").count()}')
        self.stdout.write(f'   - Range-based: {DoctorSchedule.objects.filter(time_range="range-based").count()}')
        self.stdout.write(f'✅ Patients: {Patient.objects.count()}')
        self.stdout.write(f'✅ Users: {User.objects.count()}')
        
        self.stdout.write(self.style.SUCCESS('\nDatabase populated successfully!'))

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
            'Oncologist',
            'Pulmonologist',
            'Rheumatologist',
            'Anesthesiologist'
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
            'Punjabi',
            'Urdu',
            'Malayalam'
        ]
        
        for name in languages:
            Language.objects.get_or_create(name=name)
            
        self.stdout.write(f'Created {len(languages)} languages')

    def create_doctors(self):
        """Create sample doctors with more variety"""
        self.stdout.write('Creating doctors...')
        
        doctors_data = [
            # Cardiologists
            {
                'first_name': 'Rajesh',
                'last_name': 'Kumar',
                'degree': 'MBBS, MD Cardiology, FESC',
                'years_of_experience': 15,
                'bio': 'Dr. Rajesh Kumar is a highly experienced Cardiologist with over 15 years of dedicated practice in cardiovascular medicine. He specializes in interventional cardiology and has performed over 5000 successful procedures.',
                'specialty': 'Cardiologist',
                'schedule_preference': 'slot-based'
            },
            {
                'first_name': 'Deepak',
                'last_name': 'Shah',
                'degree': 'MBBS, MD Cardiology, Fellowship in Interventional Cardiology',
                'years_of_experience': 22,
                'bio': 'Dr. Deepak Shah is a senior interventional cardiologist specializing in complex coronary interventions and structural heart disease. He has pioneered several advanced cardiac procedures.',
                'specialty': 'Cardiologist',
                'schedule_preference': 'range-based'
            },
            {
                'first_name': 'Sunita',
                'last_name': 'Verma',
                'degree': 'MBBS, MD Cardiology, DM Cardiology',
                'years_of_experience': 8,
                'bio': 'Dr. Sunita Verma specializes in non-invasive cardiology and cardiac imaging. She has expertise in echocardiography and cardiac rehabilitation programs.',
                'specialty': 'Cardiologist',
                'schedule_preference': 'slot-based'
            },

            # Neurologists
            {
                'first_name': 'Priya',
                'last_name': 'Sharma', 
                'degree': 'MBBS, MD Neurology, DM',
                'years_of_experience': 12,
                'bio': 'Dr. Priya Sharma is a renowned Neurologist specializing in stroke care and neurodegenerative diseases. Her expertise includes advanced neuroimaging and minimally invasive procedures.',
                'specialty': 'Neurologist',
                'schedule_preference': 'slot-based'
            },
            {
                'first_name': 'Karthik',
                'last_name': 'Menon',
                'degree': 'MBBS, MD Neurology, Fellowship in Epilepsy',
                'years_of_experience': 16,
                'bio': 'Dr. Karthik Menon is an expert in epilepsy management and neurophysiology. He has extensive experience in EEG interpretation and seizure disorders.',
                'specialty': 'Neurologist',
                'schedule_preference': 'range-based'
            },

            # Orthopedic Surgeons
            {
                'first_name': 'Amit',
                'last_name': 'Patel',
                'degree': 'MBBS, MS Orthopedics, FACS', 
                'years_of_experience': 18,
                'bio': 'Dr. Amit Patel is a leading Orthopedic Surgeon with extensive experience in joint replacement surgeries and sports medicine. He has successfully performed over 3000 joint replacement procedures.',
                'specialty': 'Orthopedic Surgeon',
                'schedule_preference': 'range-based'
            },
            {
                'first_name': 'Rahul',
                'last_name': 'Desai',
                'degree': 'MBBS, MS Orthopedics, Fellowship in Spine Surgery',
                'years_of_experience': 14,
                'bio': 'Dr. Rahul Desai specializes in spine surgery and minimally invasive orthopedic procedures. He has expertise in complex spinal deformity corrections.',
                'specialty': 'Orthopedic Surgeon',
                'schedule_preference': 'range-based'
            },
            {
                'first_name': 'Anjali',
                'last_name': 'Thakur',
                'degree': 'MBBS, MS Orthopedics, Sports Medicine Certification',
                'years_of_experience': 9,
                'bio': 'Dr. Anjali Thakur focuses on sports medicine and arthroscopic surgeries. She works closely with athletes for injury prevention and rehabilitation.',
                'specialty': 'Orthopedic Surgeon',
                'schedule_preference': 'slot-based'
            },

            # Pediatricians
            {
                'first_name': 'Sneha',
                'last_name': 'Reddy',
                'degree': 'MBBS, MD Pediatrics',
                'years_of_experience': 10,
                'bio': 'Dr. Sneha Reddy is a compassionate Pediatrician specializing in child development and pediatric emergency care. She is known for her gentle approach with children and comprehensive care.',
                'specialty': 'Pediatrician',
                'schedule_preference': 'slot-based'
            },
            {
                'first_name': 'Vivek',
                'last_name': 'Chopra',
                'degree': 'MBBS, MD Pediatrics, Fellowship in Neonatology',
                'years_of_experience': 17,
                'bio': 'Dr. Vivek Chopra is a neonatologist with expertise in newborn intensive care. He has extensive experience in managing premature babies and critical pediatric cases.',
                'specialty': 'Pediatrician',
                'schedule_preference': 'range-based'
            },
            {
                'first_name': 'Nidhi',
                'last_name': 'Sinha',
                'degree': 'MBBS, MD Pediatrics, IAP Fellowship',
                'years_of_experience': 7,
                'bio': 'Dr. Nidhi Sinha specializes in pediatric nutrition and growth disorders. She is passionate about preventive pediatric care and vaccination programs.',
                'specialty': 'Pediatrician',
                'schedule_preference': 'slot-based'
            },

            # Gastroenterologists
            {
                'first_name': 'Vikram',
                'last_name': 'Singh',
                'degree': 'MBBS, MD Gastroenterology, DNB', 
                'years_of_experience': 14,
                'bio': 'Dr. Vikram Singh is an expert Gastroenterologist with specialization in advanced endoscopic procedures and liver diseases. He has been recognized for his innovative treatment approaches.',
                'specialty': 'Gastroenterologist',
                'schedule_preference': 'range-based'
            },
            {
                'first_name': 'Pooja',
                'last_name': 'Bansal',
                'degree': 'MBBS, MD Medicine, DM Gastroenterology',
                'years_of_experience': 11,
                'bio': 'Dr. Pooja Bansal specializes in inflammatory bowel diseases and therapeutic endoscopy. She has expertise in ERCP and advanced diagnostic procedures.',
                'specialty': 'Gastroenterologist',
                'schedule_preference': 'range-based'
            },

            # Dermatologists
            {
                'first_name': 'Kavitha',
                'last_name': 'Nair',
                'degree': 'MBBS, MD Dermatology',
                'years_of_experience': 11,
                'bio': 'Dr. Kavitha Nair is a skilled Dermatologist specializing in cosmetic dermatology and skin cancer treatment. She is known for her expertise in laser treatments and advanced skin care procedures.',
                'specialty': 'Dermatologist',
                'schedule_preference': 'slot-based'
            },
            {
                'first_name': 'Suresh',
                'last_name': 'Krishnan',
                'degree': 'MBBS, MD Dermatology, Fellowship in Dermatopathology',
                'years_of_experience': 19,
                'bio': 'Dr. Suresh Krishnan is an expert in dermatopathology and skin cancer diagnosis. He combines clinical expertise with advanced histopathological analysis.',
                'specialty': 'Dermatologist',
                'schedule_preference': 'slot-based'
            },
            {
                'first_name': 'Ritu',
                'last_name': 'Malhotra',
                'degree': 'MBBS, MD Dermatology, Aesthetic Medicine Certification',
                'years_of_experience': 6,
                'bio': 'Dr. Ritu Malhotra focuses on cosmetic dermatology and anti-aging treatments. She is skilled in botox, fillers, and advanced aesthetic procedures.',
                'specialty': 'Dermatologist',
                'schedule_preference': 'slot-based'
            },

            # Psychiatrists
            {
                'first_name': 'Arjun',
                'last_name': 'Mehta',
                'degree': 'MBBS, MD Psychiatry',
                'years_of_experience': 9,
                'bio': 'Dr. Arjun Mehta is a dedicated Psychiatrist specializing in anxiety disorders, depression, and cognitive behavioral therapy. He believes in holistic mental health care.',
                'specialty': 'Psychiatrist',
                'schedule_preference': 'range-based'
            },
            {
                'first_name': 'Shilpa',
                'last_name': 'Rao',
                'degree': 'MBBS, MD Psychiatry, Fellowship in Child Psychiatry',
                'years_of_experience': 13,
                'bio': 'Dr. Shilpa Rao specializes in child and adolescent psychiatry. She has expertise in autism spectrum disorders and developmental psychology.',
                'specialty': 'Psychiatrist',
                'schedule_preference': 'range-based'
            },

            # Ophthalmologists
            {
                'first_name': 'Ravi',
                'last_name': 'Gupta',
                'degree': 'MBBS, MS Ophthalmology',
                'years_of_experience': 16,
                'bio': 'Dr. Ravi Gupta is an experienced Ophthalmologist specializing in cataract and retinal surgeries. He has performed over 8000 successful eye surgeries.',
                'specialty': 'Ophthalmologist',
                'schedule_preference': 'range-based'
            },
            {
                'first_name': 'Neha',
                'last_name': 'Agarwal',
                'degree': 'MBBS, MS Ophthalmology, Fellowship in Cornea',
                'years_of_experience': 8,
                'bio': 'Dr. Neha Agarwal specializes in corneal diseases and refractive surgery. She is expert in LASIK procedures and corneal transplantation.',
                'specialty': 'Ophthalmologist',
                'schedule_preference': 'slot-based'
            },

            # ENT Specialists
            {
                'first_name': 'Manish',
                'last_name': 'Joshi',
                'degree': 'MBBS, MS ENT',
                'years_of_experience': 12,
                'bio': 'Dr. Manish Joshi is an ENT specialist with expertise in sinus surgery and hearing disorders. He uses advanced endoscopic techniques for minimally invasive procedures.',
                'specialty': 'ENT Specialist',
                'schedule_preference': 'range-based'
            },
            {
                'first_name': 'Rekha',
                'last_name': 'Pillai',
                'degree': 'MBBS, MS ENT, Fellowship in Head & Neck Surgery',
                'years_of_experience': 15,
                'bio': 'Dr. Rekha Pillai specializes in head and neck oncology and reconstructive surgery. She has extensive experience in treating complex ENT malignancies.',
                'specialty': 'ENT Specialist',
                'schedule_preference': 'range-based'
            },

            # Endocrinologists
            {
                'first_name': 'Rohit',
                'last_name': 'Agarwal',
                'degree': 'MBBS, MD Endocrinology',
                'years_of_experience': 13,
                'bio': 'Dr. Rohit Agarwal is an expert in diabetes management and thyroid disorders. He takes a comprehensive approach to metabolic health and hormone therapy.',
                'specialty': 'Endocrinologist',
                'schedule_preference': 'slot-based'
            },
            {
                'first_name': 'Geeta',
                'last_name': 'Kapoor',
                'degree': 'MBBS, MD Medicine, DM Endocrinology',
                'years_of_experience': 10,
                'bio': 'Dr. Geeta Kapoor specializes in reproductive endocrinology and PCOS management. She focuses on hormonal disorders affecting women\'s health.',
                'specialty': 'Endocrinologist',
                'schedule_preference': 'slot-based'
            },

            # Pulmonologists
            {
                'first_name': 'Meera',
                'last_name': 'Jain',
                'degree': 'MBBS, MD Pulmonology',
                'years_of_experience': 8,
                'bio': 'Dr. Meera Jain specializes in respiratory diseases and critical care. She has extensive experience in managing COVID-19 patients and advanced ventilator care.',
                'specialty': 'Pulmonologist',
                'schedule_preference': 'slot-based'
            },
            {
                'first_name': 'Anil',
                'last_name': 'Saxena',
                'degree': 'MBBS, MD Pulmonology, Fellowship in Interventional Pulmonology',
                'years_of_experience': 14,
                'bio': 'Dr. Anil Saxena is an interventional pulmonologist specializing in bronchoscopy and pleural procedures. He treats complex lung diseases and airway disorders.',
                'specialty': 'Pulmonologist',
                'schedule_preference': 'range-based'
            },

            # Urologists
            {
                'first_name': 'Sunil',
                'last_name': 'Mishra',
                'degree': 'MBBS, MS Urology',
                'years_of_experience': 16,
                'bio': 'Dr. Sunil Mishra is a urologist specializing in minimally invasive urological procedures and kidney stone management. He has expertise in laparoscopic surgery.',
                'specialty': 'Urologist',
                'schedule_preference': 'range-based'
            },
            {
                'first_name': 'Pradeep',
                'last_name': 'Tiwari',
                'degree': 'MBBS, MS Urology, MCh Urology',
                'years_of_experience': 20,
                'bio': 'Dr. Pradeep Tiwari is a senior urologist with expertise in uro-oncology and reconstructive urology. He has performed numerous complex urological surgeries.',
                'specialty': 'Urologist',
                'schedule_preference': 'range-based'
            },

            # Oncologists
            {
                'first_name': 'Madhavi',
                'last_name': 'Prasad',
                'degree': 'MBBS, MD Oncology, DM Medical Oncology',
                'years_of_experience': 12,
                'bio': 'Dr. Madhavi Prasad is a medical oncologist specializing in breast and gynecological cancers. She focuses on personalized cancer treatment and immunotherapy.',
                'specialty': 'Oncologist',
                'schedule_preference': 'range-based'
            },
            {
                'first_name': 'Harsh',
                'last_name': 'Vardhan',
                'degree': 'MBBS, MD Radiation Oncology',
                'years_of_experience': 11,
                'bio': 'Dr. Harsh Vardhan is a radiation oncologist with expertise in advanced radiotherapy techniques including IMRT and stereotactic radiosurgery.',
                'specialty': 'Oncologist',
                'schedule_preference': 'range-based'
            },

            # Rheumatologists
            {
                'first_name': 'Sanjana',
                'last_name': 'Iyer',
                'degree': 'MBBS, MD Medicine, DM Rheumatology',
                'years_of_experience': 9,
                'bio': 'Dr. Sanjana Iyer specializes in autoimmune disorders and inflammatory arthritis. She has expertise in biological therapies and joint injections.',
                'specialty': 'Rheumatologist',
                'schedule_preference': 'slot-based'
            },

            # Anesthesiologists
            {
                'first_name': 'Rajiv',
                'last_name': 'Khanna',
                'degree': 'MBBS, MD Anesthesiology',
                'years_of_experience': 18,
                'bio': 'Dr. Rajiv Khanna is an anesthesiologist specializing in cardiac anesthesia and pain management. He has extensive experience in complex surgical procedures.',
                'specialty': 'Anesthesiologist',
                'schedule_preference': 'range-based'
            }
        ]
        
        all_languages = list(Language.objects.all())
        created_count = 0
        
        for doctor_data in doctors_data:
            # Check if doctor already exists (by name)
            if Doctor.objects.filter(
                first_name=doctor_data['first_name'], 
                last_name=doctor_data['last_name']
            ).exists():
                self.stdout.write(f"Doctor {doctor_data['first_name']} {doctor_data['last_name']} already exists, skipping...")
                continue
            
            try:
                # Create doctor
                specialty = Specialty.objects.get(name=doctor_data['specialty'])

                username = f"dr.{doctor_data['first_name'].lower()}"
                password = "password123"  # A default, insecure password for development

                user = User.objects.create_user(
                    username=username,
                    # email=doctor_data['email'],
                    first_name=doctor_data['first_name'],
                    last_name=doctor_data['last_name'],
                    password=password,
                    is_staff = True,
                )

                target_group = Group.objects.get(name='Doctor')
                user.groups.add(target_group)
                
                doctor = Doctor.objects.create(
                    user = user,
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
                
                # Store schedule preference for later use
                doctor.schedule_preference = doctor_data['schedule_preference']
                
                created_count += 1
                
            except Exception as e:
                self.stdout.write(f"Error creating doctor {doctor_data['first_name']} {doctor_data['last_name']}: {str(e)}")
                continue
            
        self.stdout.write(f'Created {created_count} new doctors (Total: {Doctor.objects.count()})')

    def create_mixed_schedules(self):
        """Create schedules with both slot-based and range-based types"""
        self.stdout.write('Creating mixed-type doctor schedules...')
        
        doctors = Doctor.objects.all()
        
        # Create schedules for next 30 days
        start_date = datetime.now().date()
        
        schedule_count = 0
        slot_based_count = 0
        range_based_count = 0
        
        # Define schedule templates for different types
        slot_based_templates = [
            {'start': time(9, 0), 'end': time(12, 0), 'duration': 30},   # Morning: 30-min slots
            {'start': time(14, 0), 'end': time(17, 0), 'duration': 30},  # Afternoon: 30-min slots
            {'start': time(18, 0), 'end': time(20, 0), 'duration': 30},  # Evening: 30-min slots
        ]
        
        range_based_templates = [
            {'start': time(10, 0), 'end': time(13, 0)},  # Morning flexible block
            {'start': time(15, 0), 'end': time(18, 0)},  # Afternoon flexible block
            {'start': time(19, 0), 'end': time(21, 0)},  # Evening flexible block
        ]
        
        # Define which specialties should be range-based (surgery/procedures need flexible timing)
        range_based_specialties = [
            'Orthopedic Surgeon', 'Gastroenterologist', 'Psychiatrist', 
            'Ophthalmologist', 'ENT Specialist', 'Urologist', 'Oncologist',
            'Anesthesiologist'
        ]
        
        for doctor in doctors:
            # Determine preference based on specialty
            doctor_specialties = [s.name for s in doctor.specialties.all()]
            preference = 'range-based' if any(spec in range_based_specialties for spec in doctor_specialties) else 'slot-based'
            
            self.stdout.write(f"Creating schedules for Dr. {doctor.first_name} {doctor.last_name} ({preference}) - Specialties: {', '.join(doctor_specialties)}")
            
            for i in range(30):  # Next 30 days
                current_date = start_date + timedelta(days=i)
                
                # Skip some days randomly (doctors don't work every day)
                if random.random() < 0.3:  # 30% chance to skip a day
                    continue
                
                # Determine how many sessions per day (1-3)
                sessions_per_day = random.randint(1, 3)
                
                if preference == 'slot-based':
                    # Create slot-based schedules
                    templates = random.sample(slot_based_templates, min(sessions_per_day, len(slot_based_templates)))
                    
                    for template in templates:
                        try:
                            schedule = DoctorSchedule.objects.create(
                                doctor=doctor,
                                date=current_date,
                                time_range='slot-based',
                                start_time=template['start'],
                                end_time=template['end'],
                                slot_duration=template['duration'],
                                available_slots=0,  # Will be auto-calculated
                                is_active=True
                            )
                            schedule_count += 1
                            slot_based_count += 1
                        except Exception as e:
                            # Skip if duplicate or validation error
                            continue
                
                else:  # range-based
                    # Create range-based schedules
                    templates = random.sample(range_based_templates, min(sessions_per_day, len(range_based_templates)))
                    
                    for template in templates:
                        try:
                            # For range-based, available_slots represents max concurrent appointments
                            max_concurrent = random.randint(2, 4)
                            
                            schedule = DoctorSchedule.objects.create(
                                doctor=doctor,
                                date=current_date,
                                time_range='range-based',
                                start_time=template['start'],
                                end_time=template['end'],
                                slot_duration=60,  # Not used for range-based, but required field
                                available_slots=max_concurrent,
                                is_active=True
                            )
                            schedule_count += 1
                            range_based_count += 1
                        except Exception as e:
                            # Skip if duplicate or validation error
                            continue
        
        self.stdout.write(f'Created {schedule_count} mixed-type schedules')
        self.stdout.write(f'  - Slot-based schedules: {slot_based_count}')
        self.stdout.write(f'  - Range-based schedules: {range_based_count}')
        
        # Double-check actual counts in database
        actual_slot_based = DoctorSchedule.objects.filter(time_range='slot-based').count()
        actual_range_based = DoctorSchedule.objects.filter(time_range='range-based').count()
        
        self.stdout.write(f'Total in database:')
        self.stdout.write(f'  - Slot-based schedules: {actual_slot_based}')
        self.stdout.write(f'  - Range-based schedules: {actual_range_based}')
        self.stdout.write(f'  - Total schedules: {actual_slot_based + actual_range_based}')

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
        
        created_count = 0
        for user_data in sample_users:
            # Check if user already exists
            if User.objects.filter(username=user_data['username']).exists():
                self.stdout.write(f"User {user_data['username']} already exists, skipping...")
                continue
                
            try:
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
                
                created_count += 1
                
            except Exception as e:
                self.stdout.write(f"Error creating user {user_data['username']}: {str(e)}")
                continue
        
        self.stdout.write(f'Created {created_count} new sample patients')

    def create_hospital_admin(self):
        hospital_admin_data = {
            "username" : "HospitalAdmin",
            "password" : "Hospital123",
            "email" : "hospitalAdmin@admin.com",
            "first_name" : "Hospital",
            "last_name" : "Admin"
        }

        user = User.objects.create_user(
            username=hospital_admin_data['username'],
            email=hospital_admin_data['email'],
            first_name=hospital_admin_data['first_name'],
            last_name=hospital_admin_data['last_name'],
            password=hospital_admin_data['password'],
            is_staff = True,
        )

        target_group = Group.objects.get(name='Hospital Admin')
        user.groups.add(target_group)

    def create_setup_groups(self):
        call_command("setup_groups")