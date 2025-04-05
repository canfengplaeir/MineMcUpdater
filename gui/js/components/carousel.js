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
    
    this.init();
  }
  
  /**
   * 初始化轮播图功能
   */
  init() {
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