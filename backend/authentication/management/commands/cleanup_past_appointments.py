from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Q
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
        parser.add_argument(
            '--update-status',
            action='store_true',
            help='Update appointment statuses (scheduled -> completed for past appointments)',
        )

    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']
        update_status = options['update_status']
        
        # Calculate cutoff date
        cutoff_date = (timezone.now() - timedelta(days=days)).date()
        current_datetime = timezone.now()
        
        self.stdout.write(f"Cleaning up data older than {cutoff_date}")
        
        # NEW: Update appointment statuses first
        if update_status:
            self.update_appointment_statuses(current_datetime, dry_run)
        
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
    
    def update_appointment_statuses(self, current_datetime, dry_run):
        """Update appointment statuses from scheduled to completed for past appointments"""
        
        # FIXED: Use Q objects instead of union to avoid ORDER BY issues
        past_scheduled_appointments = Appointment.objects.filter(
            status='scheduled'
        ).filter(
            Q(schedule__date__lt=current_datetime.date()) |  # Past dates
            Q(  # Today but past end time
                schedule__date=current_datetime.date(),
                appointment_end_time__lt=current_datetime.time()
            )
        )
        
        count = past_scheduled_appointments.count()
        
        if dry_run:
            self.stdout.write(f"DRY RUN - Would update {count} appointments from 'scheduled' to 'completed'")
            if count > 0:
                # Show first 5 examples
                examples = past_scheduled_appointments[:5]
                for apt in examples:
                    self.stdout.write(f"  - {apt.patient} with {apt.doctor} on {apt.schedule.date} at {apt.appointment_start_time}")
                if count > 5:
                    self.stdout.write(f"  ... and {count - 5} more")
            else:
                self.stdout.write("  - No appointments need status updates")
        else:
            # Actually update the statuses
            if count > 0:
                updated = past_scheduled_appointments.update(status='completed')
                self.stdout.write(
                    self.style.SUCCESS(f"✅ Updated {updated} appointments from 'scheduled' to 'completed'")
                )
            else:
                self.stdout.write("ℹ️  No appointments needed status updates")
