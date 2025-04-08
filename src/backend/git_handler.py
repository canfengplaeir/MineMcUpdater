"""
作者: canfeng
描述: 一个使用 GitPython 的 Git 克隆和更新工具。
"""

from git import Repo, RemoteProgress
import os
from typing import Optional, Dict
import time
import threading


class GitProgressMonitor(RemoteProgress):
    """
    Git操作进度监控类，实现RemoteProgress接口以获取Git操作进度
    """
    def __init__(self):
        super().__init__()
        self.op_code = 0
        self.cur_count = 0
        self.max_count = 0
        self.message = ""
        self.progress = 0.0
        self.start_time = time.time()
        # 最后一次更新时间
        self.last_update = time.time()
        # 总对象数
        self.total_objects = 0
        # 已接收对象数
        self.received_objects = 0
        # 已索引对象数
        self.indexed_objects = 0
        # 当前状态信息
        self.stage = "准备中"
        # 当前速度 (KB/s)
        self.speed = 0
        # 预计剩余时间(秒)
        self.eta = 0
        # 锁，用于线程安全访问
        self._lock = threading.Lock()
        # 上次接收对象数和时间，用于计算速度
        self._last_received = 0
        self._last_received_time = time.time()
        # 显式设置初始完成状态为False
        self._is_complete = False
        
    def update(self, op_code, cur_count, max_count=None, message=''):
        """
        Git操作进度更新回调方法
        
        参数:
            op_code: 操作码，表示当前执行的操作类型
            cur_count: 当前进度计数
            max_count: 最大计数
            message: 进度消息
        """
        with self._lock:
            self.op_code = op_code
            self.cur_count = cur_count
            self.max_count = max_count or 100
            self.message = message
            
            # 解析进度信息
            if op_code & RemoteProgress.COUNTING:
                self.stage = "计数对象"
            elif op_code & RemoteProgress.COMPRESSING:
                self.stage = "压缩对象"
            elif op_code & RemoteProgress.WRITING:
                self.stage = "写入对象"
            elif op_code & RemoteProgress.RECEIVING:
                self.stage = "接收对象"
                if message:
                    # 详细解析接收消息，格式通常为: "Receiving objects:  67% (835/1254), 433.00 KiB | 433.00 KiB/s"
                    # 或 "Receiving objects:  67% (835/1254)"
                    try:
                        parts = message.split(',')
                        # 解析对象数量
                        if len(parts) > 0 and "%" in parts[0]:
                            percentage_part = parts[0].strip()
                            count_part = percentage_part.split('(')[1].split(')')[0]
                            current, total = count_part.split('/')
                            self.received_objects = int(current)
                            self.total_objects = int(total)
                        
                        # 解析速度信息
                        if len(parts) > 1 and "KiB/s" in parts[1]:
                            speed_part = parts[1].strip()
                            if "|" in speed_part:
                                speed_text = speed_part.split('|')[1].strip().split(' ')[0]
                                self.speed = float(speed_text)
                            
                        # 计算ETA
                        if self.received_objects > 0 and self.total_objects > 0:
                            now = time.time()
                            time_diff = now - self._last_received_time
                            received_diff = self.received_objects - self._last_received
                            
                            # 只有当新对象接收并且时间差大于0时才更新速度
                            if time_diff > 0.5 and received_diff > 0:
                                # 使用过去几秒的数据平滑计算速度
                                self._last_received = self.received_objects
                                self._last_received_time = now
                                
                                # 计算剩余对象
                                remaining_objects = self.total_objects - self.received_objects
                                
                                # 基于最近的速率计算ETA
                                if self.speed > 0:
                                    # 假设每个对象平均大小相同
                                    objects_per_second = received_diff / time_diff
                                    if objects_per_second > 0:
                                        self.eta = remaining_objects / objects_per_second
                    except Exception as e:
                        print(f"解析进度消息出错: {e}")
            elif op_code & RemoteProgress.RESOLVING:
                self.stage = "解析引用"
            elif op_code & RemoteProgress.FINDING_SOURCES:
                self.stage = "查找源"
            elif op_code & RemoteProgress.CHECKING_OUT:
                self.stage = "检出代码"
            else:
                self.stage = "准备中"
            
            # 更新对象计数（直接从消息中提取）
            if message and "objects" in message:
                try:
                    # 如果还没有从上面解析到对象数量，这里再尝试解析
                    if self.total_objects == 0:
                        parts = message.split(',')
                        for part in parts:
                            if 'total' in part:
                                total_text = part.strip().split(' ')[0]
                                self.total_objects = int(total_text)
                            elif 'received' in part and not self.received_objects:
                                received_text = part.strip().split(' ')[0]
                                self.received_objects = int(received_text)
                            elif 'indexed' in part:
                                indexed_text = part.strip().split(' ')[0]
                                self.indexed_objects = int(indexed_text)
                except Exception as e:
                    print(f"解析对象数量出错: {e}")
            
            # 计算总体进度
            if self.total_objects > 0 and self.received_objects > 0:
                # 下载进度
                receive_progress = min(self.received_objects / self.total_objects, 1.0)
                # 索引进度
                index_progress = min(self.indexed_objects / self.total_objects, 1.0) if self.indexed_objects > 0 else 0
                # 总进度 - 下载占70%，索引占30%
                self.progress = min(receive_progress * 0.7 + index_progress * 0.3, 0.99)
            elif self.max_count > 0 and self.cur_count > 0:
                self.progress = min(self.cur_count / self.max_count, 0.99)
            else:
                # 无法获取准确进度时，进度缓慢增加
                elapsed = time.time() - self.start_time
                self.progress = min(0.1 + elapsed / 300, 0.5)  # 5分钟内最多增长到50%
            
            self.last_update = time.time()
            
            # 打印进度，便于调试
            print(f"\r{self.stage}: {int(self.progress*100)}% - {self.message}", end='', flush=True)
    
    def get_progress_data(self) -> Dict:
        """
        获取进度数据
        
        返回:
            Dict: 包含进度信息的字典
        """
        with self._lock:
            # 计算当前进度百分比之前先检查是否是初始状态
            is_initial_state = (self.total_objects == 0 and self.received_objects == 0 and 
                               self.indexed_objects == 0 and self.progress == 0.0)
            
            # 进度百分比（0-100）
            percentage = int(self.progress * 100)
            
            # 时间信息
            elapsed = time.time() - self.start_time
            
            # 完成状态判断逻辑改进
            # 优先使用显式设置的完成状态标志
            is_complete = self._is_complete
            
            # 如果没有显式设置完成，则检查是否满足条件判断为完成
            if not is_complete and self.total_objects > 0:
                # 已接收和索引的对象数等于或超过总对象数，说明下载阶段完成
                is_complete = (self.received_objects >= self.total_objects and 
                              self.indexed_objects >= self.total_objects)
            
            # 如果是初始状态，强制进度为5%
            if is_initial_state and elapsed < 3:
                percentage = 5
                stage = "准备中"
                is_complete = False
            elif is_complete or (elapsed > 5 and time.time() - self.last_update > 3):
                percentage = 100
                stage = "完成"
                # 如果判定为完成，设置显式完成标志
                self._is_complete = True
            else:
                stage = self.stage
                # 确保未完成时百分比不会达到100%
                if percentage >= 100 and not is_complete:
                    percentage = 99
            
            # 格式化ETA
            eta_text = ""
            if self.eta > 0 and percentage < 100:
                if self.eta < 60:
                    eta_text = f"约{int(self.eta)}秒"
                elif self.eta < 3600:
                    eta_text = f"约{int(self.eta/60)}分钟"
                else:
                    eta_text = f"约{int(self.eta/3600)}小时{int((self.eta%3600)/60)}分钟"
            
            return {
                "percentage": percentage,
                "stage": stage,
                "elapsed_seconds": int(elapsed),
                "total_objects": self.total_objects,
                "received_objects": self.received_objects,
                "indexed_objects": self.indexed_objects,
                "is_complete": is_complete,  # 添加完成状态标志
                "message": self.message,
                "speed": round(self.speed, 2),
                "eta": eta_text
            }


# 全局进度监视器
progress_monitor = GitProgressMonitor()


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
        # 重置进度监视器
        global progress_monitor
        progress_monitor = GitProgressMonitor()
        
        # 克隆仓库到指定路径，使用进度监视器
        repo = Repo.clone_from(
            config.git_url, 
            config.git_path, 
            branch=config.git_branch,
            progress=progress_monitor
        )
        
        # 确保进度数据显示为完成
        with progress_monitor._lock:
            progress_monitor.progress = 1.0
            progress_monitor.received_objects = progress_monitor.total_objects or 100
            progress_monitor.indexed_objects = progress_monitor.total_objects or 100
            progress_monitor.last_update = time.time()
            progress_monitor.stage = "完成"
            progress_monitor._is_complete = True  # 设置显式完成标志
        
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
        # 重置进度监视器
        global progress_monitor
        progress_monitor = GitProgressMonitor()
        
        # 使用 GitPython 打开仓库
        repo = Repo(config.git_path)
        # 切换到指定分支
        repo.git.checkout(config.git_branch)
        # 拉取远程仓库更新，使用进度监视器
        repo.remotes.origin.pull(progress=progress_monitor)
        
        # 确保进度数据显示为完成
        with progress_monitor._lock:
            progress_monitor.progress = 1.0
            progress_monitor.received_objects = progress_monitor.total_objects or 100
            progress_monitor.indexed_objects = progress_monitor.total_objects or 100
            progress_monitor.last_update = time.time()
            progress_monitor.stage = "完成"
            progress_monitor._is_complete = True  # 设置显式完成标志
        
        print("Git 仓库更新成功。")
        return True
    except Exception as e:
        # 捕获异常并打印错误信息
        print(f"更新 Git 仓库失败。错误: {e}")
        return False


def get_git_progress() -> Dict:
    """
    获取Git操作的当前进度
    
    返回:
        Dict: 包含进度信息的字典
    """
    global progress_monitor
    return progress_monitor.get_progress_data()
