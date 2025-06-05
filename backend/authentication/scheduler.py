import logging
from django.core.management import call_command
from django.conf import settings
from django.utils import timezone
from django.db.models import Q
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

def get_current_ist_time():
    """Get current time in IST timezone"""
    try:
        import pytz
        ist = pytz.timezone('Asia/Kolkata')
        return timezone.now().astimezone(ist)
    except ImportError:
        # Fallback if pytz not installed
        # Add 5.5 hours to UTC to get IST
        return timezone.now() + timedelta(hours=5, minutes=30)

def update_appointment_statuses():
    """Update appointment statuses automatically with IST support"""
    try:
        # Get current IST time
        if settings.TIME_ZONE == 'Asia/Kolkata':
            now_ist = timezone.now()  # Already in IST
        else:
            now_ist = get_current_ist_time()
        
        current_date_ist = now_ist.date()
        current_time_ist = now_ist.time()
        
        logger.info(f"🔄 Updating appointment statuses at {now_ist.strftime('%Y-%m-%d %H:%M:%S')} IST")
        
        from authentication.models import Appointment
        
        # Find scheduled appointments that have ended
        # Past dates
        past_date_appointments = Appointment.objects.filter(
            status='scheduled',
            schedule__date__lt=current_date_ist
        )
        
        # Today but past end time
        past_time_appointments = Appointment.objects.filter(
            status='scheduled',
            schedule__date=current_date_ist,
            appointment_end_time__lt=current_time_ist
        )
        
        past_date_count = past_date_appointments.count()
        past_time_count = past_time_appointments.count()
        
        total_updated = 0
        
        if past_date_count > 0:
            updated = past_date_appointments.update(status='completed')
            total_updated += updated
            logger.info(f"✅ Updated {updated} appointments from past dates")
        
        if past_time_count > 0:
            updated = past_time_appointments.update(status='completed')
            total_updated += updated
            logger.info(f"✅ Updated {updated} appointments from past times today")
        
        if total_updated == 0:
            logger.info("ℹ️ No appointments needed status updates")
        else:
            logger.info(f"🎯 Total appointments updated: {total_updated}")
            
    except Exception as e:
        logger.error(f"❌ Error updating appointment statuses: {str(e)}")

def cleanup_past_appointments():
    """Function to clean up past appointments and schedules"""
    try:
        now_ist = get_current_ist_time()
        logger.info(f"🧹 Starting automatic cleanup at {now_ist.strftime('%Y-%m-%d %H:%M:%S')} IST")
        call_command('cleanup_past_appointments', days=1, update_status=True)
        logger.info("✅ Successfully completed cleanup")
    except Exception as e:
        logger.error(f"❌ Error during cleanup: {str(e)}")

# Global scheduler instance
scheduler = None

def start_scheduler():
    """Start the background scheduler with IST timezone support"""
    global scheduler
    
    if scheduler and scheduler.running:
        logger.warning("⚠️ Scheduler is already running")
        return
    
    try:
        # Create scheduler
        scheduler = BackgroundScheduler()
        
        # Update appointment statuses every 15 minutes
        scheduler.add_job(
            update_appointment_statuses,
            trigger=CronTrigger(minute='*/15'),  # Every 15 minutes
            id='update_appointment_statuses',
            name='Update Appointment Statuses (Every 15 min)',
            replace_existing=True
        )
        
        # Daily cleanup at 2:00 AM
        scheduler.add_job(
            cleanup_past_appointments,
            trigger=CronTrigger(hour=2, minute=0),  # 2:00 AM daily
            id='cleanup_past_appointments',
            name='Daily Cleanup (2:00 AM)',
            replace_existing=True
        )
        
        scheduler.start()
        
        # Log current time and jobs
        current_time = get_current_ist_time()
        logger.info(f"🚀 Scheduler started at {current_time.strftime('%Y-%m-%d %H:%M:%S')} IST")
        logger.info("📋 Scheduled Jobs:")
        logger.info("  📊 Status updates: Every 15 minutes")
        logger.info("  🧹 Database cleanup: Daily at 2:00 AM")
        
        # Run immediate status update
        logger.info("🔄 Running initial status update...")
        update_appointment_statuses()
        
    except Exception as e:
        logger.error(f"❌ Failed to start scheduler: {str(e)}")

def stop_scheduler():
    """Stop the scheduler"""
    global scheduler
    if scheduler and scheduler.running:
        scheduler.shutdown()
        current_time = get_current_ist_time()
        logger.info(f"🛑 Scheduler stopped at {current_time.strftime('%Y-%m-%d %H:%M:%S')} IST")

def get_scheduler_status():
    """Get scheduler status"""
    global scheduler
    if scheduler and scheduler.running:
        jobs = scheduler.get_jobs()
        current_time = get_current_ist_time()
        
        job_info = []
        for job in jobs:
            next_run = job.next_run_time
            if next_run:
                job_info.append({
                    'name': job.name,
                    'next_run': str(next_run),
                    'id': job.id
                })
            else:
                job_info.append({
                    'name': job.name,
                    'next_run': 'Not scheduled',
                    'id': job.id
                })
        
        return {
            'running': True,
            'current_time_ist': current_time.strftime('%Y-%m-%d %H:%M:%S IST'),
            'jobs': job_info
        }
    return {
        'running': False,
        'current_time_ist': get_current_ist_time().strftime('%Y-%m-%d %H:%M:%S IST'),
        'jobs': []
    }