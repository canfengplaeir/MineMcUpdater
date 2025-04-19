// 不需要fs和path模块，因为数据直接嵌入到代码中

exports.handler = async (event, context) => {
  try {
    // 设置CORS头
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    // 处理OPTIONS请求（预检请求）
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'CORS preflight request successful' })
      };
    }

    // 直接嵌入轮播图数据，避免文件系统访问
    const data = {
      "carousel_slides": [
        {
          "id": "slide-001",
          "title": "探索无限世界",
          "description": "体验全新地形生成和探险玩法",
          "image_url": "https://objectstorageapi.bja.sealos.run/g6rnmc1y-mymy/hero-bg.jpg",
          "type": "dialog",
          "content": "<h3>探索无限世界</h3><p>我们的最新版本引入了全新的地形生成算法，创造出更加壮观和多样化的世界。从茂密的森林到广阔的平原，从陡峭的山脉到神秘的洞穴，每一次探险都将带给你全新的体验。</p><p>新的探险系统让你可以标记重要地点，记录发现的宝藏，并与好友分享你的冒险故事。</p>"
        },
        {
          "id": "slide-002",
          "title": "全新生物群系",
          "description": "发现神秘生物和隐藏宝藏",
          "image_url": "https://objectstorageapi.bja.sealos.run/g6rnmc1y-mymy/hero-bg.jpg",
          "type": "dialog",
          "content": "<h3>全新生物群系</h3><p>探索全新的生物群系，遇见从未见过的生物。每个生物群系都有其独特的植被、地形和天气系统，为你的冒险增添无限可能。</p><p>寻找隐藏在各个角落的宝藏和稀有资源，解锁强大的装备和能力。</p>"
        },
        {
          "id": "slide-003",
          "title": "多人联机体验",
          "description": "与好友共建理想王国",
          "image_url": "https://objectstorageapi.bja.sealos.run/g6rnmc1y-mymy/hero-bg.jpg",
          "type": "link",
          "content": "https://minecraft.net/realms"
        },
        {
          "id": "slide-004",
          "title": "特别活动",
          "description": "全新春季主题建筑大赛等你来参与",
          "image_url": "https://objectstorageapi.bja.sealos.run/g6rnmc1y-mymy/hero-bg.jpg",
          "type": "dialog",
          "content": "<h3>春季建筑大赛</h3><p>参与我们的春季主题建筑大赛，展示你的创意和建筑技巧！本次比赛的主题是自然与科技的融合，</p><p>提交作品截止日期：2023年5月15日</p><p>丰厚奖品等你来赢取！</p>"
        },
        {
          "id": "slide-005",
          "title": "特别活动",
          "description": "全新春季主题建筑大赛等你来参与",
          "image_url": "https://objectstorageapi.bja.sealos.run/g6rnmc1y-mymy/hero-bg.jpg",
          "type": "link",
          "content": "https://minecraft.net/community"
        }
      ]
    };

    // 返回所有轮播图数据
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'ok',
        slides: data.carousel_slides
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'error',
        message: `服务器错误: ${error.message}`
      })
    };
  }
};