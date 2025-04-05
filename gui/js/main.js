/**
 * 主应用入口点
 */
import Carousel from './components/carousel.js';
import Modal from './components/modal.js';
import Navigation from './components/navigation.js';
import { openLink, reapplyAnimations } from './utils.js';

/**
 * 应用程序类
 */
class App {
  /**
   * 初始化应用
   */
  constructor() {
    this.modal = null;
    this.carousel = null;
    this.navigation = null;
    
    this.init();
  }
  
  /**
   * 初始化应用功能
   */
  init() {
    // DOM加载完成后执行
    document.addEventListener('DOMContentLoaded', () => {
      // 初始化组件
      this.initComponents();
      
      // 初始化动画
      this.initAnimations();
      
      // 初始化事件监听
      this.initEventListeners();
      
      // 暴露API到全局
      this.exposeGlobalAPI();
    });
  }
  
  /**
   * 初始化所有组件
   */
  initComponents() {
    // 初始化轮播图
    this.carousel = new Carousel('carousel');
    
    // 初始化模态框
    this.modal = new Modal('modal');
    
    // 初始化导航
    this.navigation = new Navigation();
  }
  
  /**
   * 初始化动画
   */
  initAnimations() {
    // 获取所有带有动画类的元素
    const animatedElements = document.querySelectorAll('.animate-fade-in, .animate-fade-in-up, .animate-fade-in-left, .animate-fade-in-right');
    
    // 强制重新应用动画
    reapplyAnimations(animatedElements);
  }
  
  /**
   * 初始化事件监听
   */
  initEventListeners() {
    // 社交媒体按钮点击事件
    const socialButtons = document.querySelectorAll('[onclick^="openLink"]');
    socialButtons.forEach(button => {
      const urlMatch = button.getAttribute('onclick').match(/openLink\(['"](.+)['"]\)/);
      if (urlMatch && urlMatch[1]) {
        const url = urlMatch[1];
        button.removeAttribute('onclick');
        button.addEventListener('click', () => openLink(url));
      }
    });
    
    // Logo点击事件
    const logo = document.querySelector('.sidebar-header img');
    if (logo) {
      logo.removeAttribute('onclick');
      logo.addEventListener('click', () => this.modal.showExample());
    }
  }
  
  /**
   * 暴露API到全局
   */
  exposeGlobalAPI() {
    // 暴露公共方法到window
    window.showModal = (options) => this.modal.show(options);
    window.closeModal = () => this.modal.close();
    window.showExampleModal = () => this.modal.showExample();
    window.openLink = openLink;
    window.navigateTo = (pageId) => this.navigation.navigateTo(pageId);
  }
}

// 初始化应用
const app = new App(); 