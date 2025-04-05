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
    data.token = window.token;

    if (url == "") {
        alert("URL can not be null/blank");
        return false;
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
        xmlHttpRequest.send(JSON.stringify(data));
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

//检查游戏是否存在
function check(){
    
}