/**
 * 主应用入口点
 */
import Carousel from './components/carousel.js';
import Modal from './components/modal.js';
import Navigation from './components/navigation.js';
import { openLink, reapplyAnimations } from './utils.js';
import { getCarouselData, getBackgroundData } from './remote-api.js';

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
    this.isCarouselLoading = false;
    this.isBackgroundLoading = false;
    
    this.init();
  }
  
  /**
   * 初始化应用功能
   */
  init() {
    // DOM加载完成后执行
    document.addEventListener('DOMContentLoaded', () => {
      try {
        // 初始化组件
        this.initComponents();
        
        // 初始化动画
        this.initAnimations();
        
        // 初始化事件监听
        this.initEventListeners();
        
        // 暴露API到全局
        this.exposeGlobalAPI();
        
        // 初始化页面切换
        this.initPageSwitcher();
        
        // 初始化轮播图
        this.initCarousel();
        
        // 初始化背景图
        this.initBackground();
        
        // 初始化公告管理器
        if (typeof window.announcementManager !== 'undefined') {
          window.announcementManager.init();
        }
      } catch (error) {
        console.error('应用初始化错误:', error);
      }
    });
  }
  
  /**
   * 初始化所有组件
   */
  initComponents() {
    try {
      // 初始化轮播图
      if (typeof Carousel === 'function') {
        this.carousel = new Carousel('carousel');
      } else {
        console.warn('Carousel 组件未找到');
      }
      
      // 初始化模态框
      if (typeof Modal === 'function') {
        this.modal = new Modal('modal');
      } else {
        console.warn('Modal 组件未找到');
      }
      
      // 初始化导航
      if (typeof Navigation === 'function') {
        this.navigation = new Navigation();
      } else {
        console.warn('Navigation 组件未找到');
      }
    } catch (error) {
      console.error('组件初始化错误:', error);
    }
  }
  
  /**
   * 初始化动画
   */
  initAnimations() {
    try {
      // 获取所有带有动画类的元素
      const animatedElements = document.querySelectorAll('.animate-fade-in, .animate-fade-in-up, .animate-fade-in-left, .animate-fade-in-right');
      
      // 强制重新应用动画
      if (typeof reapplyAnimations === 'function') {
        reapplyAnimations(animatedElements);
      } else {
        // 备用方法
        animatedElements.forEach(el => {
          el.style.animation = 'none';
          void el.offsetWidth; // 触发重排
          el.style.animation = '';
        });
      }
    } catch (error) {
      console.error('动画初始化错误:', error);
    }
  }
  
  /**
   * 初始化事件监听
   */
  initEventListeners() {
    try {
      // 窗口控制按钮
      const minimizeBtn = document.getElementById('minimize-btn');
      const closeBtn = document.getElementById('close-btn');
      
      if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => {
          // 使用API最小化窗口
          doAjax("/api/window/minimize", "POST", function() {
            if (this.readyState == 4) {
              if (this.status != 200) {
                console.error('最小化窗口失败:', this.status);
              }
            }
          });
        });
      }
      
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          // 使用API关闭窗口
          doAjax("/api/window/close", "POST", function() {
            if (this.readyState == 4) {
              if (this.status != 200) {
                console.error('关闭窗口失败:', this.status);
              }
            }
          });
        });
      }
      
      // 社交媒体按钮点击事件
      const socialButtons = document.querySelectorAll('[onclick^="openLink"]');
      socialButtons.forEach(button => {
        const urlMatch = button.getAttribute('onclick') ? button.getAttribute('onclick').match(/openLink\(['"](.+)['"]\)/) : null;
        if (urlMatch && urlMatch[1]) {
          const url = urlMatch[1];
          button.removeAttribute('onclick');
          button.addEventListener('click', () => {
            if (typeof openLink === 'function') {
              openLink(url);
            } else {
              window.open(url, '_blank');
            }
          });
        }
      });
      
      // Logo点击事件
      const logo = document.querySelector('.sidebar-header img');
      if (logo && this.modal) {
        logo.removeAttribute('onclick');
        logo.addEventListener('click', () => this.modal.showExample());
      }
    } catch (error) {
      console.error('事件监听初始化错误:', error);
    }
  }
  
  /**
   * 初始化页面切换功能
   */
  initPageSwitcher() {
    try {
      // 获取所有页面元素
      const pages = document.querySelectorAll('.page-content');
      // 获取所有侧边栏项目
      const menuItems = document.querySelectorAll('.sidebar-item');
      
      // 如果存在Navigation实例，使用它
      if (this.navigation) {
        // 页面切换逻辑委托给Navigation实例，不需要做额外工作
        return;
      }
      
      // 否则使用基本的页面切换逻辑
      if (menuItems.length > 0 && pages.length > 0) {
        menuItems.forEach(item => {
          item.addEventListener('click', () => {
            // 获取目标页面ID
            const targetPage = item.getAttribute('data-page');
            if (!targetPage) return;
            
            // 更新活动状态
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');
            
            // 隐藏所有页面，显示目标页面
            pages.forEach(page => {
              if (page.id === `${targetPage}-page`) {
                page.classList.remove('hidden');
              } else {
                page.classList.add('hidden');
              }
            });
          });
        });
      }
    } catch (error) {
      console.error('页面切换初始化错误:', error);
    }
  }
  
  /**
   * 初始化轮播图功能
   */
  initCarousel() {
    try {
      if (this.isCarouselLoading) return;
      this.isCarouselLoading = true;
      
      // 使用远程API获取轮播图数据
      getCarouselData((response) => {
        this.isCarouselLoading = false;
        
        if (response.status !== 'ok' || !response.slides || response.slides.length === 0) {
          // 如果获取远程轮播图失败，使用默认轮播图逻辑
          this.initDefaultCarousel();
          return;
        }
        
        // 更新轮播图DOM
        this.updateCarouselWithRemoteData(response.slides);
        
        // 初始化轮播图控件
        if (typeof Carousel === 'function') {
          this.carousel = new Carousel('carousel');
        } else {
          console.warn('Carousel 组件未找到');
          this.initDefaultCarousel();
        }
      });
    } catch (error) {
      console.error('初始化轮播图错误:', error);
      this.isCarouselLoading = false;
      this.initDefaultCarousel();
    }
  }
  
  /**
   * 使用远程数据更新轮播图DOM
   * @param {Array} slides - 轮播图数据数组
   */
  updateCarouselWithRemoteData(slides) {
    const carouselElement = document.getElementById('carousel');
    if (!carouselElement) return;
    
    // 清空现有轮播图
    carouselElement.innerHTML = '';
    
    // 添加新的轮播图元素
    slides.forEach((slide, index) => {
      const slideElement = document.createElement('div');
      slideElement.className = `carousel-slide ${index === 0 ? 'active' : ''}`;
      slideElement.classList.add('p-2');
      
      slideElement.innerHTML = `
        <div class="slide-image">
          <img src="${slide.image_url}" class="rounded-lg h-40 w-full object-cover shadow-lg" />
        </div>
        <h3 class="text-white font-medium mt-3">${slide.title}</h3>
        <p class="text-gray-300 text-sm mt-1">${slide.description}</p>
      `;
      
      carouselElement.appendChild(slideElement);
    });
    
    // 更新指示器
    const indicatorsContainer = document.querySelector('.carousel-indicators');
    if (indicatorsContainer) {
      indicatorsContainer.innerHTML = '';
      
      slides.forEach((_, index) => {
        const indicator = document.createElement('div');
        indicator.className = `carousel-indicator ${index === 0 ? 'active' : ''}`;
        indicator.dataset.index = index;
        indicatorsContainer.appendChild(indicator);
      });
    }
  }
  
  /**
   * 初始化默认轮播图逻辑（当远程API获取失败时）
   */
  initDefaultCarousel() {
    if (this.carousel) {
      return;
    }
      
    // 基本轮播图实现（如果没有加载轮播图组件）
    const carousel = document.getElementById('carousel');
    if (!carousel) return;
    
    const slides = carousel.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.carousel-indicator');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    let currentIndex = 0;
    
    // 切换到指定幻灯片
    const goToSlide = (index) => {
      if (index < 0) {
        index = slides.length - 1;
      } else if (index >= slides.length) {
        index = 0;
      }
      
      carousel.style.transform = `translateX(-${index * 100}%)`;
      
      // 更新活动状态
      slides.forEach((slide, i) => {
        if (i === index) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });
      
      indicators.forEach((indicator, i) => {
        if (i === index) {
          indicator.classList.add('active');
        } else {
          indicator.classList.remove('active');
        }
      });
      
      currentIndex = index;
    };
    
    // 绑定按钮事件
    if (prevBtn) {
      prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
    }
    
    // 绑定指示器事件
    indicators.forEach((indicator, i) => {
      indicator.addEventListener('click', () => goToSlide(i));
    });
    
    // 自动轮播
    setInterval(() => {
      goToSlide(currentIndex + 1);
    }, 5000);
  }
  
  /**
   * 初始化背景图
   */
  initBackground() {
    try {
      if (this.isBackgroundLoading) return;
      this.isBackgroundLoading = true;
      
      // 获取背景元素
      const backgroundElement = document.querySelector('.bg-cover');
      if (!backgroundElement) {
        this.isBackgroundLoading = false;
        return;
      }
      
      // 使用远程API获取背景图数据
      getBackgroundData((response) => {
        this.isBackgroundLoading = false;
        
        if (response.status !== 'ok' || (!response.background && !response.backgrounds)) {
          // 远程API获取失败，不做任何操作，使用默认背景
          return;
        }
        
        // 获取背景图URL
        let backgroundUrl = '';
        if (response.background) {
          // 获取单个默认背景图
          backgroundUrl = response.background.image_url;
        } else if (response.backgrounds && response.backgrounds.length > 0) {
          // 获取所有背景图，使用默认或第一个
          const defaultBg = response.backgrounds.find(bg => bg.is_default) || response.backgrounds[0];
          backgroundUrl = defaultBg.image_url;
        }
        
        // 更新背景图
        if (backgroundUrl) {
          backgroundElement.style.backgroundImage = `url('${backgroundUrl}')`;
        }
      });
    } catch (error) {
      console.error('初始化背景图错误:', error);
      this.isBackgroundLoading = false;
    }
  }
  
  /**
   * 暴露API到全局
   */
  exposeGlobalAPI() {
    try {
      // 暴露公共方法到window
      if (this.modal) {
        window.showModal = (options) => this.modal.show(options);
        window.closeModal = () => this.modal.close();
        window.showExampleModal = () => this.modal.showExample();
      } else {
        // 备用实现
        window.showModal = (options) => console.warn('模态框组件未初始化');
        window.closeModal = () => console.warn('模态框组件未初始化');
      }
      
      if (typeof openLink === 'function') {
        window.openLink = openLink;
      } else {
        window.openLink = (url) => window.open(url, '_blank');
      }
      
      if (this.navigation) {
        window.navigateTo = (pageId) => this.navigation.navigateTo(pageId);
      } else {
        // 基本实现
        window.navigateTo = (pageId) => {
          const item = document.querySelector(`.sidebar-item[data-page="${pageId}"]`);
          if (item) item.click();
        };
      }
    } catch (error) {
      console.error('全局API暴露错误:', error);
    }
  }
}

// 初始化应用
try {
  const app = new App();
  window.app = app; // 暴露应用实例到全局，方便调试
} catch (error) {
  console.error('应用创建错误:', error);
} 