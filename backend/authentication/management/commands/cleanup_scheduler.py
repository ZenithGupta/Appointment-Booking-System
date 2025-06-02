from django.core.management.base import BaseCommand
from authentication.scheduler import start_scheduler, stop_scheduler, get_scheduler_status

class Command(BaseCommand):
    help = 'Manage the automatic cleanup scheduler'

    def add_arguments(self, parser):
        parser.add_argument(
            'action',
            choices=['start', 'stop', 'status'],
            help='Action to perform'
        )

    def handle(self, *args, **options):
        action = options['action']
        
        if action == 'start':
            self.stdout.write('🚀 Starting cleanup scheduler...')
            start_scheduler()
            self.stdout.write(
                self.style.SUCCESS('✅ Cleanup scheduler started (daily at 2:00 AM)')
            )
            
        elif action == 'stop':
            self.stdout.write('🛑 Stopping cleanup scheduler...')
            stop_scheduler()
            self.stdout.write(
                self.style.SUCCESS('✅ Cleanup scheduler stopped')
            )
            
        elif action == 'status':
            status = get_scheduler_status()
            if status['running']:
                self.stdout.write(
                    self.style.SUCCESS('✅ Cleanup scheduler is running')
                )
                for job in status['jobs']:
                    self.stdout.write(f"  📅 {job['name']} - Next run: {job['next_run']}")
            else:
                self.stdout.write(
                    self.style.ERROR('❌ Cleanup scheduler is not running')
                )