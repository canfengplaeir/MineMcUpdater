"""
作者: canfeng
描述: 一个使用 GitPython 的 Git 克隆和更新工具。
"""

from git import Repo
import os
from typing import Optional


class GitConfig:
    def __init__(self, git_url: str = "", git_branch: str = "main", git_path: Optional[str] = None):
        """
        初始化 Git 配置，包括仓库 URL、分支名称和克隆路径。
        """
        self.git_url = git_url
        self.git_branch = git_branch
        # 设置克隆路径，默认为当前文件目录下的 "git_repo" 文件夹
        self.git_path = git_path or os.path.join(os.path.dirname(__file__), "git_repo")


def clone_git_repo(config: GitConfig) -> bool:
    """
    根据提供的配置克隆 Git 仓库。

    参数:
        config (GitConfig): Git 配置对象。

    返回:
        bool: 克隆成功返回 True，否则返回 False。
    """
    try:
        print(f"正在克隆 Git 仓库: {config.git_url}")
        # 克隆仓库到指定路径
        Repo.clone_from(config.git_url, config.git_path, branch=config.git_branch)
        print("Git 仓库克隆成功。")
        return True
    except Exception as e:
        # 捕获异常并打印错误信息
        print(f"克隆 Git 仓库失败。错误: {e}")
        return False


def update_git_repo(config: GitConfig) -> bool:
    """
    根据提供的配置更新 Git 仓库。

    参数:
        config (GitConfig): Git 配置对象。

    返回:
        bool: 更新成功返回 True，否则返回 False。
    """
    try:
        print(f"正在更新 Git 仓库: {config.git_url}")
        # 使用 GitPython 打开仓库
        repo = Repo(config.git_path)
        # 切换到指定分支
        repo.git.checkout(config.git_branch)
        # 拉取远程仓库更新
        repo.remotes.origin.pull()
        print("Git 仓库更新成功。")
        return True
    except Exception as e:
        # 捕获异常并打印错误信息
        print(f"更新 Git 仓库失败。错误: {e}")
        return False
