# -*- mode: python ; coding: utf-8 -*-

import os
import sys
from PyInstaller.utils.hooks import collect_data_files

block_cipher = None

# 当前文件夹路径
current_dir = os.path.abspath(os.getcwd())
gui_dir = os.path.join(current_dir, 'gui')
backend_dir = os.path.join(current_dir, 'src', 'backend')
data_dir = os.path.join(current_dir, 'src', 'data')

# 收集静态文件，排除node_modules文件夹
gui_files = []
for root, dirs, files in os.walk(gui_dir):
    # 排除node_modules文件夹
    if 'node_modules' in dirs:
        dirs.remove('node_modules')  # 这会影响os.walk的遍历
    
    for file in files:
        # 确保路径中不含有node_modules
        if 'node_modules' not in root:
            source_path = os.path.join(root, file)
            target_path = os.path.relpath(os.path.join(root, file), current_dir)
            gui_files.append((source_path, os.path.dirname(target_path)))

# 直接添加data目录中的文件
data_files = []
if os.path.exists(data_dir):
    for file in os.listdir(data_dir):
        file_path = os.path.join(data_dir, file)
        if os.path.isfile(file_path):
            # 使用('src/data'作为目标目录)
            data_files.append((file_path, 'src/data'))
    print(f"Data files to include: {data_files}")

# 合并文件列表
all_files = gui_files + data_files

# 图标文件路径
icon_path = os.path.join(backend_dir, 'logo.ico')

a = Analysis(
    [os.path.join(backend_dir, 'main.py')],
    pathex=[backend_dir],
    binaries=[],
    datas=all_files,
    hiddenimports=['webview.platforms.winforms'],
    hookspath=[],
    hooksconfig={},
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
    name='MineMcUpdater',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=icon_path,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='MineMcUpdater',
) 