# launcher.py
import os
import sys
import subprocess
import threading
import ctypes
import django
from django.core.management import call_command

def get_base_path():
    """Gets the base path for the application, whether running from source or as a PyInstaller bundle."""
    if hasattr(sys, '_MEIPASS'):
        return sys._MEIPASS
    return os.path.abspath(".")

def main():
    """
    Main function to orchestrate the launch of the Django and React applications.
    """
    print("--- Starting Application Launcher ---")
    ctypes.windll.kernel32.SetConsoleTitleW("Django + React App Console")

    base_path = get_base_path()
    backend_path = os.path.join(base_path, 'backend')
    frontend_path = os.path.join(base_path, 'frontend')
    node_runtime_path = os.path.join(base_path, 'node-runtime')

    # --- CRITICAL: Configure Django Environment ---
    print("[BACKEND] Configuring Django environment...")
    sys.path.insert(0, backend_path)

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

    try:
        django.setup()
        print("[BACKEND] Django configured successfully.")
    except Exception as e:
        print(f"[ERROR] Failed to configure Django: {e}")
        print("Please ensure 'my_django_project' in launcher.py matches your project's settings folder.")
        input("Press Enter to exit.")
        sys.exit(1)


    # --- 1. Setup Backend using call_command ---
    print("\n[BACKEND] Setting up database...")
    try:
        print("[BACKEND] Running migrations...")
        call_command('migrate')
        print("[BACKEND] Migrations completed.")

        print("[BACKEND] Populating database...")
        call_command('populate_db', '--no-clear')
        print("[BACKEND] Database populated.")

        # Create a default superuser if it doesn't exist
        print("[BACKEND] Checking for default superuser...")
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if not User.objects.filter(username='Admin').exists():
            print("[BACKEND] Superuser 'Admin' not found. Creating...")
            User.objects.create_superuser('Admin', '', '123456')
            print("[BACKEND] Superuser 'Admin' created successfully.")
        else:
            print("[BACKEND] Superuser 'Admin' already exists.")

    except Exception as e:
        print(f"[ERROR] A Django management command failed: {e}")
        input("Press Enter to exit.")
        sys.exit(1)

    # --- 2. Start Servers in Parallel ---
    print("\n[STARTING SERVERS] Launching backend and frontend...")

    # Define a function to run the Django server in a thread
    def run_django_server():
        try:
            print("[BACKEND] Starting Django dev server on http://127.0.0.1:8000...")
            # Using --noreload is crucial for PyInstaller compatibility
            call_command('runserver', '--noreload')
        except Exception as e:
            print(f"[ERROR] Django server crashed: {e}")

    django_thread = threading.Thread(target=run_django_server)
    django_thread.daemon = True
    django_thread.start()

    # Start React server using the bundled node runtime
    print(f"[FRONTEND] Starting React dev server. This may take a moment...")
    print("----------------------------------------------------------------")
    print("--- Your application is starting! ---")
    print("--- Keep this window open. Closing it will stop the servers. ---")
    print("----------------------------------------------------------------")

    try:
        # On Windows, npm is a .cmd script, so we target it directly
        npm_cmd = os.path.join(node_runtime_path, 'npm.cmd')

        # We run the frontend server directly in the main process.
        # Closing the console will terminate this process.
        subprocess.run([npm_cmd, 'run', 'dev'], cwd=frontend_path, shell=True)
    except KeyboardInterrupt:
        print("\n[SHUTDOWN] Frontend server stopped by user. Exiting.")
    except Exception as e:
        print(f"\n[ERROR] Frontend server failed to start: {e}")
        input("Press Enter to exit.")


if __name__ == '__main__':
    main()
