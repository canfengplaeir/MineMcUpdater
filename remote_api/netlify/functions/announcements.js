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

    // 读取公告数据文件
    const dataPath = path.join(__dirname, '../../data/announcements.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // 获取最新的公告
    const latestAnnouncement = data.announcements[0] || null;
    
    if (!latestAnnouncement) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          status: 'error',
          message: '没有可用的公告'
        })
      };
    }

    // 返回最新的公告，格式与原有API兼容
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'ok',
        id: latestAnnouncement.id,
        title: latestAnnouncement.title,
        content: latestAnnouncement.content,
        show_on_startup: latestAnnouncement.show_on_startup,
        created_at: latestAnnouncement.created_at
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