document.addEventListener('DOMContentLoaded', function () {
    // 状态提示组件
    const statusIndicator = document.getElementById('status-indicator');
    const statusIcon = document.getElementById('status-icon');
    const statusTitle = document.getElementById('status-title');
    const statusMessage = document.getElementById('status-message');
    const statusProgress = document.getElementById('status-progress');
    const closeStatusBtn = statusIndicator.querySelector('.close-btn');

    // 启动按钮
    const launchBtn = document.getElementById('launch-btn');
    const launchBtnText = document.getElementById('launch-btn-text');
    const launchBtnLoader = launchBtn.querySelector('.loader');

    // 游戏版本显示
    const gameVersionElement = document.getElementById('game-version');

    // 游戏状态
    let gameState = {
        checked: false,
        exists: false,
        currentVersion: '0.0.0',
        remoteVersion: '',
        needsUpdate: false,
        isChecking: false
    };

    // 错误代码映射表
    const errorMessages = {
        'NETWORK_ERROR': '网络连接失败，请检查您的网络连接',
        'SERVER_ERROR': '服务器暂时不可用，请稍后再试',
        'VERSION_PARSE_ERROR': '版本信息解析失败，版本文件可能已损坏',
        'PERMISSION_DENIED': '权限不足，请检查应用权限设置',
        'GIT_ERROR': 'Git仓库操作失败，请检查网络连接或仓库地址',
        'FILE_NOT_FOUND': '找不到必要的文件或目录',
        'DISK_FULL': '磁盘空间不足，请清理磁盘空间后重试',
        'GAME_DIR_ERROR': '游戏目录访问失败，请检查目录权限',
        'LAUNCHER_NOT_FOUND': '找不到启动器程序，游戏可能未正确安装',
        'LAUNCHER_ERROR': '启动器无法启动，请检查兼容性设置',
        'UNKNOWN_ERROR': '发生未知错误，请重试或联系技术支持'
    };

    // 获取错误消息
    function getErrorMessage(errorCode, defaultMsg) {
        return errorMessages[errorCode] || defaultMsg || '操作失败，请重试';
    }

    // 处理API错误
    function handleApiError(result) {
        const errorCode = result.errorCode || 'UNKNOWN_ERROR';
        const errorMessage = result.message || getErrorMessage(errorCode);

        console.error(`API错误: ${errorCode}`, result);

        return {
            title: '操作失败',
            message: errorMessage,
            retry: true
        };
    }

    // 隐藏状态提示
    function hideStatus() {
        statusIndicator.classList.remove('show');
    }

    // 平滑设置进度条
    function setProgressSmooth(progress, duration = 800) {
        const currentProgress = parseFloat(statusProgress.style.width) || 0;
        const targetProgress = Math.min(Math.max(progress, 0), 100); // 限制进度在0-100之间
        const progressDiff = targetProgress - currentProgress;
        const startTime = performance.now();

        if (progressDiff === 0) {
            statusProgress.style.width = `${targetProgress}%`;
            return;
        }

        function animateProgress(currentTime) {
            const elapsedTime = currentTime - startTime;
            const ratio = Math.min(elapsedTime / duration, 1);
            const easedRatio = ratio < 0.5
                ? 4 * ratio * ratio * ratio
                : 1 - Math.pow(-2 * ratio + 2, 3) / 2;

            const currentValue = currentProgress + progressDiff * easedRatio;
            statusProgress.style.width = `${currentValue}%`;

            if (ratio < 1) {
                requestAnimationFrame(animateProgress);
            }
        }

        requestAnimationFrame(animateProgress);
    }

    // 显示状态提示
    function showStatus(type, title, message, progress = 0) {
        // 设置图标
        statusIcon.className = '';
        if (type === 'loading') {
            statusIcon.className = 'fa-solid fa-circle-notch icon-spin mr-2';
            statusIndicator.classList.remove('error', 'warning', 'success');
        } else if (type === 'error') {
            statusIcon.className = 'fa-solid fa-circle-exclamation icon-pulse mr-2';
            statusIndicator.classList.add('error');
            statusIndicator.classList.remove('warning', 'success');
        } else if (type === 'warning') {
            statusIcon.className = 'fa-solid fa-triangle-exclamation mr-2';
            statusIndicator.classList.add('warning');
            statusIndicator.classList.remove('error', 'success');
        } else if (type === 'success') {
            statusIcon.className = 'fa-solid fa-circle-check mr-2';
            statusIndicator.classList.add('success');
            statusIndicator.classList.remove('error', 'warning');
        }

        // 设置内容
        statusTitle.textContent = title;
        statusMessage.textContent = message;

        // 平滑设置进度条
        setProgressSmooth(progress);

        // 显示提示
        if (!statusIndicator.classList.contains('show')) {
            setTimeout(() => {
                statusIndicator.classList.add('show');
            }, 10); // 微小延迟以确保过渡效果
        }
    }

    // 显示错误提示
    function showError(errorData) {
        showStatus('error', errorData.title || '错误', errorData.message, 0);
        setTimeout(hideStatus, 4000); // 错误提示显示时间稍长
    }

    // 更优雅地设置按钮文本
    function setButtonText(button, text, iconClass = 'fa-play') {
        const currentText = button.textContent.trim();
        if (currentText === text) return; // 文本未改变，不更新

        const textSpan = button.querySelector('span') || document.createElement('span');
        textSpan.id = 'launch-btn-text';

        // 设置淡出效果
        textSpan.style.opacity = '0';
        textSpan.style.transform = 'translateY(10px)';

        // 短暂延迟后更新文本并淡入
        setTimeout(() => {
            textSpan.textContent = text;
            textSpan.style.opacity = '1';
            textSpan.style.transform = 'translateY(0)';
        }, 150);

        // 确保span是按钮的子元素
        if (!button.contains(textSpan)) {
            // 清空按钮内容，保留loader和图标
            button.innerHTML = '';

            // 添加loader
            const loader = document.createElement('div');
            loader.className = 'loader mr-2 hidden';
            button.appendChild(loader);

            // 添加图标
            const icon = document.createElement('i');
            icon.className = `fa-solid ${iconClass} mr-2`;
            button.appendChild(icon);

            // 添加文本
            button.appendChild(textSpan);
        }
    }

    // 设置启动按钮状态
    function setLaunchButtonState(state, text = null, iconClass = 'fa-play') {
        if (state === 'loading') {
            launchBtn.classList.add('btn-loading');
            launchBtnLoader.classList.remove('hidden');
            launchBtn.classList.remove('btn-disabled');
            if (text) setButtonText(launchBtn, text, iconClass);
        } else if (state === 'disabled') {
            launchBtn.classList.add('btn-disabled');
            launchBtn.classList.remove('btn-loading');
            launchBtnLoader.classList.add('hidden');
            if (text) setButtonText(launchBtn, text, iconClass);
        } else if (state === 'normal') {
            launchBtn.classList.remove('btn-loading', 'btn-disabled');
            launchBtnLoader.classList.add('hidden');
            if (text) setButtonText(launchBtn, text, iconClass);
        }
    }

    // 更新按钮状态
    function updateButtonState() {
        if (gameState.isChecking) {
            // 正在检查游戏状态
            setLaunchButtonState('disabled', '检查中...', 'fa-sync');
            return;
        }

        if (!gameState.checked) {
            // 尚未检查游戏状态
            setLaunchButtonState('disabled', '检查中...', 'fa-sync');
            return;
        }

        if (!gameState.exists) {
            // 游戏不存在
            setLaunchButtonState('normal', '下载游戏', 'fa-download');
        } else if (gameState.needsUpdate) {
            // 游戏需要更新
            setLaunchButtonState('normal', '更新游戏', 'fa-sync');
        } else {
            // 游戏存在且是最新版本
            setLaunchButtonState('normal', '开始游戏', 'fa-play');
        }
    }

    // 启动按钮点击事件
    launchBtn.addEventListener('click', function () {
        // 添加点击反馈
        launchBtn.classList.add('active');
        setTimeout(() => launchBtn.classList.remove('active'), 200);

        // 防止在检查中重复点击
        if (gameState.isChecking) {
            return;
        }

        // 检查游戏状态
        if (!gameState.checked) {
            // 尚未检查状态，先检查
            checkGameVersion();
            return;
        }

        if (!gameState.exists) {
            // 游戏不存在，开始下载
            downloadGame();
        } else if (gameState.needsUpdate) {
            // 游戏需要更新
            updateGame();
        } else {
            // 游戏存在且是最新版本，启动游戏
            startGame();
        }
    });

    // 关闭状态提示按钮点击事件
    closeStatusBtn.addEventListener('click', hideStatus);

    // 检查游戏版本
    function checkGameVersion() {
        try {
            // 设置检查状态
            gameState.isChecking = true;
            // 禁用按钮
            setLaunchButtonState('disabled', '检查中...', 'fa-sync');
            showStatus('loading', '检查游戏状态', '正在检查游戏版本...', 10);

            // 调用API检查游戏版本
            window.checkGameVersion(function (result) {
                // 重置检查状态
                gameState.isChecking = false;

                if (result.status === 'ok') {
                    // 更新游戏状态
                    gameState.checked = true;
                    gameState.exists = result.gameExists;
                    gameState.currentVersion = result.currentVersion;
                    gameState.remoteVersion = result.remoteVersion;
                    gameState.needsUpdate = result.needsUpdate;

                    // 更新版本显示
                    gameVersionElement.textContent = result.currentVersion || '未安装';

                    // 更新提示和按钮
                    if (!result.gameExists) {
                        showStatus('warning', '游戏未安装', '需要下载游戏才能开始玩', 0);
                        // 2秒后隐藏状态
                        setTimeout(hideStatus, 2000);
                    } else if (result.needsUpdate) {
                        showStatus('warning', '发现新版本', `当前版本 ${result.currentVersion}，最新版本 ${result.remoteVersion}`, 0);
                        // 2秒后隐藏状态
                        setTimeout(hideStatus, 2000);
                    } else {
                        showStatus('success', '游戏已是最新版本', `当前版本：${result.currentVersion}`, 100);
                        // 2秒后隐藏状态
                        setTimeout(hideStatus, 2000);
                    }

                    // 更新按钮状态，添加延迟使过渡更平滑
                    setTimeout(() => {
                        updateButtonState();
                    }, 300);
                } else {
                    // 检查失败
                    const errorData = handleApiError(result);
                    showError({
                        title: '检查版本失败',
                        message: errorData.message
                    });
                    setLaunchButtonState('normal', '重试检查', 'fa-redo');
                }
            });
        } catch (error) {
            // 捕获未处理的异常
            console.error('版本检查异常:', error);
            gameState.isChecking = false;
            showError({
                title: '检查版本异常',
                message: '执行检查时发生意外错误，请重试'
            });
            setLaunchButtonState('normal', '重试检查', 'fa-redo');
        }
    }

    // 下载游戏
    function downloadGame() {
        try {
            setLaunchButtonState('loading', '下载中...', 'fa-download');
            showStatus('loading', '开始下载游戏', '正在从仓库克隆游戏，请稍候...', 5);

            // 启动一个定时器，定期查询下载进度
            let progressTimer = null;
            let lastPercentage = 0;
            let noChangeCount = 0;
            let progressCheckCount = 0;
            
            // 创建进度查询函数
            const checkProgress = function() {
                window.getGameProgress(function(result) {
                    if (result.status === 'ok') {
                        // 获取进度百分比
                        const percentage = result.percentage || 0;
                        // 获取当前阶段
                        const stage = result.stage || '';
                        // 获取下载速度
                        const speed = result.speed || 0;
                        // 获取预计剩余时间
                        const eta = result.eta || '';
                        // 获取完成状态
                        const isComplete = result.is_complete || false;
                        // 总对象数和已接收对象数
                        const totalObjects = result.total_objects || 0;
                        const receivedObjects = result.received_objects || 0;
                        
                        // 防止误报100%进度
                        // 如果进度是100%但没有对象数据，或刚开始下载时，认为是初始状态
                        const isInitialPhase = 
                            (percentage === 100 && totalObjects === 0) || 
                            (progressCheckCount < 3 && percentage === 100 && !isComplete);
                        
                        // 如果是初始阶段且进度异常，使用默认进度
                        const displayPercentage = isInitialPhase ? 5 : percentage;
                        
                        // 检查进度是否变化
                        if (displayPercentage === lastPercentage) {
                            noChangeCount++;
                            // 如果连续5次进度没有变化，且不是100%，说明可能出现了问题
                            if (noChangeCount > 5 && displayPercentage < 100 && displayPercentage > 0) {
                                // 更新提示信息，但继续查询
                                showStatus('loading', '下载游戏中', `当前进度: ${displayPercentage}%，阶段: ${stage}，可能遇到网络延迟...`, displayPercentage);
                            }
                        } else {
                            // 进度有变化，重置计数器
                            noChangeCount = 0;
                            lastPercentage = displayPercentage;
                        }
                        
                        // 递增检查次数
                        progressCheckCount++;
                        
                        // 根据百分比设置状态信息
                        let statusMessage = `当前进度: ${displayPercentage}%`;
                        
                        // 添加阶段信息
                        if (stage) {
                            statusMessage += `，阶段: ${stage}`;
                        }
                        
                        // 添加速度信息
                        if (speed > 0) {
                            statusMessage += `，速度: ${speed} KB/s`;
                        }
                        
                        // 添加预计完成时间
                        if (eta) {
                            statusMessage += `，预计剩余时间: ${eta}`;
                        }
                        
                        // 添加已接收/总对象数量信息
                        if (result.total_objects > 0) {
                            statusMessage += `，对象: ${result.received_objects}/${result.total_objects}`;
                        }
                        
                        // 显示下载状态
                        showStatus('loading', '下载游戏中', statusMessage, displayPercentage);
                        
                        // 如果下载完成，停止查询
                        // 必须同时满足百分比为100且is_complete为true，才算真正完成
                        if (percentage >= 100 && isComplete) {
                            console.log("下载真正完成，停止进度查询");
                            if (progressTimer) {
                                clearInterval(progressTimer);
                                progressTimer = null;
                            }
                        } else if (percentage >= 95) {
                            // 进度接近完成但未真正完成时，显示更详细的状态
                            console.log(`下载进度: ${percentage}%, 已接收: ${result.received_objects}/${result.total_objects}, 已索引: ${result.indexed_objects}/${result.total_objects}, 完成标志: ${isComplete}`);
                            // 如果显示的百分比高但实际未完成，告知用户
                            if (percentage >= 99 && !isComplete) {
                                showStatus('loading', '正在完成下载', `下载到: ${percentage}%，正在完成最后处理...`, percentage);
                            }
                        }
                    } else {
                        // 获取进度失败，使用递增进度
                        console.warn('获取下载进度失败:', result.message);
                        // 自动递增进度，但不超过95%
                        lastPercentage = Math.min(lastPercentage + 1, 95);
                        showStatus('loading', '下载游戏中', '正在下载，无法获取精确进度...', lastPercentage);
                    }
                });
            };
            
            // 立即执行一次进度查询
            checkProgress();
            
            // 每秒查询一次进度
            progressTimer = setInterval(checkProgress, 1000);

            // 调用API克隆游戏
            window.cloneGame(function (result) {
                // 清除进度条定时器
                if (progressTimer) {
                    clearInterval(progressTimer);
                    progressTimer = null;
                }

                if (result.status === 'ok') {
                    // 下载成功
                    gameState.exists = true;
                    gameState.currentVersion = result.version;
                    gameState.needsUpdate = false;

                    // 更新版本显示
                    gameVersionElement.textContent = result.version;

                    // 更新提示和按钮
                    showStatus('success', '游戏下载完成', '游戏已成功下载，可以开始游戏了', 100);

                    // 延迟更新按钮状态，使过渡更平滑
                    setTimeout(() => {
                        setLaunchButtonState('normal', '开始游戏', 'fa-play');
                    }, 300);

                    // 3秒后隐藏状态
                    setTimeout(hideStatus, 3000);
                } else {
                    // 下载失败
                    const errorData = handleApiError(result);
                    showError({
                        title: '下载游戏失败',
                        message: errorData.message
                    });
                    setLaunchButtonState('normal', '重试下载', 'fa-download');
                }
            });
        } catch (error) {
            // 捕获未处理的异常
            console.error('下载游戏异常:', error);
            showError({
                title: '下载游戏异常',
                message: '执行下载时发生意外错误，请重试'
            });
            setLaunchButtonState('normal', '重试下载', 'fa-download');
        }
    }

    // 更新游戏
    function updateGame() {
        try {
            setLaunchButtonState('loading', '更新中...', 'fa-sync');
            showStatus('loading', '开始更新游戏', `正在从 ${gameState.currentVersion} 更新到 ${gameState.remoteVersion}...`, 5);

            // 启动一个定时器，定期查询更新进度
            let progressTimer = null;
            let lastPercentage = 0;
            let noChangeCount = 0;
            let progressCheckCount = 0;
            
            // 创建进度查询函数
            const checkProgress = function() {
                window.getGameProgress(function(result) {
                    if (result.status === 'ok') {
                        // 获取进度百分比
                        const percentage = result.percentage || 0;
                        // 获取当前阶段
                        const stage = result.stage || '';
                        // 获取下载速度
                        const speed = result.speed || 0;
                        // 获取预计剩余时间
                        const eta = result.eta || '';
                        // 获取完成状态
                        const isComplete = result.is_complete || false;
                        // 总对象数和已接收对象数
                        const totalObjects = result.total_objects || 0;
                        const receivedObjects = result.received_objects || 0;
                        
                        // 防止误报100%进度
                        // 如果进度是100%但没有对象数据，或刚开始下载时，认为是初始状态
                        const isInitialPhase = 
                            (percentage === 100 && totalObjects === 0) || 
                            (progressCheckCount < 3 && percentage === 100 && !isComplete);
                        
                        // 如果是初始阶段且进度异常，使用默认进度
                        const displayPercentage = isInitialPhase ? 5 : percentage;
                        
                        // 检查进度是否变化
                        if (displayPercentage === lastPercentage) {
                            noChangeCount++;
                            // 如果连续5次进度没有变化，且不是100%，说明可能出现了问题
                            if (noChangeCount > 5 && displayPercentage < 100 && displayPercentage > 0) {
                                // 更新提示信息，但继续查询
                                showStatus('loading', '更新游戏中', `当前进度: ${displayPercentage}%，阶段: ${stage}，可能遇到网络延迟...`, displayPercentage);
                            }
                        } else {
                            // 进度有变化，重置计数器
                            noChangeCount = 0;
                            lastPercentage = displayPercentage;
                        }
                        
                        // 递增检查次数
                        progressCheckCount++;
                        
                        // 根据百分比设置状态信息
                        let statusMessage = `当前进度: ${displayPercentage}%`;
                        
                        // 添加阶段信息
                        if (stage) {
                            statusMessage += `，阶段: ${stage}`;
                        }
                        
                        // 添加速度信息
                        if (speed > 0) {
                            statusMessage += `，速度: ${speed} KB/s`;
                        }
                        
                        // 添加预计完成时间
                        if (eta) {
                            statusMessage += `，预计剩余时间: ${eta}`;
                        }
                        
                        // 添加已接收/总对象数量信息
                        if (result.total_objects > 0) {
                            statusMessage += `，对象: ${result.received_objects}/${result.total_objects}`;
                        }
                        
                        // 显示更新状态
                        showStatus('loading', '更新游戏中', statusMessage, displayPercentage);
                        
                        // 如果更新完成，停止查询
                        // 必须同时满足百分比为100且is_complete为true，才算真正完成
                        if (percentage >= 100 && isComplete) {
                            console.log("更新真正完成，停止进度查询");
                            if (progressTimer) {
                                clearInterval(progressTimer);
                                progressTimer = null;
                            }
                        } else if (percentage >= 95) {
                            // 进度接近完成但未真正完成时，显示更详细的状态
                            console.log(`更新进度: ${percentage}%, 已接收: ${result.received_objects}/${result.total_objects}, 已索引: ${result.indexed_objects}/${result.total_objects}, 完成标志: ${isComplete}`);
                            // 如果显示的百分比高但实际未完成，告知用户
                            if (percentage >= 99 && !isComplete) {
                                showStatus('loading', '正在完成更新', `更新到: ${percentage}%，正在完成最后处理...`, percentage);
                            }
                        }
                    } else {
                        // 获取进度失败，使用递增进度
                        console.warn('获取更新进度失败:', result.message);
                        // 自动递增进度，但不超过95%
                        lastPercentage = Math.min(lastPercentage + 1, 95);
                        showStatus('loading', '更新游戏中', '正在更新，无法获取精确进度...', lastPercentage);
                    }
                });
            };
            
            // 立即执行一次进度查询
            checkProgress();
            
            // 每秒查询一次进度
            progressTimer = setInterval(checkProgress, 1000);

            // 调用API更新游戏
            window.updateGame(function (result) {
                // 清除进度条定时器
                if (progressTimer) {
                    clearInterval(progressTimer);
                    progressTimer = null;
                }

                if (result.status === 'ok') {
                    // 更新成功
                    gameState.currentVersion = result.version;
                    gameState.needsUpdate = false;

                    // 更新版本显示
                    gameVersionElement.textContent = result.version;

                    // 更新提示和按钮
                    showStatus('success', '游戏更新完成', `已更新到最新版本：${result.version}`, 100);

                    // 延迟更新按钮状态，使过渡更平滑
                    setTimeout(() => {
                        setLaunchButtonState('normal', '开始游戏', 'fa-play');
                    }, 300);

                    // 3秒后隐藏状态
                    setTimeout(hideStatus, 3000);
                } else {
                    // 更新失败
                    const errorData = handleApiError(result);
                    showError({
                        title: '更新游戏失败',
                        message: errorData.message
                    });
                    setLaunchButtonState('normal', '重试更新', 'fa-sync');
                }
            });
        } catch (error) {
            // 捕获未处理的异常
            console.error('更新游戏异常:', error);
            showError({
                title: '更新游戏异常',
                message: '执行更新时发生意外错误，请重试'
            });
            setLaunchButtonState('normal', '重试更新', 'fa-sync');
        }
    }

    // 启动游戏
    function startGame() {
        try {
            setLaunchButtonState('loading', '启动中...', 'fa-rocket');
            showStatus('loading', '正在启动游戏', '正在启动游戏，请稍候...', 50);

            // 设置进度条动画
            setProgressSmooth(80, 500);

            // 调用API启动游戏
            window.launchGame(function (result) {
                if (result.status === 'ok') {
                    // 启动成功
                    showStatus('success', '游戏已启动', '游戏已成功启动！', 100);

                    // 延迟更新按钮状态，使过渡更平滑
                    setTimeout(() => {
                        setLaunchButtonState('normal', '已启动', 'fa-check');
                    }, 300);

                    // 3秒后隐藏状态
                    setTimeout(hideStatus, 3000);
                } else {
                    // 启动失败
                    const errorData = handleApiError(result);
                    showError({
                        title: '启动游戏失败',
                        message: errorData.message
                    });
                    setLaunchButtonState('normal', '重试启动', 'fa-play');
                }
            });
        } catch (error) {
            // 捕获未处理的异常
            console.error('启动游戏异常:', error);
            showError({
                title: '启动游戏异常',
                message: '执行启动时发生意外错误，请重试'
            });
            setLaunchButtonState('normal', '重试启动', 'fa-play');
        }
    }

    // 页面加载完成后自动检查游戏状态，添加延迟使页面动画完成后再检查
    setTimeout(function () {
        checkGameVersion();
    }, 800);
});

/**
 * 公告管理
 */
class AnnouncementManager {
  constructor() {
    // 公告数据
    this.announcement = null;
    // 公告ID存储键名
    this.STORAGE_KEY = 'announcement_last_seen';
    // 是否已初始化
    this.initialized = false;
    // 公告按钮元素
    this.announcementBtn = null;
    // 公告通知标记
    this.hasNewAnnouncement = false;
    // 是否正在获取公告
    this.isFetchingAnnouncement = false;
    this.lastSeenAnnouncementKey = `announcement_last_seen_${window.token}`;
  }
  
  /**
   * 初始化公告管理器
   */
  async init() {
    try {
      // 获取公告按钮元素
      this.announcementBtn = document.getElementById('announcement-btn');
      
      if (!this.announcementBtn) {
        console.warn('公告按钮未找到，无法初始化公告功能');
        return;
      }
      
      // 为公告按钮添加点击事件
      this.announcementBtn.addEventListener('click', () => this.showAnnouncement());
      
      // 获取公告内容
      try {
        await this.fetchAnnouncement();
      } catch (error) {
        console.error('获取公告信息失败:', error);
        // 设置一个默认空公告，避免后续逻辑报错
        this.announcement = {
          status: 'ok',
          id: 'default',
          title: '公告',
          content: '暂无公告或获取公告失败',
          show_on_startup: false
        };
      }
      
      // 检查是否需要显示公告
      let shouldShow = false;
      
      // 如果有公告且设置为启动时显示
      if (this.announcement && this.announcement.id) {
        // 获取上次已读公告ID
        const lastReadId = sessionStorage.getItem(this.lastSeenAnnouncementKey);
        
        // 如果上次已读ID不等于当前公告ID，并且公告设置了启动时显示，则显示公告
        if (this.announcement.show_on_startup && lastReadId !== this.announcement.id) {
          shouldShow = true;
          // 显示公告
          setTimeout(() => this.showAnnouncement(), 500);
        }
      }
      
      // 设置新公告标记
      this.updateNotificationStatus(shouldShow);
      
      this.initialized = true;
    } catch (error) {
      console.error('初始化公告管理器失败:', error);
      // 即使初始化失败，也确保按钮可用
      if (this.announcementBtn) {
        this.announcementBtn.addEventListener('click', () => {
          showModal({
            title: '公告',
            content: '获取公告失败，请稍后重试',
            type: 'error'
          });
        });
      }
    }
  }
  
  /**
   * 获取公告内容
   */
  fetchAnnouncement() {
    if (this.isFetchingAnnouncement) {
      return Promise.reject(new Error('正在获取公告，请勿重复请求'));
    }
    
    this.isFetchingAnnouncement = true;
    
    return new Promise((resolve, reject) => {
      // 先尝试使用远程API获取公告
      try {
        import('./remote-api.js')
          .then(module => {
            const { getRemoteAnnouncement } = module;
            
            // 获取远程公告
            getRemoteAnnouncement((response) => {
              this.isFetchingAnnouncement = false;
              
              if (!response) {
                reject(new Error('获取公告失败'));
                return;
              }
              
              if (response.status === 'ok') {
                this.announcement = response;
                resolve(response);
              } else {
                reject(new Error(response.message || '获取公告失败'));
              }
            }, true); // true表示如果远程API失败，回退到本地API
          })
          .catch(error => {
            console.error('导入远程API模块失败，回退到本地API:', error);
            // 回退到本地API
            this.fetchLocalAnnouncement().then(resolve).catch(reject);
          });
      } catch (error) {
        console.error('尝试远程API失败，回退到本地API:', error);
        // 回退到本地API
        this.fetchLocalAnnouncement().then(resolve).catch(reject);
      }
    });
  }
  
  /**
   * 使用本地API获取公告
   */
  fetchLocalAnnouncement() {
    return new Promise((resolve, reject) => {
      getAnnouncement(function(response) {
        this.isFetchingAnnouncement = false;
        
        if (!response) {
          reject(new Error('获取公告失败'));
          return;
        }
        
        if (response.status === 'ok') {
          this.announcement = response;
          resolve(response);
        } else {
          reject(new Error(response.message || '获取公告失败'));
        }
      }.bind(this));
    });
  }
  
  /**
   * 更新通知状态
   * @param {boolean} hasNew - 是否有新公告
   */
  updateNotificationStatus(hasNew) {
    this.hasNewAnnouncement = hasNew;
    
    if (!this.announcementBtn) return;
    
    if (hasNew) {
      // 添加闪烁动画和标记
      this.announcementBtn.classList.add('animate-pulse');
      // 添加红点标记
      const notificationDot = document.createElement('span');
      notificationDot.className = 'absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full';
      this.announcementBtn.appendChild(notificationDot);
      // 设置提示文本
      this.announcementBtn.setAttribute('title', '查看新公告');
    } else {
      // 移除闪烁动画和标记
      this.announcementBtn.classList.remove('animate-pulse');
      // 移除红点标记
      const notificationDot = this.announcementBtn.querySelector('span');
      if (notificationDot) notificationDot.remove();
      // 重置提示文本
      this.announcementBtn.setAttribute('title', '查看公告');
    }
  }
  
  /**
   * 显示公告
   */
  async showAnnouncement() {
    try {
      // 如果没有公告数据，先获取
      if (!this.announcement) {
        try {
          await this.fetchAnnouncement();
        } catch (error) {
          console.error('获取公告数据失败:', error);
          // 创建一个默认错误公告
          this.announcement = {
            status: 'error',
            id: 'error',
            title: '获取公告失败',
            content: '无法获取公告数据，请检查网络连接或稍后再试。',
            show_on_startup: false
          };
        }
      }
      
      // 如果还是没有公告数据或者状态为error，显示一个错误提示
      if (!this.announcement || this.announcement.status === 'error') {
        // 尝试使用window上的showModal方法（由Modal组件暴露）
        if (typeof window.showModal === 'function') {
          window.showModal({
            title: '公告',
            content: this.announcement?.content || '暂无公告或获取公告失败',
            type: 'error',
            buttons: [{
              text: '关闭',
              onClick: () => window.closeModal()
            }]
          });
        } else {
          // 回退到旧的showModal函数
          showModal({
            title: '公告',
            content: this.announcement?.content || '暂无公告或获取公告失败',
            type: 'error',
            buttons: [{
              text: '关闭',
              onClick: () => hideModal()
            }]
          });
        }
        return;
      }
      
      const onButtonClick = () => {
        // 记录已读状态
        sessionStorage.setItem(this.lastSeenAnnouncementKey, this.announcement.id);
        // 更新通知状态
        this.updateNotificationStatus(false);
      };
      
      // 尝试使用window上的showModal方法（由Modal组件暴露）
      if (typeof window.showModal === 'function') {
        window.showModal({
          title: this.announcement.title || '系统公告',
          content: this.announcement.content,
          buttons: [{
            text: '我知道了',
            className: 'glass-button py-2 px-4 rounded-lg text-white hover-scale primary-btn',
            onClick: () => {
              onButtonClick();
              window.closeModal();
            }
          }]
        });
      } else {
        // 回退到旧的showModal函数
        showModal({
          title: this.announcement.title || '系统公告',
          content: this.announcement.content,
          buttons: [{
            text: '我知道了',
            type: 'primary',
            onClick: () => {
              onButtonClick();
              hideModal();
            }
          }]
        });
      }
    } catch (error) {
      console.error('显示公告失败:', error);
      
      // 显示错误提示
      const showErrorModal = (options) => {
        try {
          if (typeof window.showModal === 'function') {
            window.showModal(options);
          } else {
            showModal(options);
          }
        } catch (e) {
          console.error('显示错误模态框失败:', e);
          alert('获取公告失败，请稍后重试');
        }
      };
      
      showErrorModal({
        title: '错误',
        content: '获取公告失败，请稍后重试',
        type: 'error'
      });
    }
  }
}

// 全局公告管理器实例
const announcementManager = new AnnouncementManager();

// 在window对象上暴露公告管理器，确保它可以被main.js访问
window.announcementManager = announcementManager;

// 在DOM内容加载后自动初始化
document.addEventListener('DOMContentLoaded', function() {
  // 延迟初始化公告管理器，确保在主要UI加载后
  setTimeout(() => {
    announcementManager.init();
  }, 1000);
});
