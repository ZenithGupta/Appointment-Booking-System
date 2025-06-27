# launcher.spec
# -*- mode: python ; coding: utf-8 -*-

from PyInstaller.utils.hooks import collect_data_files, collect_submodules

block_cipher = None

a = Analysis(
    ['launcher.py'],
    pathex=[SPECPATH],
    binaries=[],
    datas=[
        ('backend', 'backend'),
        ('frontend', 'frontend'),
        ('node-runtime', 'node-runtime'),
        # --- Data Collection Section ---
        *collect_data_files('django', include_py_files=True),
        *collect_data_files('rest_framework', include_py_files=True),
        *collect_data_files('rest_framework_simplejwt', include_py_files=True),
        *collect_data_files('corsheaders', include_py_files=True),
        *collect_data_files('apscheduler', include_py_files=True),
        *collect_data_files('tzdata'),
        # --- FIX: Aggressively collect all files from the jwt package ---
        *collect_data_files('jwt', include_py_files=True),
    ],
    hiddenimports=[
        'rest_framework',
        'rest_framework_simplejwt',
        'rest_framework_simplejwt.token_blacklist',
        'corsheaders',
        'PIL',
        'pytz',
        'apscheduler',
        'apscheduler.schedulers.background',
        'dateutil',
        'django.contrib.admin',
        'django.contrib.auth',
        'django.contrib.contenttypes',
        'django.contrib.sessions',
        'django.contrib.messages',
        'django.contrib.staticfiles',
        # --- FIX: Aggressively collect all submodules from the jwt package ---
        'jwt',
        *collect_submodules('jwt'),
    ],
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='App',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True, # Use console=True for debugging
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='App',
)