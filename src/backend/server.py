import json
import os
import webbrowser
from functools import wraps

import app
from flask import Flask, jsonify, render_template, request

import webview
from config import get_game_config

gui_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'gui')  # development path

if not os.path.exists(gui_dir):  # frozen executable path
    gui_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gui')

server = Flask(__name__,
               static_folder=gui_dir,
               template_folder=gui_dir,
               static_url_path='') # Serve static files from the root URL path
server.debug = True
server.config['SEND_FILE_MAX_AGE_DEFAULT'] = 1  # disable caching


def verify_token(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        token = None
        if request.method == 'GET':
            # GET 请求从查询参数获取 token
            token = request.args.get('token')
        else:
            # POST 请求从请求体获取 token
            try:
                if request.data:
                    data = json.loads(request.data)
                    token = data.get('token')
            except json.JSONDecodeError:
                token = None
        
        if token == webview.token:
            return function(*args, **kwargs)
        else:
            raise Exception('Authentication error')

    return wrapper


@server.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store'
    return response


@server.route('/')
def landing():
    """
    Render index.html. Initialization is performed asynchronously in initialize() function
    """
    return render_template('index.html', token=webview.token)


@server.route('/init', methods=['POST'])
@verify_token
def initialize():
    """
    Perform heavy-lifting initialization asynchronously.
    :return:
    """
    can_start = app.initialize()

    if can_start:
        response = {
            'status': 'ok',
        }
    else:
        response = {'status': 'error'}

    return jsonify(response)


@server.route('/choose/path', methods=['POST'])
@verify_token
def choose_path():
    """
    Invoke a folder selection dialog here
    :return:
    """
    dirs = webview.windows[0].create_file_dialog(webview.FOLDER_DIALOG)
    if dirs and len(dirs) > 0:
        directory = dirs[0]
        if isinstance(directory, bytes):
            directory = directory.decode('utf-8')

        response = {'status': 'ok', 'directory': directory}
    else:
        response = {'status': 'cancel'}

    return jsonify(response)


@server.route('/fullscreen', methods=['POST'])
@verify_token
def fullscreen():
    webview.windows[0].toggle_fullscreen()
    return jsonify({})


@server.route('/open-url', methods=['POST'])
@verify_token
def open_url():
    """
    打开URL的API端点
    
    请求体格式:
    {
        "url": "要打开的URL地址"
    }
    
    示例:
    POST /open-url
    {
        "url": "https://www.example.com"
    }
    
    返回:
    成功时返回空对象 {}
    """
    url = request.json['url']
    webbrowser.open_new_tab(url)

    return jsonify({})


@server.route('/do/stuff', methods=['POST'])
@verify_token
def do_stuff():
    result = app.do_stuff()

    if result:
        response = {'status': 'ok', 'result': result}
    else:
        response = {'status': 'error'}

    return jsonify(response)


# 检查游戏版本
@server.route('/game/check', methods=['POST'])
@verify_token
def check_game():
    """
    检查游戏版本的API端点
    
    返回:
    {
        "status": "ok/error",
        "currentVersion": "当前游戏版本号",
        "remoteVersion": "远程游戏版本号",
        "needsUpdate": true/false,  # 是否需要更新
        "gameExists": true/false,   # 游戏是否存在
        "gamePath": "游戏路径",      # 游戏路径
        "checkedAt": "检查时间"      # ISO格式的检查时间
    }
    """
    result = app.check_game_version()
    return jsonify(result)


# 克隆游戏
@server.route('/game/clone', methods=['POST'])
@verify_token
def clone_game():
    """
    克隆游戏的API端点
    
    返回:
    {
        "status": "ok/error",
        "message": "操作结果信息",
        "version": "克隆的游戏版本"
    }
    """
    result = app.clone_game()
    return jsonify(result)


# 更新游戏
@server.route('/game/update', methods=['POST'])
@verify_token
def update_game():
    """
    更新游戏的API端点
    
    返回:
    {
        "status": "ok/error",
        "message": "操作结果信息",
        "version": "更新后的游戏版本"
    }
    """
    result = app.update_game()
    return jsonify(result)


# 启动游戏
@server.route('/game/launch', methods=['POST'])
@verify_token
def launch_game():
    """
    启动游戏的API端点
    
    返回:
    {
        "status": "ok/error",
        "message": "操作结果信息",
        "launcherPath": "启动器路径"
    }
    """
    result = app.launch_game()
    return jsonify(result)


# 获取游戏下载/更新进度
@server.route('/game/progress', methods=['GET'])
@verify_token
def get_game_progress():
    """
    获取游戏下载或更新进度的API端点
    
    返回:
    {
        "status": "ok/error",
        "percentage": 进度百分比,
        "stage": "当前阶段",
        "elapsed_seconds": 已经过时间(秒),
        "total_objects": 总对象数,
        "received_objects": 已接收对象数,
        "indexed_objects": 已索引对象数,
        "is_complete": true/false,  # 是否真正完成
        "speed": 下载速度(KB/s),
        "eta": "预计剩余时间",
        "message": "进度详细信息"
    }
    """
    result = app.get_game_progress()
    return jsonify(result)


@server.route('/api/announcement', methods=['GET'])
@verify_token
def get_announcement():
    """
    获取系统公告
    Returns:
        JSON: 包含公告内容和显示设置的JSON
    """
    try:
        # 读取公告数据
        announcement_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'announcement.json')
        if os.path.exists(announcement_path):
            with open(announcement_path, 'r', encoding='utf-8') as f:
                announcement = json.load(f)
                # 确保返回JSON中包含status字段
                if 'status' not in announcement:
                    announcement['status'] = 'ok'
            return jsonify(announcement)
        else:
            # 返回默认公告
            default_announcement = {
                "status": "ok",
                "id": "default-001",
                "title": "欢迎使用",
                "content": "<p>欢迎使用不为人知的小世界启动器！</p>",
                "show_on_startup": True
            }
            return jsonify(default_announcement)
    except Exception as e:
        import traceback
        print(f"获取公告失败: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"status": "error", "message": str(e)})


# 窗口控制 API
@server.route('/api/window/minimize', methods=['POST'])
@verify_token
def minimize_window():
    """
    最小化窗口的API端点
    
    返回:
    {
        "status": "ok/error",
        "message": "操作结果信息"
    }
    """
    result = app.minimize_window()
    return jsonify(result)


@server.route('/api/window/close', methods=['POST'])
@verify_token
def close_window():
    """
    关闭窗口的API端点
    
    返回:
    {
        "status": "ok/error",
        "message": "操作结果信息"
    }
    """
    result = app.close_window()
    return jsonify(result)