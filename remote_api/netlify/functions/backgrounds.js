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

    // 直接嵌入背景图数据，避免文件系统访问
    const data = {
      "backgrounds": [
        {
          "id": "bg-001",
          "name": "经典背景",
          "image_url": "https://objectstorageapi.bja.sealos.run/g6rnmc1y-mymy/hero-bg.jpg",
          "is_default": true
        },
        {
          "id": "bg-002",
          "name": "冬季主题",
          "image_url": "https://objectstorageapi.bja.sealos.run/g6rnmc1y-mymy/winter-bg.jpg",
          "is_default": false
        },
        {
          "id": "bg-003",
          "name": "春季主题",
          "image_url": "https://objectstorageapi.bja.sealos.run/g6rnmc1y-mymy/spring-bg.jpg",
          "is_default": false
        },
        {
          "id": "bg-004",
          "name": "夏季主题",
          "image_url": "https://objectstorageapi.bja.sealos.run/g6rnmc1y-mymy/summer-bg.jpg",
          "is_default": false
        }
      ]
    };

    // 获取默认背景图或返回整个列表
    const defaultOnly = event.queryStringParameters && event.queryStringParameters.default === 'true';
    
    if (defaultOnly) {
      const defaultBackground = data.backgrounds.find(bg => bg.is_default) || data.backgrounds[0];
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'ok',
          background: defaultBackground
        })
      };
    }

    // 返回所有背景图数据
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'ok',
        backgrounds: data.backgrounds
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