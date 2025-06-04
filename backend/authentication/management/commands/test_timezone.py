from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
import pytz
from authentication.enhanced_validation import (
    get_current_ist_time, 
    validate_not_in_past, 
    validate_appointment_booking,
    log_timezone_info
)
from authentication.models import DoctorSchedule, Appointment, Doctor
from authentication.scheduler import get_scheduler_status

class Command(BaseCommand):
    help = 'Test and verify timezone fixes for IST'

    def add_arguments(self, parser):
        parser.add_argument(
            '--check-validation',
            action='store_true',
            help='Test validation functions',
        )
        parser.add_argument(
            '--check-appointments',
            action='store_true',
            help='Check existing appointments timezone handling',
        )
        parser.add_argument(
            '--check-scheduler',
            action='store_true',
            help='Check scheduler status and timezone',
        )
        parser.add_argument(
            '--full-test',
            action='store_true',
            help='Run all tests',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🔍 Starting Timezone Test...'))
        
        # Show current timezone information
        self.show_timezone_info()
        
        if options['full_test']:
            self.test_validation()
            self.test_appointments()
            self.test_scheduler()
        else:
            if options['check_validation']:
                self.test_validation()
            if options['check_appointments']:
                self.test_appointments()
            if options['check_scheduler']:
                self.test_scheduler()
        
        self.stdout.write(self.style.SUCCESS('✅ Timezone Test Complete!'))

    def show_timezone_info(self):
        """Show current timezone information"""
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.WARNING('🌍 TIMEZONE INFORMATION'))
        self.stdout.write('='*50)
        
        try:
            from django.conf import settings
            
            # Get times
            now_utc = timezone.now()
            now_ist = get_current_ist_time()
            
            self.stdout.write(f"📍 Django TIME_ZONE setting: {settings.TIME_ZONE}")
            self.stdout.write(f"🕐 Current UTC time: {now_utc.strftime('%Y-%m-%d %H:%M:%S UTC')}")
            self.stdout.write(f"🕐 Current IST time: {now_ist.strftime('%Y-%m-%d %H:%M:%S IST')}")
            
            # Calculate difference
            diff_hours = (now_ist - now_utc.replace(tzinfo=None)).total_seconds() / 3600
            self.stdout.write(f"⏰ Time difference: {diff_hours:.1f} hours")
            
            if diff_hours == 5.5:
                self.stdout.write(self.style.SUCCESS("✅ IST timezone is correctly configured"))
            else:
                self.stdout.write(self.style.ERROR(f"❌ Expected 5.5 hours difference, got {diff_hours}"))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error getting timezone info: {str(e)}"))

    def test_validation(self):
        """Test validation functions"""
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.WARNING('🧪 TESTING VALIDATION FUNCTIONS'))
        self.stdout.write('='*50)
        
        now_ist = get_current_ist_time()
        
        # Test 1: Past date validation
        yesterday = (now_ist - timedelta(days=1)).date()
        result = validate_not_in_past(yesterday)
        self.stdout.write(f"📅 Past date validation ({yesterday}): {'✅ PASS' if not result['valid'] else '❌ FAIL'}")
        self.stdout.write(f"   Message: {result['message']}")
        
        # Test 2: Future date validation
        tomorrow = (now_ist + timedelta(days=1)).date()
        result = validate_not_in_past(tomorrow)
        self.stdout.write(f"📅 Future date validation ({tomorrow}): {'✅ PASS' if result['valid'] else '❌ FAIL'}")
        
        # Test 3: Past time today validation
        past_time = (now_ist - timedelta(hours=1)).time()
        result = validate_not_in_past(now_ist.date(), past_time)
        self.stdout.write(f"🕐 Past time validation ({past_time}): {'✅ PASS' if not result['valid'] else '❌ FAIL'}")
        self.stdout.write(f"   Message: {result['message']}")
        
        # Test 4: Future time today validation
        future_time = (now_ist + timedelta(hours=2)).time()
        result = validate_not_in_past(now_ist.date(), future_time)
        self.stdout.write(f"🕐 Future time validation ({future_time}): {'✅ PASS' if result['valid'] else '❌ FAIL'}")

    def test_appointments(self):
        """Test existing appointments timezone handling"""
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.WARNING('📋 TESTING APPOINTMENT TIMEZONE HANDLING'))
        self.stdout.write('='*50)
        
        try:
            # Get current IST time
            now_ist = get_current_ist_time()
            today = now_ist.date()
            current_time = now_ist.time()
            
            # Count appointments by status
            total_appointments = Appointment.objects.count()
            scheduled_appointments = Appointment.objects.filter(status='scheduled').count()
            completed_appointments = Appointment.objects.filter(status='completed').count()
            
            self.stdout.write(f"📊 Total appointments: {total_appointments}")
            self.stdout.write(f"📊 Scheduled appointments: {scheduled_appointments}")
            self.stdout.write(f"📊 Completed appointments: {completed_appointments}")
            
            # Check today's appointments
            today_appointments = Appointment.objects.filter(schedule__date=today)
            self.stdout.write(f"📅 Today's appointments ({today}): {today_appointments.count()}")
            
            # Check for appointments that should be completed (past times today)
            past_appointments_today = today_appointments.filter(
                status='scheduled',
                appointment_end_time__lt=current_time
            )
            
            if past_appointments_today.count() > 0:
                self.stdout.write(self.style.WARNING(f"⚠️  Found {past_appointments_today.count()} scheduled appointments with past times today"))
                for apt in past_appointments_today[:3]:  # Show first 3
                    self.stdout.write(f"   📋 {apt.patient.first_name} with Dr. {apt.doctor.first_name} at {apt.appointment_start_time}")
            else:
                self.stdout.write(self.style.SUCCESS("✅ No scheduled appointments with past times found"))
            
            # Check schedules
            total_schedules = DoctorSchedule.objects.count()
            active_schedules = DoctorSchedule.objects.filter(is_active=True).count()
            today_schedules = DoctorSchedule.objects.filter(date=today).count()
            
            self.stdout.write(f"📅 Total schedules: {total_schedules}")
            self.stdout.write(f"📅 Active schedules: {active_schedules}")
            self.stdout.write(f"📅 Today's schedules: {today_schedules}")
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error testing appointments: {str(e)}"))

    def test_scheduler(self):
        """Test scheduler status and timezone"""
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.WARNING('⚙️  TESTING SCHEDULER STATUS'))
        self.stdout.write('='*50)
        
        try:
            status = get_scheduler_status()
            
            if status['running']:
                self.stdout.write(self.style.SUCCESS("✅ Scheduler is running"))
                self.stdout.write(f"🕐 Current time (IST): {status['current_time_ist']}")
                
                self.stdout.write(f"📋 Scheduled jobs ({len(status['jobs'])}):")
                for job in status['jobs']:
                    self.stdout.write(f"   📅 {job['name']}")
                    self.stdout.write(f"      Next run: {job['next_run']}")
            else:
                self.stdout.write(self.style.ERROR("❌ Scheduler is not running"))
                self.stdout.write(f"🕐 Current time (IST): {status['current_time_ist']}")
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error checking scheduler: {str(e)}"))

    def test_security_scenarios(self):
        """Test security scenarios to ensure past booking prevention"""
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.WARNING('🛡️  TESTING SECURITY SCENARIOS'))
        self.stdout.write('='*50)
        
        # Simulate attempts to book past appointments
        now_ist = get_current_ist_time()
        
        # Try to book yesterday
        yesterday = (now_ist - timedelta(days=1)).date()
        past_time = (now_ist - timedelta(hours=2)).time()
        
        self.stdout.write(f"🔒 Testing past date booking: {yesterday}")
        result = validate_not_in_past(yesterday, past_time)
        if not result['valid']:
            self.stdout.write(self.style.SUCCESS("✅ Past date booking correctly blocked"))
        else:
            self.stdout.write(self.style.ERROR("❌ Past date booking was allowed!"))
        
        # Try to book past time today
        self.stdout.write(f"🔒 Testing past time booking today: {past_time}")
        result = validate_not_in_past(now_ist.date(), past_time)
        if not result['valid']:
            self.stdout.write(self.style.SUCCESS("✅ Past time booking correctly blocked"))
        else:
            self.stdout.write(self.style.ERROR("❌ Past time booking was allowed!"))