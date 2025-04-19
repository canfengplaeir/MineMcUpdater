import requests
import json
import base64
import os
import uuid
import logging
from urllib.parse import urljoin
from typing import Dict, Optional, Tuple, Any, List

# 配置日志
logger = logging.getLogger(__name__)

class AuthlibInjectorClient:
    """Authlib-Injector 外置登录客户端
    
    提供与外置登录服务器交互的功能，包括用户认证、令牌验证、刷新等操作。
    
    Attributes:
        server_url (str): 外置登录服务器URL
        username (str): 用户名
        password (str): 密码
        access_token (str): 访问令牌
        client_token (str): 客户端令牌
        uuid (str): 用户UUID
        name (str): 用户名称
        base_code (str): 服务器元数据的Base64编码
        selected_profile (dict): 选择的用户配置文件
    """
    
    def __init__(self, server_url: str, username: str = "", password: str = ""):
        """初始化外置登录客户端
        
        Args:
            server_url: 外置登录服务器URL
            username: 用户名
            password: 密码
        """
        self.server_url = self._resolve_api_url(server_url)
        self.username = username
        self.password = password
        self.access_token: Optional[str] = None
        self.client_token: Optional[str] = None
        self.uuid: Optional[str] = None
        self.name: Optional[str] = None
        self.base_code: Optional[str] = None
        self.selected_profile: Optional[Dict[str, Any]] = None
        self.error_message: Optional[str] = None
    
    def _resolve_api_url(self, url: str) -> str:
        """解析API地址，支持ALI机制
        
        Args:
            url: 原始URL
            
        Returns:
            解析后的API URL
            
        Raises:
            requests.RequestException: 请求失败时抛出
        """
        if not url.startswith("https://") and not url.startswith("http://"):
            url = "https://" + url
            
        try:
            response = requests.get(url, allow_redirects=True, verify=False)
            response.raise_for_status()
            
            if 'X-Authlib-Injector-API-Location' in response.headers:
                new_url = response.headers['X-Authlib-Injector-API-Location']
                if new_url.startswith('/'):
                    new_url = urljoin(url, new_url)
                return new_url
            return url
        except requests.RequestException as e:
            logger.error(f"解析API地址失败: {e}")
            raise
    
    def get_server_metadata(self) -> bool:
        """获取皮肤站元数据
        
        Returns:
            bool: 获取成功返回True，否则返回False
        """
        try:
            response = requests.get(self.server_url, verify=False)
            response.raise_for_status()
            self.base_code = base64.b64encode(response.text.encode()).decode()
            return True
        except requests.RequestException as e:
            self.error_message = f"获取皮肤站元数据失败: {e}"
            logger.error(self.error_message)
            return False
    
    def authenticate(self) -> bool:
        """用户登录认证
        
        Returns:
            bool: 认证成功返回True，否则返回False
        """
        if not self.get_server_metadata():
            return False

        auth_url = self.server_url + 'authserver/authenticate'
        client_token = str(uuid.uuid4()).replace('-', '')

        payload = {
            "username": self.username,
            "password": self.password,
            "clientToken": client_token,
            "requestUser": True,
            "agent": {
                "name": "Minecraft",
                "version": 1
            }
        }

        headers = {
            "Content-Type": "application/json"
        }

        try:
            response = requests.post(auth_url, data=json.dumps(payload), headers=headers, verify=False)
            response.raise_for_status()
            data = response.json()
            
            self.access_token = data.get('accessToken')
            self.client_token = data.get('clientToken')
            profiles = data.get('availableProfiles', [])

            if not profiles:
                self.error_message = "用户没有可用角色，请先选择一个角色"
                logger.warning(self.error_message)
                return False

            selected_profile = profiles[0]  # 默认选择第一个角色
            self.uuid = selected_profile.get('id')
            self.name = selected_profile.get('name')
            self.selected_profile = selected_profile

            logger.info(f"登录成功! 用户名: {self.name}, UUID: {self.uuid}")
            return True
        except requests.RequestException as e:
            self.error_message = f"登录失败: {e}"
            logger.error(self.error_message)
            return False
    
    def validate(self) -> bool:
        """验证访问令牌是否有效
        
        Returns:
            bool: 令牌有效返回True，否则返回False
        """
        if not self.access_token or not self.client_token:
            self.error_message = "没有有效的访问令牌"
            return False

        validate_url = self.server_url + 'authserver/validate'
        payload = {
            "accessToken": self.access_token,
            "clientToken": self.client_token
        }
        headers = {"Content-Type": "application/json"}

        try:
            response = requests.post(validate_url, data=json.dumps(payload), headers=headers, verify=False)
            return response.status_code == 204
        except requests.RequestException as e:
            self.error_message = f"验证令牌失败: {e}"
            logger.error(self.error_message)
            return False
    
    def refresh(self) -> bool:
        """刷新访问令牌
        
        Returns:
            bool: 刷新成功返回True，否则返回False
        """
        if not self.access_token or not self.client_token:
            self.error_message = "没有有效的访问令牌可供刷新"
            return False

        refresh_url = self.server_url + 'authserver/refresh'
        payload = {
            "accessToken": self.access_token,
            "clientToken": self.client_token,
            "requestUser": True
        }
        headers = {"Content-Type": "application/json"}

        try:
            response = requests.post(refresh_url, data=json.dumps(payload), headers=headers, verify=False)
            response.raise_for_status()
            data = response.json()
            
            self.access_token = data.get('accessToken')
            self.client_token = data.get('clientToken')
            
            if 'selectedProfile' in data:
                self.selected_profile = data['selectedProfile']
                self.uuid = self.selected_profile.get('id')
                self.name = self.selected_profile.get('name')
            
            logger.info(f"令牌刷新成功")
            return True
        except requests.RequestException as e:
            self.error_message = f"刷新令牌失败: {e}"
            logger.error(self.error_message)
            return False
    
    def signout(self) -> bool:
        """登出账户
        
        Returns:
            bool: 登出成功返回True，否则返回False
        """
        if not self.username or not self.password:
            self.error_message = "没有提供用户名或密码"
            return False

        signout_url = self.server_url + 'authserver/signout'
        payload = {
            "username": self.username,
            "password": self.password
        }
        headers = {"Content-Type": "application/json"}

        try:
            response = requests.post(signout_url, data=json.dumps(payload), headers=headers, verify=False)
            success = response.status_code == 204
            if success:
                logger.info("用户已成功登出")
            return success
        except requests.RequestException as e:
            self.error_message = f"登出失败: {e}"
            logger.error(self.error_message)
            return False
    
    def invalidate(self) -> bool:
        """使访问令牌失效
        
        Returns:
            bool: 操作成功返回True，否则返回False
        """
        if not self.access_token or not self.client_token:
            self.error_message = "没有有效的访问令牌"
            return False

        invalidate_url = self.server_url + 'authserver/invalidate'
        payload = {
            "accessToken": self.access_token,
            "clientToken": self.client_token
        }
        headers = {"Content-Type": "application/json"}

        try:
            response = requests.post(invalidate_url, data=json.dumps(payload), headers=headers, verify=False)
            success = response.status_code == 204
            if success:
                logger.info("令牌已成功失效")
                # 清除令牌
                self.access_token = None
                self.client_token = None
            return success
        except requests.RequestException as e:
            self.error_message = f"使令牌失效操作失败: {e}"
            logger.error(self.error_message)
            return False
    
    def get_jvm_args(self, authlib_path: str = "authlib-injector.jar") -> str:
        """获取启动游戏所需的JVM参数
        
        Args:
            authlib_path: Authlib-Injector JAR文件路径
            
        Returns:
            str: JVM参数字符串
        """
        if not os.path.exists(authlib_path):
            self.error_message = "Authlib-Injector JAR文件未找到，请确保文件已下载到指定路径"
            logger.warning(self.error_message)
            return ""

        if not self.base_code:
            self.error_message = "未获取服务器元数据，请先调用get_server_metadata()方法"
            logger.warning(self.error_message)
            return ""

        jvm_args = f"-javaagent:{authlib_path}={self.server_url} -Dauthlibinjector.yggdrasil.prefetched={self.base_code}"
        return jvm_args
    
    def get_account_info(self) -> Dict[str, Any]:
        """获取账户信息
        
        Returns:
            Dict[str, Any]: 账户信息字典
        """
        return {
            "type": "authlib-injector",
            "server": self.server_url,
            "name": self.name,
            "uuid": self.uuid,
            "access_token": self.access_token,
            "client_token": self.client_token,
            "base_code": self.base_code
        }
    
    def save_account_info(self, file_path: str = "account_info.json") -> bool:
        """保存用户信息到本地文件
        
        Args:
            file_path: 保存路径
            
        Returns:
            bool: 保存成功返回True，否则返回False
        """
        try:
            account_info = self.get_account_info()
            with open(file_path, 'w') as f:
                json.dump(account_info, f, indent=4)
            logger.info(f"用户信息已保存到 {file_path}")
            return True
        except Exception as e:
            self.error_message = f"保存用户信息失败: {e}"
            logger.error(self.error_message)
            return False
    
    def load_account_info(self, file_path: str = "account_info.json") -> bool:
        """从本地文件加载用户信息
        
        Args:
            file_path: 文件路径
            
        Returns:
            bool: 加载成功返回True，否则返回False
        """
        if not os.path.exists(file_path):
            self.error_message = "用户信息文件不存在"
            logger.warning(self.error_message)
            return False

        try:
            with open(file_path, 'r') as f:
                account_info = json.load(f)

            self.server_url = account_info.get('server')
            self.name = account_info.get('name')
            self.uuid = account_info.get('uuid')
            self.access_token = account_info.get('access_token')
            self.client_token = account_info.get('client_token')
            self.base_code = account_info.get('base_code')

            logger.info("用户信息加载成功")
            return True
        except Exception as e:
            self.error_message = f"加载用户信息失败: {e}"
            logger.error(self.error_message)
            return False
    
    def get_last_error(self) -> Optional[str]:
        """获取最后一次错误信息
        
        Returns:
            Optional[str]: 错误信息，如果没有错误则返回None
        """
        return self.error_message


# 便捷函数
def login(server_url: str, username: str, password: str) -> Tuple[bool, Optional[AuthlibInjectorClient]]:
    """快速登录函数
    
    Args:
        server_url: 外置登录服务器URL
        username: 用户名
        password: 密码
        
    Returns:
        Tuple[bool, Optional[AuthlibInjectorClient]]: (是否成功, 客户端实例)
    """
    client = AuthlibInjectorClient(server_url, username, password)
    success = client.authenticate()
    return success, client if success else None


def load_account(file_path: str = "account_info.json") -> Optional[AuthlibInjectorClient]:
    """从文件加载账户
    
    Args:
        file_path: 账户信息文件路径
        
    Returns:
        Optional[AuthlibInjectorClient]: 加载成功返回客户端实例，否则返回None
    """
    if not os.path.exists(file_path):
        logger.warning(f"账户信息文件不存在: {file_path}")
        return None
        
    try:
        client = AuthlibInjectorClient("")
        if client.load_account_info(file_path):
            # 验证令牌是否有效
            if client.validate():
                return client
            # 尝试刷新令牌
            if client.refresh():
                client.save_account_info(file_path)  # 保存刷新后的令牌
                return client
        return None
    except Exception as e:
        logger.error(f"加载账户失败: {e}")
        return None


# 向后兼容的类名
AuthlibInjectorLogin = AuthlibInjectorClient


# 示例用法
if __name__ == "__main__":
    # 配置日志
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # 从命令行获取输入
    server_url = input("请输入皮肤站地址（例如 https://example.com）：")
    username = input("请输入用户名：")
    password = input("请输入密码：")

    # 使用便捷函数登录
    success, client = login(server_url, username, password)
    
    if success and client:
        client.save_account_info()
        print("登录成功，用户信息已保存。")

        # 获取JVM参数
        jvm_args = client.get_jvm_args()
        print(f"启动游戏时需要的JVM参数为：\n{jvm_args}")
    else:
        print("登录失败。")