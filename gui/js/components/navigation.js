/**
 * 页面导航组件
 */
class Navigation {
  /**
   * 初始化导航
   */
  constructor() {
    this.sidebarItems = document.querySelectorAll('.sidebar-item');
    this.pages = document.querySelectorAll('.page-content');
    
    this.init();
  }
  
  /**
   * 初始化导航功能
   */
  init() {
    this.sidebarItems.forEach(item => {
      item.addEventListener('click', () => {
        // 获取目标页面
        const targetPage = item.getAttribute('data-page');
        this.navigateTo(targetPage);
      });
    });
  }
  
  /**
   * 导航到指定页面
   * @param {string} targetPageId - 目标页面ID前缀
   */
  navigateTo(targetPageId) {
    // 移除所有活动状态
    this.sidebarItems.forEach(el => el.classList.remove('active'));
    
    // 添加当前项的活动状态
    const activeItem = document.querySelector(`.sidebar-item[data-page="${targetPageId}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }
    
    // 对当前可见页面应用退出动画
    this.pages.forEach(page => {
      if (!page.classList.contains('hidden')) {
        // 添加退出动画类
        page.classList.add('page-exit');
        
        // 动画结束后隐藏页面并移除动画类
        setTimeout(() => {
          page.classList.add('hidden');
          page.classList.remove('page-exit');
          
          // 显示目标页面并应用进入动画
          const newPage = document.getElementById(`${targetPageId}-page`);
          if (newPage) {
            newPage.classList.remove('hidden');
            newPage.classList.add('page-enter');
            
            // 重新触发内部元素的动画
            const animatedElements = newPage.querySelectorAll('[class*="animate-"]');
            animatedElements.forEach(el => {
              el.style.animation = 'none';
              void el.offsetWidth; // 触发重排
              el.style.animation = '';
            });
            
            // 移除进入动画类
            setTimeout(() => {
              newPage.classList.remove('page-enter');
            }, 500);
          }
        }, 300);
      }
    });
  }
}

// 将Navigation类暴露为默认导出
export default Navigation;