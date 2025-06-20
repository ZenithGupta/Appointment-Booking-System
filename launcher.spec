# launcher.spec
# -*- mode: python ; coding: utf-8 -*-

from PyInstaller.utils.hooks import collect_data_files, collect_submodules

block_cipher = None

# This is the Analysis block where we define what to bundle.
a = Analysis(
    ['launcher.py'],
    pathex=[SPECPATH],
    binaries=[],
    datas=[
        ('backend', 'backend'),
        ('frontend', 'frontend'),
        ('node-runtime', 'node-runtime'),
        # This is the key fix: We are forcing PyInstaller to copy the
        # entire directory structure of these packages, including the .py
        # migration files that Django needs to find.
        *collect_data_files('django', include_py_files=True),
        *collect_data_files('rest_framework', include_py_files=True),
        *collect_data_files('rest_framework_simplejwt', include_py_files=True),
        *collect_data_files('corsheaders', include_py_files=True),
        *collect_data_files('apscheduler', include_py_files=True),
        *collect_data_files('tzdata'),
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

# This block defines the final executable.
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

# This block creates the final output folder.
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
