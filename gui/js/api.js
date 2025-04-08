doAjax("/init", "POST");

function openLink(url) {
    var request = { url: url }
    doAjax("/open-url", "POST", false, request)
}

function getHttpRequestObject() {
    // Define and initialize as false
    var xmlHttpRequst = false;

    // Mozilla/Safari/Non-IE
    if (window.XMLHttpRequest) {
        xmlHttpRequst = new XMLHttpRequest();
    }
    // IE
    else if (window.ActiveXObject) {
        xmlHttpRequst = new ActiveXObject("Microsoft.XMLHTTP");
    }
    return xmlHttpRequst;
}

function doAjax(url, method, responseHandler, data) {
    // Set the variables
    url = url || "";
    method = method || "GET";
    async = true;
    data = data || {};
    
    if (url == "") {
        alert("URL can not be null/blank");
        return false;
    }
    
    // 获取 token
    const token = window.token;
    
    // 如果是 GET 请求，将 token 添加到 URL 中
    if (method === "GET") {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}token=${token}`;
    } else {
        // POST 等其他请求，将 token 添加到数据中
        data.token = token;
    }
    
    var xmlHttpRequest = getHttpRequestObject();

    // If AJAX supported
    if (xmlHttpRequest != false) {
        xmlHttpRequest.open(method, url, async);
        // Set request header (optional if GET method is used)
        if (method == "POST") {
            xmlHttpRequest.setRequestHeader("Content-Type", "application/json");
        }
        // Assign (or define) response-handler/callback when ReadyState is changed.
        xmlHttpRequest.onreadystatechange = responseHandler;
        // Send data
        if (method === "GET") {
            xmlHttpRequest.send();
        } else {
            xmlHttpRequest.send(JSON.stringify(data));
        }
    }
    else {
        alert("Please use browser with Ajax support.!");
    }
}

/**
 * 检查游戏版本
 * @param {Function} callback - 回调函数，参数为服务器返回的结果
 */
function checkGameVersion(callback) {
    doAjax("/game/check", "POST", function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                var response = JSON.parse(this.responseText);
                if (typeof callback === 'function') {
                    callback(response);
                }
            }
        }
    });
}

/**
 * 克隆游戏
 * @param {Function} callback - 回调函数，参数为服务器返回的结果
 */
function cloneGame(callback) {
    doAjax("/game/clone", "POST", function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                var response = JSON.parse(this.responseText);
                if (typeof callback === 'function') {
                    callback(response);
                }
            }
        }
    });
}

/**
 * 更新游戏
 * @param {Function} callback - 回调函数，参数为服务器返回的结果
 */
function updateGame(callback) {
    doAjax("/game/update", "POST", function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                var response = JSON.parse(this.responseText);
                if (typeof callback === 'function') {
                    callback(response);
                }
            }
        }
    });
}

/**
 * 启动游戏
 * @param {Function} callback - 回调函数，参数为服务器返回的结果
 */
function launchGame(callback) {
    doAjax("/game/launch", "POST", function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                var response = JSON.parse(this.responseText);
                if (typeof callback === 'function') {
                    callback(response);
                }
            }
        }
    });
}

/**
 * 获取游戏下载或更新进度
 * @param {Function} callback - 回调函数，参数为服务器返回的进度信息
 */
function getGameProgress(callback) {
    doAjax("/game/progress", "GET", function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                try {
                    var response = JSON.parse(this.responseText);
                    if (typeof callback === 'function') {
                        callback(response);
                    }
                } catch (e) {
                    console.error("解析进度数据失败:", e);
                    if (typeof callback === 'function') {
                        callback({
                            status: 'error',
                            message: '解析进度数据失败',
                            percentage: 0
                        });
                    }
                }
            } else {
                // 处理请求失败的情况
                console.error("获取进度失败, 状态码:", this.status);
                if (typeof callback === 'function') {
                    callback({
                        status: 'error',
                        message: `获取进度失败，状态码: ${this.status}`,
                        percentage: 0
                    });
                }
            }
        }
    });
}

/**
 * 完整的游戏流程：检查版本 -> 克隆/更新 -> 启动
 * @param {Function} statusCallback - 状态回调函数，用于更新UI，参数为(阶段, 结果)
 * @param {Function} completeCallback - 完成回调函数，参数为最终结果
 */
function gameWorkflow(statusCallback, completeCallback) {
    // 步骤1：检查游戏版本
    checkGameVersion(function(checkResult) {
        // 通知状态
        if (typeof statusCallback === 'function') {
            statusCallback('check', checkResult);
        }
        
        if (checkResult.status !== 'ok') {
            // 检查失败
            if (typeof completeCallback === 'function') {
                completeCallback({
                    status: 'error',
                    message: '检查游戏版本失败',
                    details: checkResult
                });
            }
            return;
        }
        
        // 判断游戏是否存在
        if (!checkResult.gameExists) {
            // 游戏不存在，需要克隆
            cloneGame(function(cloneResult) {
                // 通知状态
                if (typeof statusCallback === 'function') {
                    statusCallback('clone', cloneResult);
                }
                
                if (cloneResult.status !== 'ok') {
                    // 克隆失败
                    if (typeof completeCallback === 'function') {
                        completeCallback({
                            status: 'error',
                            message: '克隆游戏失败',
                            details: cloneResult
                        });
                    }
                    return;
                }
                
                // 克隆成功，启动游戏
                launchGame(function(launchResult) {
                    // 通知状态
                    if (typeof statusCallback === 'function') {
                        statusCallback('launch', launchResult);
                    }
                    
                    // 完成流程
                    if (typeof completeCallback === 'function') {
                        completeCallback({
                            status: launchResult.status,
                            message: launchResult.message,
                            details: {
                                check: checkResult,
                                clone: cloneResult,
                                launch: launchResult
                            }
                        });
                    }
                });
            });
        } else if (checkResult.needsUpdate) {
            // 游戏存在但需要更新
            updateGame(function(updateResult) {
                // 通知状态
                if (typeof statusCallback === 'function') {
                    statusCallback('update', updateResult);
                }
                
                if (updateResult.status !== 'ok') {
                    // 更新失败
                    if (typeof completeCallback === 'function') {
                        completeCallback({
                            status: 'error',
                            message: '更新游戏失败',
                            details: updateResult
                        });
                    }
                    return;
                }
                
                // 更新成功，启动游戏
                launchGame(function(launchResult) {
                    // 通知状态
                    if (typeof statusCallback === 'function') {
                        statusCallback('launch', launchResult);
                    }
                    
                    // 完成流程
                    if (typeof completeCallback === 'function') {
                        completeCallback({
                            status: launchResult.status,
                            message: launchResult.message,
                            details: {
                                check: checkResult,
                                update: updateResult,
                                launch: launchResult
                            }
                        });
                    }
                });
            });
        } else {
            // 游戏存在且是最新版本，直接启动
            launchGame(function(launchResult) {
                // 通知状态
                if (typeof statusCallback === 'function') {
                    statusCallback('launch', launchResult);
                }
                
                // 完成流程
                if (typeof completeCallback === 'function') {
                    completeCallback({
                        status: launchResult.status,
                        message: launchResult.message,
                        details: {
                            check: checkResult,
                            launch: launchResult
                        }
                    });
                }
            });
        }
    });
}

/**
 * 获取系统公告
 * @param {Function} callback - 回调函数，处理响应结果
 */
function getAnnouncement(callback) {
  doAjax('/api/announcement', 'GET', function() {
    if (this.readyState == 4) {
      if (this.status == 200) {
        try {
          var response = JSON.parse(this.responseText);
          if (typeof callback === 'function') {
            callback.call(this, response);
          }
        } catch (e) {
          console.error("解析公告数据失败:", e);
          if (typeof callback === 'function') {
            callback.call(this, { status: 'error', message: '解析公告数据失败' });
          }
        }
      } else {
        // 处理请求失败的情况
        console.error("获取公告失败, 状态码:", this.status);
        if (typeof callback === 'function') {
          callback.call(this, { status: 'error', message: `获取公告失败，状态码: ${this.status}` });
        }
      }
    }
  });
}

/**
 * 显示模态框
 * @param {Object} options - 模态框配置选项
 * @param {string} options.title - 模态框标题
 * @param {string} options.content - 模态框内容（支持HTML）
 * @param {Array} options.buttons - 按钮配置
 * @param {string} options.type - 模态框类型 (info, success, warning, error)
 * @param {boolean} options.closeOnBackdrop - 点击背景是否关闭
 */
function showModal(options = {}) {
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalFooter = document.getElementById('modal-footer');
  const modalBackdrop = modal.querySelector('.modal-backdrop');
  const modalClose = modal.querySelector('.modal-close');
  
  // 设置标题
  modalTitle.textContent = options.title || '提示';
  
  // 设置内容
  modalBody.innerHTML = options.content || '';
  
  // 设置类型样式
  modal.className = 'modal-container';
  if (options.type) {
    modal.classList.add(`modal-${options.type}`);
  }
  
  // 清空按钮
  modalFooter.innerHTML = '';
  
  // 添加按钮
  if (options.buttons && options.buttons.length > 0) {
    options.buttons.forEach(btn => {
      const button = document.createElement('button');
      button.textContent = btn.text || '确定';
      button.className = `glass-button py-2 px-4 rounded-lg text-white hover-scale ${btn.type === 'primary' ? 'primary-btn' : ''}`;
      
      if (btn.onClick) {
        button.addEventListener('click', btn.onClick);
      } else {
        button.addEventListener('click', hideModal);
      }
      
      modalFooter.appendChild(button);
    });
  } else {
    // 默认添加关闭按钮
    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭';
    closeButton.className = 'glass-button py-2 px-4 rounded-lg text-white hover-scale';
    closeButton.addEventListener('click', hideModal);
    modalFooter.appendChild(closeButton);
  }
  
  // 显示模态框
  modal.classList.add('show');
  
  // 点击关闭按钮关闭模态框
  modalClose.addEventListener('click', hideModal);
  
  // 点击背景关闭模态框
  if (options.closeOnBackdrop !== false) {
    modalBackdrop.addEventListener('click', hideModal);
  }
}

/**
 * 隐藏模态框
 */
function hideModal() {
  const modal = document.getElementById('modal');
  modal.classList.remove('show');
}
