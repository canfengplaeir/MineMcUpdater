"""
应用程序核心逻辑
"""
import logging
import os
import subprocess
import sys
import time
from typing import Dict, Any, Optional, Tuple
from datetime import datetime

from config import get_game_config
from git_handler import GitConfig, clone_git_repo, update_git_repo

# 配置日志
logger = logging.getLogger(__name__)


def initialize() -> bool:
    """
    初始化应用程序
    Returns:
        初始化是否成功
    """
    try:
        # 加载配置
        game_config = get_game_config()
        logger.info(f"初始化完成，当前游戏版本: {game_config.get_current_version()}")
        return True
    except Exception as e:
        logger.error(f"初始化失败: {e}")
        return False


def do_stuff() -> str:
    """
    示例操作
    Returns:
        操作结果
    """
    try:
        # 获取游戏配置
        game_config = get_game_config()
        current_version = game_config.get_current_version()
        return f"当前游戏版本: {current_version}"
    except Exception as e:
        logger.error(f"操作失败: {e}")
        return "操作失败"


def check_game_version() -> Dict[str, Any]:
    """
    检查游戏版本
    Returns:
        包含版本信息的字典
    """
    try:
        game_config = get_game_config()
        
        # 检查远程版本
        needs_update, remote_version, current_version = game_config.check_remote_version()
        
        # 检查游戏是否存在
        game_exists = game_config.game_exists()
        
        return {
            "status": "ok",
            "currentVersion": current_version,
            "remoteVersion": remote_version,
            "needsUpdate": needs_update,
            "gameExists": game_exists,
            "gamePath": game_config.get_game_path(),
            "checkedAt": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"检查游戏版本失败: {e}")
        return {
            "status": "error",
            "message": str(e)
        }


def clone_game() -> Dict[str, Any]:
    """
    克隆游戏
    Returns:
        操作结果字典
    """
    try:
        game_config = get_game_config()
        
        # 已存在则返回错误
        if game_config.game_exists():
            return {
                "status": "error",
                "message": "游戏已存在，无需克隆"
            }
        
        # 获取Git配置
        git_config_dict = game_config.get_git_config()
        game_path = game_config.get_game_path()
        
        # 创建GitConfig对象
        git_config = GitConfig(
            git_url=git_config_dict.get("repo_url", game_config.GIT_REPO_URL),
            git_branch=git_config_dict.get("branch", game_config.GIT_BRANCH),
            git_path=game_path
        )
        
        # 确保目录存在
        os.makedirs(os.path.dirname(game_path), exist_ok=True)
        
        # 克隆仓库
        success = clone_git_repo(git_config)
        
        if success:
            # 更新当前版本
            needs_update, remote_version, _ = game_config.check_remote_version()
            if remote_version:
                game_config.set_current_version(remote_version)
                
            return {
                "status": "ok",
                "message": "游戏克隆成功",
                "version": remote_version
            }
        else:
            return {
                "status": "error",
                "message": "游戏克隆失败"
            }
    except Exception as e:
        logger.error(f"克隆游戏失败: {e}")
        return {
            "status": "error",
            "message": str(e)
        }


def update_game() -> Dict[str, Any]:
    """
    更新游戏
    Returns:
        操作结果字典
    """
    try:
        game_config = get_game_config()
        
        # 检查游戏是否存在
        if not game_config.game_exists():
            return {
                "status": "error",
                "message": "游戏不存在，请先克隆游戏"
            }
        
        # 检查是否需要更新
        needs_update, remote_version, current_version = game_config.check_remote_version()
        
        if not needs_update:
            return {
                "status": "ok",
                "message": "游戏已是最新版本",
                "version": current_version
            }
        
        # 获取Git配置
        git_config_dict = game_config.get_git_config()
        game_path = game_config.get_game_path()
        
        # 创建GitConfig对象
        git_config = GitConfig(
            git_url=git_config_dict.get("repo_url", game_config.GIT_REPO_URL),
            git_branch=git_config_dict.get("branch", game_config.GIT_BRANCH),
            git_path=game_path
        )
        
        # 更新仓库
        success = update_git_repo(git_config)
        
        if success:
            # 更新当前版本
            game_config.set_current_version(remote_version)
            
            return {
                "status": "ok",
                "message": f"游戏更新成功，从 {current_version} 更新到 {remote_version}",
                "version": remote_version
            }
        else:
            return {
                "status": "error",
                "message": "游戏更新失败"
            }
    except Exception as e:
        logger.error(f"更新游戏失败: {e}")
        return {
            "status": "error",
            "message": str(e)
        }


def launch_game() -> Dict[str, Any]:
    """
    启动游戏
    Returns:
        操作结果字典
    """
    try:
        game_config = get_game_config()
        
        # 检查游戏是否存在
        if not game_config.game_exists():
            return {
                "status": "error",
                "message": "游戏不存在，请先克隆游戏"
            }
        
        # 获取启动器路径
        launcher_path = game_config.get_launcher_path()
        
        # 启动游戏
        if sys.platform == 'win32':
            # Windows平台
            subprocess.Popen([launcher_path], cwd=game_config.get_game_path())
        else:
            # 其他平台，假设使用wine
            subprocess.Popen(['wine', launcher_path], cwd=game_config.get_game_path())
        
        return {
            "status": "ok",
            "message": "游戏启动成功",
            "launcherPath": launcher_path
        }
    except Exception as e:
        logger.error(f"启动游戏失败: {e}")
        return {
            "status": "error",
            "message": str(e)
        }
