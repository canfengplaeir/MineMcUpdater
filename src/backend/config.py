import os
import json
import logging
import requests
from typing import Dict, Any, Optional, Tuple

# 配置日志
logger = logging.getLogger(__name__)

class Config:
    """配置管理基类"""
    
    def __init__(self, config_path=None):
        """
        初始化配置管理器
        Args:
            config_path: 配置文件路径，为None时使用默认路径
        """
        # 确定配置文件路径
        if config_path is None:
            # 使用当前用户目录下的.minemcupdater文件夹
            config_dir = os.path.join(os.path.expanduser('~'), '.minemcupdater')
            if not os.path.exists(config_dir):
                os.makedirs(config_dir)
            self.config_path = os.path.join(config_dir, 'config.json')
        else:
            self.config_path = config_path
        
        # 加载配置
        self.config = self.load_config()
    
    def load_config(self):
        """
        加载配置文件
        Returns:
            配置字典
        """
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                logger.info(f"已加载配置: {self.config_path}")
                return config
            except Exception as e:
                logger.error(f"加载配置失败: {e}")
                return self.get_default_config()
        else:
            logger.info("配置文件不存在，使用默认配置")
            return self.get_default_config()
    
    def save_config(self):
        """
        保存配置到文件
        Returns:
            保存是否成功
        """
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=4, ensure_ascii=False)
            logger.info(f"配置已保存到 {self.config_path}")
            return True
        except Exception as e:
            logger.error(f"保存配置失败: {e}")
            return False
    
    def get_default_config(self):
        """
        获取默认配置
        Returns:
            默认配置字典
        """
        # 子类应覆盖此方法
        return {}
    
    def get(self, key, default=None):
        """
        获取配置项
        Args:
            key: 配置键
            default: 默认值
        Returns:
            配置值
        """
        return self.config.get(key, default)
    
    def set(self, key, value):
        """
        设置配置项
        Args:
            key: 配置键
            value: 配置值
        """
        self.config[key] = value
        return self.save_config()


class GameConfig(Config):
    """游戏配置管理"""
    
    VERSION_URL = "https://gitee.com/canfeng_plaeir/mc/raw/main/version.txt"
    GIT_REPO_URL = "https://gitee.com/canfeng_plaeir/mc"
    GIT_BRANCH = "main"
    
    def __init__(self, config_path=None):
        """
        初始化游戏配置
        Args:
            config_path: 配置文件路径，为None时使用默认路径
        """
        # 调用父类初始化
        super().__init__(config_path)
    
    def get_default_config(self):
        """
        获取默认配置
        Returns:
            默认配置字典
        """
        # 获取当前目录作为默认游戏目录
        current_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        game_dir = os.path.join(current_dir, "game")
        
        return {
            "version": {
                "current_version": "0.0.0",
                "last_check_time": None,
            },
            "game": {
                "game_path": game_dir,
                "launcher_exe": "Plain Craft Launcher 2.exe",
            },
            "git": {
                "repo_url": self.GIT_REPO_URL,
                "branch": self.GIT_BRANCH,
            }
        }
    
    def get_current_version(self):
        """
        获取当前游戏版本
        Returns:
            当前游戏版本
        """
        return self.get("version", {}).get("current_version", "0.0.0")
    
    def set_current_version(self, version):
        """
        设置当前游戏版本
        Args:
            version: 版本号
        """
        version_config = self.get("version", {})
        version_config["current_version"] = version
        self.set("version", version_config)
        return self.save_config()
    
    def get_game_path(self):
        """
        获取游戏路径
        Returns:
            游戏路径
        """
        return self.get("game", {}).get("game_path", "")
    
    def get_launcher_path(self):
        """
        获取启动器路径
        Returns:
            启动器完整路径
        """
        game_path = self.get_game_path()
        launcher_exe = self.get("game", {}).get("launcher_exe", "Plain Craft Launcher 2.exe")
        return os.path.join(game_path, launcher_exe)
    
    def game_exists(self):
        """
        检查游戏是否存在
        Returns:
            游戏是否存在
        """
        launcher_path = self.get_launcher_path()
        return os.path.exists(launcher_path)
    
    def get_git_config(self):
        """
        获取Git配置
        Returns:
            Git配置字典
        """
        return self.get("git", {})
    
    def check_remote_version(self) -> Tuple[bool, str, str]:
        """
        检查远程版本
        Returns:
            (是否需要更新, 远程版本, 当前版本)
        """
        try:
            # 获取远程版本信息
            response = requests.get(self.VERSION_URL, timeout=10)
            if response.status_code == 200:
                remote_version = response.text.strip()
                current_version = self.get_current_version()
                
                # 比较版本
                needs_update = remote_version != current_version
                return needs_update, remote_version, current_version
            else:
                logger.error(f"获取远程版本失败，HTTP状态码: {response.status_code}")
                return False, "", self.get_current_version()
        except Exception as e:
            logger.error(f"检查远程版本失败: {e}")
            return False, "", self.get_current_version()


# 全局配置实例
_game_config = None

def get_game_config() -> GameConfig:
    """
    获取游戏配置实例（单例模式）
    Returns:
        游戏配置实例
    """
    global _game_config
    if _game_config is None:
        _game_config = GameConfig()
    return _game_config

