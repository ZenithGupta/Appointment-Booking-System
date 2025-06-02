from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from authentication.models import Appointment, DoctorSchedule, TimeSlot

class Command(BaseCommand):
    help = 'Clean up past appointments and schedules'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=1,
            help='Number of days in the past to clean up (default: 1)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']
        
        # Calculate cutoff date
        cutoff_date = (timezone.now() - timedelta(days=days)).date()
        cutoff_datetime = timezone.now() - timedelta(days=days)
        
        self.stdout.write(f"Cleaning up data older than {cutoff_date}")
        
        # Find past appointments
        past_appointments = Appointment.objects.filter(
            schedule__date__lt=cutoff_date,
            status='scheduled'  # Only clean up scheduled appointments
        )
        
        # Find past schedules
        past_schedules = DoctorSchedule.objects.filter(
            date__lt=cutoff_date
        )
        
        # Find past time slots
        past_time_slots = TimeSlot.objects.filter(
            schedule__date__lt=cutoff_date,
            is_booked=False  # Only clean up unbooked slots
        )
        
        if dry_run:
            self.stdout.write(f"DRY RUN - Would delete:")
            self.stdout.write(f"  - {past_appointments.count()} past appointments")
            self.stdout.write(f"  - {past_schedules.count()} past schedules")
            self.stdout.write(f"  - {past_time_slots.count()} past unbooked time slots")
        else:
            # Delete past data
            appointment_count = past_appointments.count()
            past_appointments.delete()
            
            time_slot_count = past_time_slots.count()
            past_time_slots.delete()
            
            schedule_count = past_schedules.count()
            past_schedules.delete()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully cleaned up:\n"
                    f"  - {appointment_count} past appointments\n"
                    f"  - {schedule_count} past schedules\n"
                    f"  - {time_slot_count} past unbooked time slots"
                )
            )