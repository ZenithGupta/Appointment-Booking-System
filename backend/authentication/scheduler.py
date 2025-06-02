# Option 3: Add automatic status updates to your scheduler
# Update backend/authentication/scheduler.py

import logging
from django.core.management import call_command
from django.conf import settings
from django.utils import timezone
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)

def update_appointment_statuses():
    """Update appointment statuses automatically"""
    try:
        logger.info("🔄 Updating appointment statuses...")
        
        from authentication.models import Appointment
        
        # Find scheduled appointments that have ended
        now = timezone.now()
        
        past_appointments = Appointment.objects.filter(
            status='scheduled'
        ).filter(
            # Past dates
            schedule__date__lt=now.date()
        ).union(
            # Today but past end time
            Appointment.objects.filter(
                status='scheduled',
                schedule__date=now.date(),
                appointment_end_time__lt=now.time()
            )
        )
        
        count = past_appointments.count()
        if count > 0:
            # Update to completed
            updated = past_appointments.update(status='completed')
            logger.info(f"✅ Updated {updated} appointments from 'scheduled' to 'completed'")
        else:
            logger.info("ℹ️ No appointments to update")
            
    except Exception as e:
        logger.error(f"❌ Error updating appointment statuses: {str(e)}")

def cleanup_past_appointments():
    """Function to clean up past appointments and schedules"""
    try:
        logger.info("🧹 Starting automatic cleanup of past appointments...")
        call_command('cleanup_past_appointments', days=1, update_status=True)
        logger.info("✅ Successfully completed cleanup of past appointments")
    except Exception as e:
        logger.error(f"❌ Error during cleanup: {str(e)}")

# Global scheduler instance
scheduler = None

def start_scheduler():
    """Start the background scheduler for cleanup and status updates"""
    global scheduler
    
    if scheduler and scheduler.running:
        logger.warning("Scheduler is already running")
        return
    
    try:
        scheduler = BackgroundScheduler()
        
        # Update appointment statuses every hour
        scheduler.add_job(
            update_appointment_statuses,
            trigger=CronTrigger(minute=0),  # Every hour at minute 0
            id='update_appointment_statuses',
            name='Hourly Update Appointment Statuses',
            replace_existing=True
        )
        
        # Daily cleanup at 2:00 AM  
        scheduler.add_job(
            cleanup_past_appointments,
            trigger=CronTrigger(hour=2, minute=0),  # 2:00 AM daily
            id='cleanup_past_appointments',
            name='Daily Cleanup of Past Appointments',
            replace_existing=True
        )
        
        scheduler.start()
        logger.info("🚀 Scheduler started:")
        logger.info("  - Status updates: Every hour")
        logger.info("  - Database cleanup: Daily at 2:00 AM")
        
    except Exception as e:
        logger.error(f"❌ Failed to start scheduler: {str(e)}")

def stop_scheduler():
    """Stop the scheduler"""
    global scheduler
    if scheduler and scheduler.running:
        scheduler.shutdown()
        logger.info("🛑 Scheduler stopped")

def get_scheduler_status():
    """Get scheduler status"""
    global scheduler
    if scheduler and scheduler.running:
        jobs = scheduler.get_jobs()
        return {
            'running': True,
            'jobs': [{'name': job.name, 'next_run': str(job.next_run_time)} for job in jobs]
        }
    return {'running': False, 'jobs': []}