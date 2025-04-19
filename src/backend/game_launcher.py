import os
import json
import subprocess
import requests
import platform
import shutil
from pathlib import Path

class GameLauncher:
    def __init__(self, game_dir=".minecraft", java_path=None):
        self.game_dir = os.path.abspath(game_dir)
        self.java_path = java_path or self._find_java()
        self.versions_dir = os.path.join(self.game_dir, "versions")
        self.libraries_dir = os.path.join(self.game_dir, "libraries")
        self.assets_dir = os.path.join(self.game_dir, "assets")
        self.natives_dir = os.path.join(self.game_dir, "natives")
        self._ensure_directories()

    def _ensure_directories(self):
        """确保必要的目录存在"""
        for dir_path in [self.game_dir, self.versions_dir, self.libraries_dir, self.assets_dir, self.natives_dir]:
            os.makedirs(dir_path, exist_ok=True)

    def _find_java(self):
        """查找Java路径"""
        if platform.system() == "Windows":
            program_files = os.environ.get("ProgramFiles")
            java_home = os.environ.get("JAVA_HOME")
            possible_paths = [
                java_home,
                os.path.join(program_files, "Java"),
                os.path.join(program_files, "AdoptOpenJDK"),
                os.path.join(program_files, "Eclipse Foundation")
            ]
            
            for path in possible_paths:
                if path and os.path.exists(path):
                    for root, dirs, files in os.walk(path):
                        if "java.exe" in files:
                            return os.path.join(root, "java.exe")
        else:
            try:
                result = subprocess.run(["which", "java"], capture_output=True, text=True)
                if result.returncode == 0:
                    return result.stdout.strip()
            except:
                pass
        return None

    def verify_java_version(self, min_version=8):
        """验证Java版本"""
        if not self.java_path:
            return False
        try:
            result = subprocess.run([self.java_path, "-version"], capture_output=True, text=True, stderr=subprocess.STDOUT)
            version_line = result.stdout.split('\n')[0]
            version_number = version_line.split('"')[1].split('.')[0]
            return int(version_number) >= min_version
        except:
            return False

    def build_launch_command(self, version_id, username, auth_info, memory=None):
        """构建启动命令"""
        version_json_path = os.path.join(self.versions_dir, version_id, f"{version_id}.json")
        if not os.path.exists(version_json_path):
            raise FileNotFoundError(f"Version {version_id} not found")

        with open(version_json_path, 'r') as f:
            version_data = json.load(f)

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

        # 添加认证相关参数
        if auth_info.get('type') == 'authlib-injector':
            authlib_path = os.path.join(os.path.dirname(self.game_dir), "authlib-injector.jar")
            if os.path.exists(authlib_path):
                jvm_args.extend([
                    f"-javaagent:{authlib_path}={auth_info['server']}",
                    f"-Dauthlibinjector.yggdrasil.prefetched={auth_info['base_code']}"
                ])

        # 游戏参数
        game_args = [
            version_data['mainClass'],
            "--username", username,
            "--version", version_id,
            "--gameDir", self.game_dir,
            "--assetsDir", self.assets_dir,
            "--assetIndex", version_data['assets'],
            "--uuid", auth_info.get('uuid', ''),
            "--accessToken", auth_info.get('access_token', ''),
            "--userType", "mojang",
            "--versionType", "release"
        ]

        return jvm_args + game_args

    def launch_game(self, version_id, username, auth_info, memory=None):
        """启动游戏"""
        if not self.verify_java_version():
            raise RuntimeError("Java not found or version not compatible")

        try:
            command = self.build_launch_command(version_id, username, auth_info, memory)
            process = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=self.game_dir
            )
            return process
        except Exception as e:
            raise RuntimeError(f"Failed to launch game: {str(e)}")