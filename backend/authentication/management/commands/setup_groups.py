import logging
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

# Configure a basic logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Define Your Roles and Permissions Here ---
# This dictionary structure makes it easy to manage roles.
# 'Group Name': {
#     'model_name_lowercase': ['permission_codename_prefix']
# }
# Prefixes are 'add', 'change', 'delete', 'view'.
GROUPS_PERMISSIONS = {
    "Hospital Admin": {
        "doctor": ["view", "add"],
        "doctorschedule": ["view", "add", "change"],
        "patient": ["view"],
        "appointment": ["view", "add", "change", "delete"],
    },
    "Doctor": {
        "doctorschedule": ["view", "change", "add", "delete"],
        "appointment": ["view", "change", "delete", "add"],
    },
}

class Command(BaseCommand):
    """
    A custom Django management command to programmatically create user groups and
    assign permissions based on a predefined dictionary.
    
    This command is idempotent and can be safely run multiple times.
    """
    help = "Creates user groups and assigns permissions as defined in the script."

    def handle(self, *args, **options):
        """
        The main logic of the command. It iterates through the GROUPS_PERMISSIONS
        dictionary to create groups and assign permissions.
        """
        self.stdout.write(self.style.SUCCESS("--- Starting Group and Permission Setup ---"))

        for group_name, permissions_data in GROUPS_PERMISSIONS.items():
            # --- Create Group ---
            # get_or_create returns a tuple: (object, created_boolean)
            group, created = Group.objects.get_or_create(name=group_name)
            
            if created:
                self.stdout.write(f"Created group: '{group_name}'")
            else:
                self.stdout.write(f"Group '{group_name}' already exists.")
            
            # --- Clear existing permissions to ensure a clean state ---
            group.permissions.clear()

            # --- Assign New Permissions ---
            for model_name, perm_prefixes in permissions_data.items():
                try:
                    # Find the content type for the given model in the 'authentication' app
                    content_type = ContentType.objects.get(
                        app_label='authentication', 
                        model=model_name
                    )

                    for prefix in perm_prefixes:
                        # Construct the full permission codename
                        permission_codename = f"{prefix}_{model_name}"
                        
                        try:
                            # Find the permission object
                            permission = Permission.objects.get(
                                codename=permission_codename,
                                content_type=content_type,
                            )
                            # Add the permission to the group
                            group.permissions.add(permission)
                            self.stdout.write(
                                self.style.SUCCESS(f"  + Assigned '{permission_codename}' to '{group_name}'")
                            )
                        except Permission.DoesNotExist:
                            self.stderr.write(
                                self.style.ERROR(f"  ! WARNING: Permission '{permission_codename}' not found. Skipping.")
                            )

                except ContentType.DoesNotExist:
                    self.stderr.write(
                        self.style.ERROR(f"! ERROR: ContentType for model '{model_name}' not found. Skipping permissions for this model.")
                    )

        self.stdout.write(self.style.SUCCESS("--- Group and Permission Setup Complete ---"))

