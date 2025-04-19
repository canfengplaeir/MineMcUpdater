import logging
import os
from contextlib import redirect_stdout
from io import StringIO

from server import server

import webview

logger = logging.getLogger(__name__)

if __name__ == '__main__':
    try:
        # 创建一个内存中的文本缓冲区，用于捕获标准输出
        stream = StringIO()
        with redirect_stdout(stream):
            # 定义窗口图标路径，使用 os.path.join 提高跨平台兼容性
            icon_path = os.path.join(os.path.dirname(__file__), 'app.ico')
            # 创建桌面窗口
            window = webview.create_window(
                '不为人知的小世界', 
                server, 
                min_size=(1200, 700), 
                frameless=True,
            )
            # 启动窗口应用程序
            webview.start(debug=True, icon=icon_path)
    except Exception as e:
        logger.error(f"启动窗口应用程序时出错: {e}")