from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Q
import pytz

class Command(BaseCommand):
    help = 'Fix past appointments - mark them as completed'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🔧 Fixing Past Appointments...'))
        
        try:
            from authentication.models import Appointment
            
            # Get current IST time
            ist = pytz.timezone('Asia/Kolkata')
            now_ist = timezone.now().astimezone(ist)
            current_date = now_ist.date()
            current_time = now_ist.time()
            
            self.stdout.write(f"📅 Current IST: {now_ist.strftime('%Y-%m-%d %H:%M:%S')}")
            
            # Find all scheduled appointments that are in the past
            past_appointments = Appointment.objects.filter(
                status='scheduled'
            ).filter(
                # Either past date OR (today but past end time)
                Q(schedule__date__lt=current_date) | 
                Q(
                    schedule__date=current_date,
                    appointment_end_time__lt=current_time
                )
            )
            
            count = past_appointments.count()
            
            if count > 0:
                self.stdout.write(f"🔍 Found {count} past appointments to update:")
                
                # Show details before updating
                for apt in past_appointments:
                    self.stdout.write(f"   👤 {apt.patient.first_name} with Dr. {apt.doctor.first_name} on {apt.schedule.date} at {apt.appointment_start_time}-{apt.appointment_end_time}")
                
                # Update them
                updated = past_appointments.update(status='completed')
                self.stdout.write(self.style.SUCCESS(f"✅ Successfully updated {updated} appointments to 'completed'"))
                
                # Show new statistics
                total_scheduled = Appointment.objects.filter(status='scheduled').count()
                total_completed = Appointment.objects.filter(status='completed').count()
                
                self.stdout.write(f"📊 New statistics:")
                self.stdout.write(f"   ⏰ Scheduled: {total_scheduled}")
                self.stdout.write(f"   ✅ Completed: {total_completed}")
                
            else:
                self.stdout.write("ℹ️  No past appointments found - all appointments are up to date!")
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error: {str(e)}"))
            
        self.stdout.write(self.style.SUCCESS('✅ Done!'))