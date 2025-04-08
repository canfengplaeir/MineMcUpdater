const fs = require('fs');
const path = require('path');

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

    // 读取背景图数据文件
    const dataPath = path.join(__dirname, '../../data/backgrounds.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

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