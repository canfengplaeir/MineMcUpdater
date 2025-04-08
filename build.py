"""
打包脚本 - 使用PyInstaller打包应用程序
"""
import os
import sys
import subprocess
import shutil
from PIL import Image

def convert_jpg_to_ico(jpg_path, ico_path):
    """将JPG图像转换为ICO格式"""
    try:
        img = Image.open(jpg_path)
        # 调整图像大小为标准图标尺寸
        icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
        img.save(ico_path, format='ICO', sizes=icon_sizes)
        print(f"✅ 已创建图标文件: {ico_path}")
        return True
    except Exception as e:
        print(f"❌ 创建图标失败: {e}")
        return False

def clean_output_directory(output_dir):
    """清理输出目录"""
    if os.path.exists(output_dir):
        print(f"🧹 正在清理输出目录: {output_dir}")
        try:
            shutil.rmtree(output_dir)
            print(f"✅ 已清理输出目录")
            return True
        except Exception as e:
            print(f"❌ 清理输出目录失败: {e}")
            return False
    return True

def list_data_files(data_dir):
    """列出数据目录中的文件"""
    files = []
    if os.path.exists(data_dir):
        for file in os.listdir(data_dir):
            file_path = os.path.join(data_dir, file)
            if os.path.isfile(file_path):
                files.append(file)
    return files

def main():
    """主打包函数"""
    # 获取当前目录
    current_dir = os.path.abspath(os.path.dirname(__file__))
    
    # 清理输出目录
    output_dir = os.path.join(current_dir, 'dist', 'MineMcUpdater')
    build_dir = os.path.join(current_dir, 'build')
    
    clean_output_directory(output_dir)
    clean_output_directory(build_dir)
    
    # 先转换图标为ico格式
    jpg_path = os.path.join(current_dir, 'src', 'backend', 'logo.jpg')
    ico_path = os.path.join(current_dir, 'src', 'backend', 'logo.ico')
    
    if not os.path.exists(ico_path):
        print("🔄 正在转换JPG图标为ICO格式...")
        convert_jpg_to_ico(jpg_path, ico_path)
    
    # 获取数据文件列表
    data_dir = os.path.join(current_dir, 'src', 'data')
    data_files = list_data_files(data_dir)
    
    print("🚀 开始打包应用程序...")
    print("📋 配置信息:")
    print(f"  - 已包含: src/data 目录 ({', '.join(data_files)})")
    print("  - 已排除: node_modules 文件夹")
    print("  - 主程序: src/backend/main.py")
    print("  - 图标文件: src/backend/logo.ico")
    
    # 使用PyInstaller打包，添加-y选项自动清理输出目录
    result = subprocess.run(['pyinstaller', '-y', 'MineMcUpdater.spec'], 
                             cwd=current_dir, 
                             stdout=subprocess.PIPE, 
                             stderr=subprocess.PIPE, 
                             text=True)
    
    if result.returncode == 0:
        print("✅ 打包成功!")
        print(f"📂 输出目录: {os.path.join(current_dir, 'dist', 'MineMcUpdater')}")
    else:
        print("❌ 打包失败!")
        print(result.stderr)

if __name__ == "__main__":
    main() 