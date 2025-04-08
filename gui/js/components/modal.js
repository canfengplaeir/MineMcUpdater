/**
 * 模态框组件
 */
class Modal {
  /**
   * 初始化模态框
   * @param {string} modalId - 模态框的ID
   */
  constructor(modalId = 'modal') {
    this.modal = document.getElementById(modalId);
    this.modalTitle = document.getElementById('modal-title');
    this.modalBody = document.getElementById('modal-body');
    this.modalFooter = document.getElementById('modal-footer');
    this.modalContent = this.modal.querySelector('.modal-content');
    this.modalBackdrop = this.modal.querySelector('.modal-backdrop');
    
    // 绑定方法到实例
    this.show = this.show.bind(this);
    this.close = this.close.bind(this);
    
    // 初始化关闭事件
    const closeButtons = this.modal.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', this.close);
    });
  }
  
  /**
   * 显示模态框
   * @param {Object} options - 模态框选项
   */
  show(options = {}) {
    // 设置默认选项
    const defaults = {
      title: '通知',
      content: '',
      buttons: [],
      showCloseButton: true,
      onOpen: null,
      onClose: null,
      width: null,
      closeOnBackdrop: true
    };
    
    // 合并选项
    const settings = { ...defaults, ...options };
    
    // 设置标题
    this.modalTitle.textContent = settings.title;
    
    // 设置内容
    if (typeof settings.content === 'string') {
      this.modalBody.innerHTML = settings.content;
    } else if (settings.content instanceof HTMLElement) {
      this.modalBody.innerHTML = '';
      this.modalBody.appendChild(settings.content);
    }
    
    // 设置宽度
    if (settings.width) {
      this.modalContent.style.width = settings.width;
    } else {
      this.modalContent.style.width = '';
    }
    
    // 设置按钮
    this.modalFooter.innerHTML = '';
    if (settings.buttons && settings.buttons.length > 0) {
      settings.buttons.forEach(button => {
        const btnElement = document.createElement('button');
        btnElement.textContent = button.text || '按钮';
        btnElement.className = button.className || 'glass-button py-2 px-4 rounded-lg text-white hover-scale';
        
        if (button.onClick) {
          btnElement.addEventListener('click', (e) => button.onClick(e, this.modal));
        }
        
        this.modalFooter.appendChild(btnElement);
      });
    } else if (settings.showCloseButton) {
      // 添加默认关闭按钮
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '关闭';
      closeBtn.className = 'glass-button py-2 px-4 rounded-lg text-white hover-scale';
      closeBtn.addEventListener('click', this.close);
      this.modalFooter.appendChild(closeBtn);
    }
    
    // 点击背景是否关闭
    if (settings.closeOnBackdrop) {
      this.modalBackdrop.onclick = this.close;
    } else {
      this.modalBackdrop.onclick = null;
    }
    
    // 显示模态框
    this.modal.classList.add('active');
    this.modalContent.classList.add('modal-animate-in');
    
    // 调用打开回调
    if (typeof settings.onOpen === 'function') {
      settings.onOpen(this.modal);
    }
    
    // 存储关闭回调
    this.modal._onClose = settings.onClose;
    
    // 阻止页面滚动
    document.body.style.overflow = 'hidden';
    
    // 返回模态框对象以允许链式调用
    return this.modal;
  }
  
  /**
   * 关闭模态框
   */
  close() {
    // 隐藏模态框
    this.modal.classList.remove('active');
    
    // 移除动画类
    this.modalContent.classList.remove('modal-animate-in');
    
    // 调用关闭回调
    if (typeof this.modal._onClose === 'function') {
      this.modal._onClose(this.modal);
    }
    
    // 恢复页面滚动
    document.body.style.overflow = '';
  }
  
  /**
   * 创建一个示例模态框
   */
  showExample() {
    this.show({
      title: '欢迎',
      content: '<p class="text-white mb-4">欢迎来到不为人知的小世界！</p><p class="text-gray-300">点击下方按钮继续</p>',
      buttons: [
        {
          text: '取消',
          className: 'py-2 px-4 rounded-lg text-gray-300 hover:text-white transition-colors',
          onClick: () => this.close()
        },
        {
          text: '确定',
          className: 'glass-button py-2 px-6 rounded-lg text-white hover-glow hover-scale',
          onClick: () => this.close()
        }
      ],
      width: '400px'
    });
  }
}

// 将Modal类暴露为默认导出
export default Modal; 