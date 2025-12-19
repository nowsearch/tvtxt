# 使用Node.js官方镜像作为基础镜像
FROM node:16-alpine

# 安装git
# RUN apk add --no-cache git

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json（如果存在）
COPY package*.json ./

# 安装依赖（包含开发依赖，因为需要执行build命令）
# RUN npm install

# 复制项目文件（除了public目录，因为public目录内容会在prebuild阶段从git仓库拉取）
COPY server.js ./
COPY prebuild.js ./
COPY build.js ./
COPY public/index.html ./public/

# 在host网络模式下不需要暴露端口
EXPOSE 8000

# 可以通过以下方式传递代理环境变量并使用host网络模式（示例）：
# docker run --network host -e http_proxy=http://your-proxy-url:port tvtxt-app

# 设置启动命令：先执行build（会自动触发prebuild拉取文件），然后启动服务
CMD ["sh", "-c", "node server.js"]