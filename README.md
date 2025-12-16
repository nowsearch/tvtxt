# Cloudflare Pages 静态文件服务

这是一个使用 Cloudflare Pages 构建的静态文件服务项目，支持 UTF-8 编码，可以完美显示中文等非英文内容，支持中文路径访问，并提供多种文件类型的正确 MIME 类型识别。

## 项目结构

```
├── public/                 # 静态文件根目录
│   ├── index.html          # 网站首页
│   ├── about.html          # 关于页面
│   ├── tvbox.txt           # TVBox 相关文本文件
│   ├── example.txt         # 中文示例文本文件
│   ├── _headers            # Cloudflare Pages 头信息配置
│   ├── assets/             # 静态资源目录
│   │   ├── styles.css      # 样式文件
│   │   └── data.json       # JSON 数据文件
│   ├── OK/                 # OK 频道目录
│   ├── PG/                 # PG 频道目录
│   ├── iptv365/            # IPTV365 频道目录
│   ├── 动漫频道/           # 动漫频道目录（中文路径示例）
│   ├── 南风/               # 南风频道目录（中文路径示例）
│   └── ... 其他频道目录 ...
├── server.js               # 本地测试 Node.js 服务器
├── package.json            # 项目配置文件
└── README.md               # 项目说明文档
```

## 功能特点

- ✅ 支持 UTF-8 编码，完美显示中文等非英文内容
- ✅ 支持中文路径访问（如 /动漫频道/api.json）
- ✅ 提供静态 HTML、CSS、JavaScript、JSON、TXT 等文件的访问
- ✅ 支持 JAR 文件和 MD5 校验文件的正确 MIME 类型
- ✅ 使用 Cloudflare Pages 全球 CDN 加速
- ✅ 简单配置，易于维护
- ✅ 支持自定义 HTTP 头信息
- ✅ 本地测试服务器支持完整功能模拟

## 本地测试

本项目使用自定义的 Node.js 服务器进行本地测试，确保与 Cloudflare Pages 部署环境的行为一致，特别是中文路径处理和 MIME 类型支持。

### 启动本地服务器

```bash
npm run dev
```

然后在浏览器中访问：`http://localhost:8000`

### 服务器特性

- 支持中文路径访问
- 自动识别并设置正确的 MIME 类型
- 支持目录自动索引（查找 index.html）
- 高效的文件流传输
- 完整的错误处理

## 部署到 Cloudflare Pages

### 方法一：使用 Cloudflare Pages CLI

1. 安装 Cloudflare Pages CLI：
   ```bash
   npm install -g @cloudflare/pages-cli
   ```

2. 登录 Cloudflare：
   ```bash
   wrangler login
   ```

3. 部署项目：
   ```bash
   wrangler pages deploy public
   ```

### 方法二：使用 GitHub/GitLab 集成

1. 将项目推送到 GitHub 或 GitLab 仓库
2. 登录 Cloudflare 控制台，进入 Pages 页面
3. 点击 "创建项目"，选择 "连接到 Git"
4. 选择你的仓库，配置构建设置：
   - 构建命令：`npm run build` (或留空)
   - 构建输出目录：`public`
5. 点击 "保存并部署"

## 配置说明

### _headers 文件

在 `public/_headers` 文件中，我们配置了所有文本文件的 Content-Type 和编码：

```
/*
  Content-Type: text/html; charset=UTF-8
  X-Content-Type-Options: nosniff

/*.css
  Content-Type: text/css; charset=UTF-8
  X-Content-Type-Options: nosniff

/*.js
  Content-Type: text/javascript; charset=UTF-8
  X-Content-Type-Options: nosniff

/*.json
  Content-Type: application/json; charset=UTF-8
  X-Content-Type-Options: nosniff

/*.txt
  Content-Type: text/plain; charset=UTF-8
  X-Content-Type-Options: nosniff
```

这确保了所有文本文件都使用 UTF-8 编码返回给客户端。

### 本地服务器配置 (server.js)

本地测试服务器 `server.js` 提供了以下功能：

1. **中文路径支持**：使用 `decodeURIComponent()` 解码 URL，确保中文路径正确识别
2. **MIME 类型支持**：
   - 文本文件 (.html, .css, .js, .json, .txt) 使用 UTF-8 编码
   - JAR 文件 (.jar) 使用正确的 `application/java-archive` MIME 类型
   - MD5 校验文件 (.md5) 使用文本类型
   - 图片文件 (.jpg, .jpeg, .png, .gif, .svg) 使用相应的图片 MIME 类型
3. **目录索引**：自动查找目录下的 `index.html` 文件
4. **高效文件传输**：使用 `createReadStream` 进行文件流传输，提升性能
5. **错误处理**：提供友好的 404 错误页面

### MIME 类型映射

服务器支持以下 MIME 类型：

| 文件扩展名 | MIME 类型 |
|------------|-----------|
| .html | text/html; charset=UTF-8 |
| .css | text/css; charset=UTF-8 |
| .js | text/javascript; charset=UTF-8 |
| .json | application/json; charset=UTF-8 |
| .txt | text/plain; charset=UTF-8 |
| .jar | application/java-archive |
| .md5 | text/plain; charset=UTF-8 |
| .jpg, .jpeg | image/jpeg |
| .png | image/png |
| .gif | image/gif |
| .svg | image/svg+xml |

## 添加更多静态文件

要添加更多静态文件，只需将它们放置在 `public` 目录下即可，支持中文目录和文件名。例如：

- 添加中文目录：`public/我的频道/`
- 添加图片：`public/images/photo.jpg`
- 添加 JavaScript 文件：`public/js/script.js`
- 添加文本文件：`public/docs/使用指南.txt`
- 添加 JAR 文件：`public/tools/app.jar`
- 添加 MD5 校验文件：`public/tools/app.jar.md5`

## 注意事项

1. **编码注意**：确保所有文本文件都使用 UTF-8 编码保存，避免中文乱码
2. **路径格式**：静态资源的路径应该使用相对路径或根路径（以 `/` 开头）
3. **中文路径**：支持中文目录和文件名，但建议使用英文路径以提高兼容性
4. **目录索引**：Cloudflare Pages 会自动处理路由，根路径 `/` 会指向 `public/index.html`，子目录同样会查找 `index.html`
5. **本地测试**：使用 `npm run dev` 启动本地服务器，确保与部署环境行为一致
6. **MIME 类型**：如果需要支持新的文件类型，可以在 `server.js` 中添加对应的 MIME 类型映射

## 许可证

MIT