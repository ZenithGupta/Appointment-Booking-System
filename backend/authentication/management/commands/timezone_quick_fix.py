from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings
from datetime import datetime, timedelta
import pytz

class Command(BaseCommand):
    help = 'Quick test and fix for timezone issues'

    def add_arguments(self, parser):
        parser.add_argument(
            '--test-only',
            action='store_true',
            help='Only test, do not fix',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🔍 Quick Timezone Test & Fix'))
        
        # Test current timezone settings
        self.test_timezone()
        
        if not options['test_only']:
            self.fix_past_appointments()
        
        self.test_appointments()
        
        self.stdout.write(self.style.SUCCESS('✅ Quick Fix Complete!'))

    def test_timezone(self):
        """Test current timezone configuration"""
        self.stdout.write('\n' + '='*40)
        self.stdout.write(self.style.WARNING('🌍 TIMEZONE TEST'))
        self.stdout.write('='*40)
        
        # Show Django timezone setting
        self.stdout.write(f"📍 Django TIME_ZONE: {settings.TIME_ZONE}")
        
        # Get current times
        now_utc = timezone.now()
        
        try:
            # Try to get IST time
            ist = pytz.timezone('Asia/Kolkata')
            now_ist = now_utc.astimezone(ist)
            
            self.stdout.write(f"🕐 Current UTC: {now_utc.strftime('%Y-%m-%d %H:%M:%S')}")
            self.stdout.write(f"🕐 Current IST: {now_ist.strftime('%Y-%m-%d %H:%M:%S')}")
            
            # Check if they're different
            diff_hours = (now_ist - now_utc.replace(tzinfo=None)).total_seconds() / 3600
            self.stdout.write(f"⏰ Difference: {diff_hours:.1f} hours")
            
            if diff_hours == 5.5:
                self.stdout.write(self.style.SUCCESS("✅ Timezone difference is correct"))
            else:
                self.stdout.write(self.style.WARNING(f"⚠️  Expected 5.5 hours, got {diff_hours}"))
                
            if settings.TIME_ZONE == 'Asia/Kolkata':
                self.stdout.write(self.style.SUCCESS("✅ Django timezone is set to IST"))
            else:
                self.stdout.write(self.style.ERROR("❌ Django timezone is NOT set to IST"))
                self.stdout.write("💡 Please update settings.py: TIME_ZONE = 'Asia/Kolkata'")
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error: {str(e)}"))

    def fix_past_appointments(self):
        """Fix appointments that should be marked as completed"""
        self.stdout.write('\n' + '='*40)
        self.stdout.write(self.style.WARNING('🔧 FIXING PAST APPOINTMENTS'))
        self.stdout.write('='*40)
        
        try:
            from authentication.models import Appointment
            
            # Get current time
            now = timezone.now()
            
            # For IST, add 5.5 hours to UTC to get correct IST time
            if settings.TIME_ZONE != 'Asia/Kolkata':
                ist_offset = timedelta(hours=5, minutes=30)
                now_ist = now + ist_offset
            else:
                now_ist = now
                
            current_date = now_ist.date()
            current_time = now_ist.time()
            
            self.stdout.write(f"🕐 Using time: {now_ist.strftime('%Y-%m-%d %H:%M:%S')} IST")
            
            # Find scheduled appointments that should be completed
            # 1. Past dates
            past_date_apps = Appointment.objects.filter(
                status='scheduled',
                schedule__date__lt=current_date
            )
            
            # 2. Today but past end time
            past_time_apps = Appointment.objects.filter(
                status='scheduled',
                schedule__date=current_date,
                appointment_end_time__lt=current_time
            )
            
            past_date_count = past_date_apps.count()
            past_time_count = past_time_apps.count()
            
            if past_date_count > 0:
                updated = past_date_apps.update(status='completed')
                self.stdout.write(f"✅ Updated {updated} appointments from past dates")
                
            if past_time_count > 0:
                updated = past_time_apps.update(status='completed')
                self.stdout.write(f"✅ Updated {updated} appointments from past times today")
                
            if past_date_count == 0 and past_time_count == 0:
                self.stdout.write("ℹ️  No appointments needed status updates")
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error fixing appointments: {str(e)}"))

    def test_appointments(self):
        """Show current appointment statistics"""
        self.stdout.write('\n' + '='*40)
        self.stdout.write(self.style.WARNING('📊 APPOINTMENT STATISTICS'))
        self.stdout.write('='*40)
        
        try:
            from authentication.models import Appointment, DoctorSchedule
            
            # Get current time for IST
            now = timezone.now()
            if settings.TIME_ZONE != 'Asia/Kolkata':
                ist_offset = timedelta(hours=5, minutes=30)
                now_ist = now + ist_offset
            else:
                now_ist = now
                
            today = now_ist.date()
            
            # Appointment counts
            total_appointments = Appointment.objects.count()
            scheduled = Appointment.objects.filter(status='scheduled').count()
            completed = Appointment.objects.filter(status='completed').count()
            canceled = Appointment.objects.filter(status='canceled').count()
            
            self.stdout.write(f"📋 Total appointments: {total_appointments}")
            self.stdout.write(f"⏰ Scheduled: {scheduled}")
            self.stdout.write(f"✅ Completed: {completed}")
            self.stdout.write(f"❌ Canceled: {canceled}")
            
            # Today's appointments
            today_appointments = Appointment.objects.filter(schedule__date=today)
            self.stdout.write(f"📅 Today's appointments ({today}): {today_appointments.count()}")
            
            # Schedule counts
            total_schedules = DoctorSchedule.objects.count()
            active_schedules = DoctorSchedule.objects.filter(is_active=True).count()
            today_schedules = DoctorSchedule.objects.filter(date=today).count()
            
            self.stdout.write(f"📅 Total schedules: {total_schedules}")
            self.stdout.write(f"📅 Active schedules: {active_schedules}")
            self.stdout.write(f"📅 Today's schedules: {today_schedules}")
            
            # Check for any problematic appointments
            current_time = now_ist.time()
            
            past_scheduled = Appointment.objects.filter(
                status='scheduled',
                schedule__date__lt=today
            ).count()
            
            past_time_scheduled = Appointment.objects.filter(
                status='scheduled',
                schedule__date=today,
                appointment_end_time__lt=current_time
            ).count()
            
            if past_scheduled > 0 or past_time_scheduled > 0:
                self.stdout.write(self.style.WARNING(f"⚠️  Found {past_scheduled + past_time_scheduled} appointments that should be completed"))
            else:
                self.stdout.write(self.style.SUCCESS("✅ No problematic appointments found"))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error getting statistics: {str(e)}"))

    def get_recommendations(self):
        """Provide recommendations for fixing timezone issues"""
        self.stdout.write('\n' + '='*40)
        self.stdout.write(self.style.WARNING('💡 RECOMMENDATIONS'))
        self.stdout.write('='*40)
        
        recommendations = [
            "1. Update settings.py: TIME_ZONE = 'Asia/Kolkata'",
            "2. Install pytz: pip install pytz",
            "3. Run: python manage.py migrate (if needed)",
            "4. Restart Django server",
            "5. Test booking appointments in browser",
            "6. Check that past dates/times are blocked"
        ]
        
        for rec in recommendations:
            self.stdout.write(f"📝 {rec}")
            
        self.stdout.write('\n' + self.style.SUCCESS('🎯 Priority: Update TIME_ZONE setting first!'))