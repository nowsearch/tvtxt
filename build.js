const fs = require('fs');
const path = require('path');

// 定义常量
const PUBLIC_DIR = path.join(__dirname, 'public');

// 确保public目录存在
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  console.log('已创建public目录');
}

// 执行构建
function build() {
  try {
    console.log('构建完成');
  } catch (error) {
    console.error('构建失败:', error.message);
    process.exit(1);
  }
}

// 执行构建
build();