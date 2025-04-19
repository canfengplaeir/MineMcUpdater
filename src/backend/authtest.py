import requests
import json
import base64
import os
import uuid
from urllib.parse import urlparse, urlunparse, urljoin

class AuthlibInjectorLogin:
    def __init__(self, server_url, username, password):
        self.server_url = self.resolve_api_url(server_url)
        self.username = username
        self.password = password
        self.access_token = None
        self.client_token = None
        self.uuid = None
        self.name = None
        self.base_code = None
        self.selected_profile = None

    def resolve_api_url(self, url):
        """解析API地址，支持ALI机制"""
        if not url.startswith("https://"):
            url = "https://" + url
        response = requests.get(url, allow_redirects=True, verify=False)
        response.raise_for_status()
        if 'X-Authlib-Injector-API-Location' in response.headers:
            new_url = response.headers['X-Authlib-Injector-API-Location']
            if new_url.startswith('/'):
                new_url = urljoin(url, new_url)
            return new_url
        return url

    def get_server_metadata(self):
        """获取皮肤站元数据"""
        try:
            response = requests.get(self.server_url, verify=False)
            response.raise_for_status()
            self.base_code = base64.b64encode(response.text.encode()).decode()
        except requests.RequestException as e:
            print(f"获取皮肤站元数据失败：{e}")
            return False
        return True

    def authenticate(self):
        """用户登录认证"""
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
                print("用户没有可用角色，请先选择一个角色。")
                return False

            selected_profile = profiles[0]  # 默认选择第一个角色
            self.uuid = selected_profile.get('id')
            self.name = selected_profile.get('name')

            print(f"登录成功！用户名：{self.name}, UUID：{self.uuid}")
            return True
        except requests.RequestException as e:
            print(f"登录失败：{e}")
            return False

    def save_account_info(self, file_path="account_info.json"):
        """保存用户信息到本地文件"""
        account_info = {
            "type": "authlib-injector",
            "server": self.server_url,
            "name": self.name,
            "uuid": self.uuid,
            "access_token": self.access_token,
            "client_token": self.client_token,
            "base_code": self.base_code
        }

        with open(file_path, 'w') as f:
            json.dump(account_info, f, indent=4)
        print(f"用户信息已保存到 {file_path}")

    def load_account_info(self, file_path="account_info.json"):
        """从本地文件加载用户信息"""
        if not os.path.exists(file_path):
            print("用户信息文件不存在。")
            return False

        with open(file_path, 'r') as f:
            account_info = json.load(f)

        self.server_url = account_info.get('server')
        self.name = account_info.get('name')
        self.uuid = account_info.get('uuid')
        self.access_token = account_info.get('access_token')
        self.client_token = account_info.get('client_token')
        self.base_code = account_info.get('base_code')

        print("用户信息加载成功。")
        return True

    def validate(self):
        """验证访问令牌是否有效"""
        if not self.access_token or not self.client_token:
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
        except requests.RequestException:
            return False

    def refresh(self):
        """刷新访问令牌"""
        if not self.access_token or not self.client_token:
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
            
            return True
        except requests.RequestException as e:
            print(f"刷新令牌失败：{e}")
            return False

    def signout(self):
        """登出账户"""
        if not self.username or not self.password:
            return False

        signout_url = self.server_url + 'authserver/signout'
        payload = {
            "username": self.username,
            "password": self.password
        }
        headers = {"Content-Type": "application/json"}

        try:
            response = requests.post(signout_url, data=json.dumps(payload), headers=headers, verify=False)
            return response.status_code == 204
        except requests.RequestException:
            return False

    def invalidate(self):
        """使访问令牌失效"""
        if not self.access_token or not self.client_token:
            return False

        invalidate_url = self.server_url + 'authserver/invalidate'
        payload = {
            "accessToken": self.access_token,
            "clientToken": self.client_token
        }
        headers = {"Content-Type": "application/json"}

        try:
            response = requests.post(invalidate_url, data=json.dumps(payload), headers=headers, verify=False)
            return response.status_code == 204
        except requests.RequestException:
            return False

    def get_jvm_args(self, authlib_path="authlib-injector.jar"):
        """获取启动游戏所需的JVM参数"""
        if not os.path.exists(authlib_path):
            print("Authlib-Injector JAR文件未找到，请确保文件已下载到指定路径。")
            return ""

        jvm_args = f"-javaagent:{authlib_path}={self.server_url} -Dauthlibinjector.yggdrasil.prefetched={self.base_code}"
        return jvm_args


# 示例用法
if __name__ == "__main__":
    server_url = input("请输入皮肤站地址（例如 https://example.com）：")
    username = input("请输入用户名：")
    password = input("请输入密码：")

    authlib_login = AuthlibInjectorLogin(server_url, username, password)

    if authlib_login.authenticate():
        authlib_login.save_account_info()
        print("登录成功，用户信息已保存。")

        # 加载用户信息并获取JVM参数
        if authlib_login.load_account_info():
            jvm_args = authlib_login.get_jvm_args()
            print(f"启动游戏时需要的JVM参数为：\n{jvm_args}")
    else:
        print("登录失败。")