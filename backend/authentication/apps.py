import os
import sys
from django.apps import AppConfig

class AuthenticationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'authentication'

    def ready(self):
        """Start the cleanup scheduler when Django starts"""
        # Only start scheduler during runserver, not during migrations or other commands
        if 'runserver' in sys.argv:
            try:
                from .scheduler import start_scheduler
                start_scheduler()
            except Exception as e:
                print(f"⚠️  Could not start cleanup scheduler: {e}")
                print("📝 This is normal during first setup or migrations")