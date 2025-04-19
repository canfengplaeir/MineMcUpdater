/**
 * 远程API模块 - 处理公告、轮播图和背景图的远程数据获取
 */

// API基础URL，可以根据环境进行调整
const API_BASE_URL = 'http://localhost:8888';

/**
 * 获取远程公告
 * @param {Function} callback - 处理响应的回调函数
 * @param {boolean} fallbackToLocal - 若远程API失败是否回退到本地API
 */
function getRemoteAnnouncement(callback, fallbackToLocal = true) {
  fetch(`${API_BASE_URL}/api/announcement`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`API响应错误: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (typeof callback === 'function') {
        callback(data);
      }
    })
    .catch(error => {
      console.error('获取远程公告失败:', error);
      
      // 如果远程API失败，回退到本地API
      if (fallbackToLocal) {
        console.log('回退到本地公告API');
        getAnnouncement(callback);
      } else if (typeof callback === 'function') {
        callback({ 
          status: 'error', 
          message: `获取远程公告失败: ${error.message}` 
        });
      }
    });
}

/**
 * 获取轮播图数据
 * @param {Function} callback - 处理响应的回调函数
 */
function getCarouselData(callback) {
  fetch(`${API_BASE_URL}/api/carousel`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`API响应错误: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (typeof callback === 'function') {
        callback(data);
      }
    })
    .catch(error => {
      console.error('获取轮播图数据失败:', error);
      
      // 如果远程API失败，使用本地测试数据
      console.log('使用本地轮播图测试数据');
      const localCarouselData = {
        "carousel_slides": [
          {
            "id": "slide-001",
            "title": "探索无限世界",
            "description": "体验全新地形生成和探险玩法",
            "image_url": "https://objectstorageapi.bja.sealos.run/g6rnmc1y-mymy/hero-bg.jpg",
            "type": "dialog",
            "content": "<h3>探索无限世界</h3><p>我们的最新版本引入了全新的地形生成算法，创造出更加壮观和多样化的世界。</p>"
          },
          {
            "id": "slide-002",
            "title": "全新生物群系",
            "description": "发现神秘生物和隐藏宝藏",
            "image_url": "https://objectstorageapi.bja.sealos.run/g6rnmc1y-mymy/hero-bg.jpg",
            "type": "dialog",
            "content": "<h3>全新生物群系</h3><p>探索全新的生物群系，遇见从未见过的生物。</p>"
          },
          {
            "id": "slide-003",
            "title": "多人联机体验",
            "description": "与好友共建理想王国",
            "image_url": "https://objectstorageapi.bja.sealos.run/g6rnmc1y-mymy/hero-bg.jpg",
            "type": "link",
            "content": "https://minecraft.net/realms"
          }
        ]
      };
      
      if (typeof callback === 'function') {
        callback(localCarouselData);
      }
    });}


/**
 * 获取背景图数据
 * @param {Function} callback - 处理响应的回调函数
 * @param {boolean} defaultOnly - 是否只获取默认背景图
 */
function getBackgroundData(callback, defaultOnly = true) {
  const url = defaultOnly 
    ? `${API_BASE_URL}/api/backgrounds?default=true`
    : `${API_BASE_URL}/api/backgrounds`;
    
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`API响应错误: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (typeof callback === 'function') {
        callback(data);
      }
    })
    .catch(error => {
      console.error('获取背景图数据失败:', error);
      if (typeof callback === 'function') {
        callback({ 
          status: 'error', 
          message: `获取背景图数据失败: ${error.message}` 
        });
      }
    });
}

// 导出模块
export {
  getRemoteAnnouncement,
  getCarouselData,
  getBackgroundData
};