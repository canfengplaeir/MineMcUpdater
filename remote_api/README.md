# 不为人知的小世界 远程API

这个项目提供了不为人知的小世界启动器所需的远程API，用于获取公告、轮播图和背景图。

## API端点

### 公告API

```
GET /api/announcement
```

返回最新的系统公告。

### 轮播图API

```
GET /api/carousel
```

返回所有轮播图数据。

### 背景图API

```
GET /api/backgrounds
```

返回所有可用的背景图。

```
GET /api/backgrounds?default=true
```

返回默认背景图。

## 本地开发

1. 安装依赖：

```
npm install
```

2. 启动本地开发服务器：

```
npm run dev
```

## 部署

项目可以通过Netlify进行部署，配置已经在`netlify.toml`文件中定义。

## 数据更新

所有数据文件都位于`data`目录中：

- `announcements.json` - 公告数据
- `carousel.json` - 轮播图数据
- `backgrounds.json` - 背景图数据 