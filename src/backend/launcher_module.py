import os
import json
import platform
import subprocess
import logging
from typing import Dict, Optional, List, Any, Tuple, Union
from pathlib import Path

# 配置日志
logger = logging.getLogger(__name__)

class GameLauncher:
    """Minecraft游戏启动器
    
    提供Minecraft游戏启动相关功能，包括Java路径检测、游戏版本管理和启动参数构建。
    
    Attributes:
        game_dir (str): Minecraft游戏目录
        java_path (str): Java可执行文件路径
        versions_dir (str): 游戏版本目录
        libraries_dir (str): 游戏库目录
        assets_dir (str): 游戏资源目录
        natives_dir (str): 原生库目录
    """
    
    def __init__(self, game_dir: str = ".minecraft", java_path: Optional[str] = None):
        """初始化游戏启动器
        
        Args:
            game_dir: Minecraft游戏目录
            java_path: Java可执行文件路径，如果为None则自动查找
        """
        self.game_dir = os.path.abspath(game_dir)
        self.java_path = java_path or self._find_java()
        self.versions_dir = os.path.join(self.game_dir, "versions")
        self.libraries_dir = os.path.join(self.game_dir, "libraries")
        self.assets_dir = os.path.join(self.game_dir, "assets")
        self.natives_dir = os.path.join(self.game_dir, "natives")
        self.error_message: Optional[str] = None
        self._ensure_directories()

    def _ensure_directories(self) -> None:
        """确保必要的目录存在"""
        for dir_path in [self.game_dir, self.versions_dir, self.libraries_dir, self.assets_dir, self.natives_dir]:
            os.makedirs(dir_path, exist_ok=True)

    def _find_java(self) -> Optional[str]:
        """查找Java路径
        
        Returns:
            Optional[str]: Java可执行文件路径，如果未找到则返回None
        """
        if platform.system() == "Windows":
            program_files = os.environ.get("ProgramFiles")
            program_files_x86 = os.environ.get("ProgramFiles(x86)")
            java_home = os.environ.get("JAVA_HOME")
            possible_paths = [
                java_home,
                os.path.join(program_files, "Java") if program_files else None,
                os.path.join(program_files_x86, "Java") if program_files_x86 else None,
                os.path.join(program_files, "AdoptOpenJDK") if program_files else None,
                os.path.join(program_files, "Eclipse Foundation") if program_files else None,
                os.path.join(program_files, "Eclipse Adoptium") if program_files else None,
                os.path.join(program_files, "Microsoft\\jdk-") if program_files else None,
            ]
            
            for path in possible_paths:
                if path and os.path.exists(path):
                    for root, dirs, files in os.walk(path):
                        if "java.exe" in files:
                            java_path = os.path.join(root, "java.exe")
                            logger.info(f"找到Java路径: {java_path}")
                            return java_path
        else:  # Linux, macOS等
            try:
                result = subprocess.run(["which", "java"], capture_output=True, text=True)
                if result.returncode == 0:
                    java_path = result.stdout.strip()
                    logger.info(f"找到Java路径: {java_path}")
                    return java_path
            except Exception as e:
                logger.error(f"查找Java路径失败: {e}")
                pass
        
        logger.warning("未找到Java路径")
        return None

    def verify_java_version(self, min_version: int = 8) -> bool:
        """验证Java版本
        
        Args:
            min_version: 最低要求的Java版本
            
        Returns:
            bool: 版本符合要求返回True，否则返回False
        """
        if not self.java_path:
            self.error_message = "未找到Java路径"
            return False
            
        try:
            result = subprocess.run(
                [self.java_path, "-version"], 
                capture_output=True, 
                text=True, 
                stderr=subprocess.STDOUT
            )
            version_output = result.stdout
            
            # 解析Java版本
            if "version" in version_output:
                version_line = version_output.split('\n')[0]
                # 处理不同格式的版本字符串
                if '"' in version_line:
                    version_str = version_line.split('"')[1]
                else:
                    version_str = version_line.split(' ')[2]
                
                # 处理Java 9+的新版本号格式
                if version_str.startswith("1."):
                    version_number = int(version_str.split('.')[1])
                else:
                    version_number = int(version_str.split('.')[0])
                
                logger.info(f"检测到Java版本: {version_number}")
                return version_number >= min_version
            else:
                self.error_message = "无法解析Java版本信息"
                return False
        except Exception as e:
            self.error_message = f"验证Java版本失败: {e}"
            logger.error(self.error_message)
            return False

    def get_available_versions(self) -> List[str]:
        """获取可用的游戏版本
        
        Returns:
            List[str]: 可用版本ID列表
        """
        versions = []
        if os.path.exists(self.versions_dir):
            for version_id in os.listdir(self.versions_dir):
                version_json = os.path.join(self.versions_dir, version_id, f"{version_id}.json")
                if os.path.exists(version_json):
                    versions.append(version_id)
        return versions

    def build_launch_command(self, 
                            version_id: str, 
                            username: str, 
                            auth_info: Dict[str, Any], 
                            memory: Optional[str] = None,
                            extra_jvm_args: Optional[List[str]] = None,
                            extra_game_args: Optional[List[str]] = None) -> List[str]:
        """构建启动命令
        
        Args:
            version_id: 游戏版本ID
            username: 用户名
            auth_info: 认证信息
            memory: 内存大小，例如"2G"
            extra_jvm_args: 额外的JVM参数
            extra_game_args: 额外的游戏参数
            
        Returns:
            List[str]: 启动命令列表
            
        Raises:
            FileNotFoundError: 版本文件不存在
            ValueError: 参数错误
        """
        version_json_path = os.path.join(self.versions_dir, version_id, f"{version_id}.json")
        if not os.path.exists(version_json_path):
            self.error_message = f"版本 {version_id} 不存在"
            raise FileNotFoundError(self.error_message)

        try:
            with open(version_json_path, 'r', encoding='utf-8') as f:
                version_data = json.load(f)
        except Exception as e:
            self.error_message = f"读取版本文件失败: {e}"
            raise ValueError(self.error_message)

        # 基础JVM参数
        jvm_args = [
            self.java_path,
            f"-Xmx{memory or '2G'}",
            "-XX:+UnlockExperimentalVMOptions",
            "-XX:+UseG1GC",
            "-XX:G1NewSizePercent=20",
            "-XX:G1ReservePercent=20",
            "-XX:MaxGCPauseMillis=50",
            "-XX:G1HeapRegionSize=32M"
        ]

        # 添加额外的JVM参数
        if extra_jvm_args:
            jvm_args.extend(extra_jvm_args)

        # 添加认证相关参数
        if auth_info.get('type') == 'authlib-injector':
            authlib_path = os.path.join(os.path.dirname(self.game_dir), "authlib-injector.jar")
            if os.path.exists(authlib_path):
                jvm_args.extend([
                    f"-javaagent:{authlib_path}={auth_info['server']}",
                    f"-Dauthlibinjector.yggdrasil.prefetched={auth_info['base_code']}"
                ])

        # 游戏主类
        main_class = version_data.get('mainClass')
        if not main_class:
            self.error_message = "版本文件中未找到主类"
            raise ValueError(self.error_message)

        # 游戏参数
        game_args = [
            main_class,
            "--username", username,
            "--version", version_id,
            "--gameDir", self.game_dir,
            "--assetsDir", self.assets_dir,
            "--assetIndex", version_data.get('assets', '1.0'),
            "--uuid", auth_info.get('uuid', ''),
            "--accessToken", auth_info.get('access_token', ''),
            "--userType", "mojang",
            "--versionType", "release"
        ]

        # 添加额外的游戏参数
        if extra_game_args:
            game_args.extend(extra_game_args)

        return jvm_args + game_args

    def launch_game(self, 
                   version_id: str, 
                   username: str, 
                   auth_info: Dict[str, Any], 
                   memory: Optional[str] = None,
                   extra_jvm_args: Optional[List[str]] = None,
                   extra_game_args: Optional[List[str]] = None) -> Tuple[bool, Optional[subprocess.Popen]]:
        """启动游戏
        
        Args:
            version_id: 游戏版本ID
            username: 用户名
            auth_info: 认证信息
            memory: 内存大小，例如"2G"
            extra_jvm_args: 额外的JVM参数
            extra_game_args: 额外的游戏参数
            
        Returns:
            Tuple[bool, Optional[subprocess.Popen]]: (是否成功, 进程对象)
        """
        if not self.java_path:
            self.error_message = "未找到Java路径"
            logger.error(self.error_message)
            return False, None
            
        if not self.verify_java_version():
            self.error_message = "Java版本不兼容"
            logger.error(self.error_message)
            return False, None

        try:
            command = self.build_launch_command(
                version_id, 
                username, 
                auth_info, 
                memory,
                extra_jvm_args,
                extra_game_args
            )
            
            logger.info(f"启动游戏: {version_id}, 用户: {username}")
            process = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=self.game_dir
            )
            return True, process
        except Exception as e:
            self.error_message = f"启动游戏失败: {e}"
            logger.error(self.error_message)
            return False, None
    
    def get_last_error(self) -> Optional[str]:
        """获取最后一次错误信息
        
        Returns:
            Optional[str]: 错误信息，如果没有错误则返回None
        """
        return self.error_message


# 便捷函数
def create_launcher(game_dir: str = ".minecraft", java_path: Optional[str] = None) -> GameLauncher:
    """创建游戏启动器
    
    Args:
        game_dir: Minecraft游戏目录
        java_path: Java可执行文件路径，如果为None则自动查找
        
    Returns:
        GameLauncher: 游戏启动器实例
    """
    return GameLauncher(game_dir, java_path)


def quick_launch(game_dir: str, 
                version_id: str, 
                username: str, 
                auth_info: Dict[str, Any], 
                memory: Optional[str] = None) -> Tuple[bool, Optional[str]]:
    """快速启动游戏
    
    Args:
        game_dir: Minecraft游戏目录
        version_id: 游戏版本ID
        username: 用户名
        auth_info: 认证信息
        memory: 内存大小，例如"2G"
        
    Returns:
        Tuple[bool, Optional[str]]: (是否成功, 错误信息)
    """
    launcher = create_launcher(game_dir)
    success, process = launcher.launch_game(version_id, username, auth_info, memory)
    
    if not success:
        return False, launcher.get_last_error()
    return True, None


# 示例用法
if __name__ == "__main__":
    # 配置日志
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # 创建启动器
    launcher = create_launcher(".minecraft")
    
    # 检查Java
    if launcher.verify_java_version():
        print(f"Java路径: {launcher.java_path}")
        
        # 获取可用版本
        versions = launcher.get_available_versions()
        if versions:
            print(f"可用版本: {', '.join(versions)}")
            
            # 模拟认证信息
            auth_info = {
                "type": "authlib-injector",
                "server": "https://example.com",
                "name": "Player",
                "uuid": "00000000-0000-0000-0000-000000000000",
                "access_token": "mock_token",
                "client_token": "mock_client_token",
                "base_code": "mock_base_code"
            }
            
            # 构建启动命令
            try:
                command = launcher.build_launch_command(versions[0], "Player", auth_info, "2G")
                print(f"启动命令: {' '.join(command)}")
            except Exception as e:
                print(f"构建启动命令失败: {e}")
        else:
            print("未找到可用版本")
    else:
        print(f"Java验证失败: {launcher.get_last_error()}")