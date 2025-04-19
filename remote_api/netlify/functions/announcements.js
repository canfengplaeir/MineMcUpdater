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

    // 直接嵌入公告数据，避免文件系统访问
    const data = {
      "announcements": [
        {
          "id": "announcement-005",
          "title": "公告刷新测试",
          "content": "<p class='mb-3'>测试</p>",
          "show_on_startup": false,
          "created_at": "2025-04-12T08:00:00Z"
        },
        {
          "id": "announcement-003",
          "title": "服务器更新公告",
          "content": "<p class='mb-3'>尊敬的玩家，我们的服务器已经更新到最新版本！</p><p class='mb-3'>本次更新内容包括：</p><ul class='list-disc pl-5 mb-3'><li>优化了游戏性能</li><li>新增了5种生物</li><li>修复了已知的漏洞</li><li>新增了冬季主题地图</li></ul><p>更新时间：2025年4月10日</p>",
          "show_on_startup": false,
          "created_at": "2025-04-10T08:00:00Z"
        },
        {
          "id": "announcement-002",
          "title": "欢迎使用不为人知的小世界启动器",
          "content": "<p class='mb-3'>欢迎使用不为人知的小世界启动器！</p><p class='mb-3'>这是一个全新的启动器，为您提供更好的游戏体验。主要功能包括：</p><ul class='list-disc pl-5 mb-3'><li>自动检查游戏更新</li><li>一键启动游戏</li><li>简洁美观的界面</li></ul><p>如有任何问题，请加入我们的QQ群获取帮助。</p>",
          "show_on_startup": false,
          "created_at": "2025-04-05T12:00:00Z"
        }
      ]
    };

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