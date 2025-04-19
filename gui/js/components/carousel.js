/**
 * 轮播图组件
 */
class Carousel {
  /**
   * 初始化轮播图
   * @param {string} carouselId - 轮播图容器的ID
   */
  constructor(carouselId) {
    this.carousel = document.getElementById(carouselId);
    this.slides = this.carousel.querySelectorAll('.carousel-slide');
    this.indicators = document.querySelectorAll('.carousel-indicator');
    this.prevBtn = document.getElementById('prev-btn');
    this.nextBtn = document.getElementById('next-btn');
    this.currentIndex = 0;
    this.slideCount = this.slides.length;
    this.autoSlideInterval = null;
    this.slidesData = [];
    
    this.init();
  }
  
  /**
   * 初始化轮播图功能
   */
  init() {
    // 加载轮播图数据
    this.loadCarouselData();
    
    // 设置自动轮播
    this.startAutoSlide();
    
    // 设置事件监听器
    this.nextBtn.addEventListener('click', () => this.nextSlide());
    this.prevBtn.addEventListener('click', () => this.prevSlide());
    
    // 设置指示器点击事件
    this.indicators.forEach((indicator, i) => {
      indicator.addEventListener('click', () => this.goToSlide(i));
    });
    
    // 初始化显示第一个幻灯片
    this.goToSlide(0);
  }
  
  /**
   * 加载轮播图数据
   */
  loadCarouselData() {
    console.log('开始加载轮播图数据');
    // 从remote-api.js导入的getCarouselData函数
    if (typeof window.getCarouselData === 'function') {
      console.log('使用window.getCarouselData获取数据');
      window.getCarouselData(data => {
        console.log('获取到轮播图数据:', data);
        if (data && (data.carousel_slides || data.slides)) {
          this.slidesData = data.carousel_slides || data.slides;
          console.log('设置轮播图数据:', this.slidesData);
          this.setupSlideClickEvents();
        } else {
          console.error('轮播图数据格式错误或为空:', data);
        }
      });
    } else if (typeof getCarouselData === 'function') {
      console.log('使用getCarouselData获取数据');
      getCarouselData(data => {
        console.log('获取到轮播图数据:', data);
        if (data && (data.carousel_slides || data.slides)) {
          this.slidesData = data.carousel_slides || data.slides;
          console.log('设置轮播图数据:', this.slidesData);
          this.setupSlideClickEvents();
        } else {
          console.error('轮播图数据格式错误或为空:', data);
        }
      });
    } else {
      console.error('找不到getCarouselData函数，无法加载轮播图数据');
    }
  }
  
  /**
   * 设置幻灯片点击事件
   */
  setupSlideClickEvents() {
    console.log('设置幻灯片点击事件，幻灯片数量:', this.slides.length);
    console.log('当前轮播图数据:', this.slidesData);
    
    // 移除可能存在的旧事件监听器
    this.slides.forEach(slide => {
      const newSlide = slide.cloneNode(true);
      slide.parentNode.replaceChild(newSlide, slide);
    });
    
    // 重新获取幻灯片元素
    this.slides = this.carousel.querySelectorAll('.carousel-slide');
    
    // 添加新的事件监听器
    this.slides.forEach((slide, index) => {
      slide.style.cursor = 'pointer';
      slide.addEventListener('click', (event) => {
        console.log(`点击了第${index+1}个幻灯片`);
        event.preventDefault();
        event.stopPropagation();
        
        const slideData = this.slidesData[index];
        console.log('幻灯片数据索引:', index, '数据:', slideData);
        if (slideData) {
          this.handleSlideClick(slideData);
        } else {
          console.error(`第${index+1}个幻灯片没有对应的数据`);
        }
      });
    });
  }
  
  /**
   * 处理幻灯片点击事件
   * @param {Object} slideData - 幻灯片数据
   */
  handleSlideClick(slideData) {
    console.log('点击幻灯片，数据:', slideData);
    
    if (!slideData) {
      console.error('幻灯片数据为空');
      return;
    }
    
    if (!slideData.type) {
      console.error('幻灯片数据缺少type字段:', slideData);
      return;
    }
    
    switch (slideData.type) {
      case 'dialog':
        console.log('打开对话框:', slideData.title);
        this.openDialog(slideData);
        break;
      case 'link':
        console.log('打开链接:', slideData.content);
        this.openLink(slideData.content);
        break;
      default:
        console.warn('未知的幻灯片点击类型:', slideData.type);
    }
  }
  
  /**
   * 打开对话框
   * @param {Object} slideData - 幻灯片数据
   */
  openDialog(slideData) {
    if (window.app && window.app.modal) {
      window.app.modal.show({
        title: slideData.title || '详情',
        content: slideData.content || '',
        width: '500px'
      });
    } else if (typeof Modal === 'function') {
      const modal = new Modal('modal');
      modal.show({
        title: slideData.title || '详情',
        content: slideData.content || '',
        width: '500px'
      });
    }
  }
  
  /**
   * 打开链接
   * @param {string} url - 链接地址
   */
  openLink(url) {
    if (typeof window.openLink === 'function') {
      window.openLink(url);
    } else if (typeof openLink === 'function') {
      openLink(url);
    } else {
      window.open(url, '_blank');
    }
  }
  
  /**
   * 跳转到指定幻灯片
   * @param {number} index - 目标幻灯片索引
   */
  goToSlide(index) {
    // 重置自动轮播
    this.restartAutoSlide();
    
    // 更新当前索引
    this.currentIndex = index;
    
    // 更新轮播图位置
    this.carousel.style.transform = `translateX(-${this.currentIndex * 100}%)`;
    
    // 更新活动状态
    this.slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === this.currentIndex);
    });
    
    // 更新指示器状态
    this.indicators.forEach((indicator, i) => {
      indicator.classList.toggle('active', i === this.currentIndex);
    });
  }
  
  /**
   * 下一张幻灯片
   */
  nextSlide() {
    this.goToSlide((this.currentIndex + 1) % this.slideCount);
  }
  
  /**
   * 上一张幻灯片
   */
  prevSlide() {
    this.goToSlide((this.currentIndex - 1 + this.slideCount) % this.slideCount);
  }
  
  /**
   * 开始自动轮播
   */
  startAutoSlide() {
    this.autoSlideInterval = setInterval(() => this.nextSlide(), 5000);
  }
  
  /**
   * 重新开始自动轮播
   */
  restartAutoSlide() {
    clearInterval(this.autoSlideInterval);
    this.startAutoSlide();
  }
}

// 导出模块
export default Carousel;