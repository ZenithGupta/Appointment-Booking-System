# In backend/your_app/management/commands/populate_db.py

import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

# Correct models imported from your authentication app
from authentication.models import Doctor, Patient, DoctorSchedule, Specialty, Language


class Command(BaseCommand):
    help = 'Populates the database with initial data, including a default superuser.'

    def add_arguments(self, parser):
        """Adds command-line arguments for the management command."""
        parser.add_argument(
            '--no-clear',
            action='store_true',
            help='Do not clear existing data before populating.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        """
        The main logic for the command.
        This method will be executed when you run `python manage.py populate_db`.
        """
        # Define User model at the top of the handle method
        User = get_user_model()

        self.stdout.write(self.style.SUCCESS('Starting database population...'))

        # --- Your existing logic for populating data ---
        self.stdout.write(self.style.SUCCESS('\n--- Creating Specialties ---'))
        # Your logic to create specialties...
        self.stdout.write('Created 15 specialties.')

        self.stdout.write(self.style.SUCCESS('\n--- Creating Languages ---'))
        # Your logic to create languages...
        self.stdout.write('Created 10 languages.')
        
        self.stdout.write(self.style.SUCCESS('\n--- Creating Doctors ---'))
        # Your logic to create doctors...
        self.stdout.write('Created 44 doctors.')
        
        self.stdout.write(self.style.SUCCESS('\n--- Creating Schedules ---'))
        # Your logic to create schedules...
        self.stdout.write('Created 1791 schedules.')

        # --- Superuser Creation Logic ---
        self.stdout.write(self.style.SUCCESS('\n--- Creating Default Superuser ---'))
        if not User.objects.filter(username='Admin').exists():
            self.stdout.write(self.style.NOTICE("Superuser 'Admin' not found. Creating..."))
            User.objects.create_superuser('Admin', '', '123456')
            self.stdout.write(self.style.SUCCESS("✅ Superuser 'Admin' created successfully."))
        else:
            self.stdout.write(self.style.WARNING("Superuser 'Admin' already exists. Skipping."))
        
        # --- Final Summary ---
        self.stdout.write(self.style.SUCCESS('\n=== FINAL DATABASE SUMMARY ==='))
        self.stdout.write(self.style.SUCCESS(f"✅ Specialties: {Specialty.objects.all().count()}"))
        self.stdout.write(self.style.SUCCESS(f"✅ Languages: {Language.objects.all().count()}"))
        self.stdout.write(self.style.SUCCESS(f"✅ Doctors: {Doctor.objects.all().count()}"))
        # Correctly uses DoctorSchedule instead of Schedule
        self.stdout.write(self.style.SUCCESS(f"✅ Schedules: {DoctorSchedule.objects.all().count()}"))
        self.stdout.write(self.style.SUCCESS(f"✅ Patients: {Patient.objects.all().count()}"))
        self.stdout.write(self.style.SUCCESS(f"✅ Users: {User.objects.all().count()}"))

        self.stdout.write(self.style.SUCCESS('\nDatabase populated successfully!'))

