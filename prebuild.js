const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

// 定义常量
const PUBLIC_DIR = path.join(__dirname, 'public');
const DOWNLOAD_URL = 'https://codeload.github.com/kimwang1978/tvbox/zip/refs/heads/main';
const TEMP_ZIP = path.join(__dirname, 'temp.zip');
const TEMP_DIR = path.join(__dirname, 'temp_unzip');

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 下载文件（使用curl命令）
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`开始下载文件: ${url}`);
      
      // 从环境变量中获取代理信息
      const proxy = process.env.http_proxy || process.env.HTTP_PROXY || process.env.https_proxy || process.env.HTTPS_PROXY;
      if (proxy) {
        console.log(`使用代理: ${proxy}`);
      } else {
        console.log('未设置代理');
      }
      
      // 使用curl命令下载文件
      // -L: 跟随重定向
      // -o: 指定输出文件
      // --insecure: 忽略SSL证书验证
      // --max-time: 设置超时时间为300秒
      // --progress-bar: 显示进度条
      // --fail: 下载失败时返回错误
      // --proxy: 显式指定代理
      let curlCommand = `curl -L -o "${dest}" --insecure --max-time 3000 --progress-bar --fail`;
      if (proxy) {
        curlCommand += ` --proxy "${proxy}"`;
      }
      curlCommand += ` "${url}"`;
      execSync(curlCommand, {
        stdio: 'inherit' // 将curl的输出重定向到当前进程的输出
      });
      
      console.log(`下载完成，保存到: ${dest}`);
      resolve();
    } catch (error) {
      console.error('下载错误:', error.message);
      // 删除不完整的文件
      if (fs.existsSync(dest)) {
        fs.unlinkSync(dest);
      }
      reject(error);
    }
  });
}

// 解压文件并覆盖到public目录
function unzipAndOverwrite() {
  console.log('开始解压文件...');
  
  // 确保临时目录存在
  ensureDir(TEMP_DIR);
  
  // 检查下载的zip文件是否存在且不为空
  if (!fs.existsSync(TEMP_ZIP)) {
    throw new Error('下载的zip文件不存在');
  }
  
  const zipStats = fs.statSync(TEMP_ZIP);
  if (zipStats.size === 0) {
    throw new Error('下载的zip文件为空');
  }
  
  console.log(`Zip文件大小: ${zipStats.size} 字节`);
  
  try {
    // 解压zip文件到临时目录
    // 使用spawnSync避免处理交互式提示
    // -o: 覆盖已存在文件
    // -q: 安静模式
    // -b: 设置错误输出级别
    const unzipResult = spawnSync('unzip', ['-oq', '-b', 'zipinfo', TEMP_ZIP, '-d', TEMP_DIR], {
      encoding: 'utf-8'
    });
    
    if (unzipResult.status !== 0) {
      console.error('解压错误详情:', unzipResult.stderr);
      // 尝试使用jar命令（Java自带，支持UTF-8文件名）
      try {
        console.log('尝试使用jar命令解压...');
        const jarResult = spawnSync('jar', ['xf', TEMP_ZIP], {
          cwd: TEMP_DIR,
          encoding: 'utf-8'
        });
        
        if (jarResult.status !== 0) {
          console.error('jar解压错误详情:', jarResult.stderr);
          throw new Error('解压文件失败');
        }
      } catch (error2) {
        // 尝试使用简化的方式：只解压有效文件
        console.log('尝试使用简化方式解压...');
        // 使用unzip列出所有文件，过滤掉有问题的文件名
        const listResult = spawnSync('unzip', ['-l', TEMP_ZIP], {
          encoding: 'utf-8'
        });
        
        if (listResult.status === 0) {
          // 提取所有文件名
          const fileList = listResult.stdout.split('\n')
            .filter(line => line.includes('/'))
            .map(line => {
              const parts = line.split(/\s+/);
              return parts[parts.length - 1];
            })
            .filter(filename => filename.trim() !== '');
          
          // 逐个解压有效文件
          for (const filename of fileList) {
            try {
              spawnSync('unzip', ['-oq', '-j', TEMP_ZIP, filename, '-d', path.join(TEMP_DIR, path.dirname(filename))], {
                encoding: 'utf-8'
              });
            } catch (e) {
              console.warn(`跳过有问题的文件: ${filename}`);
            }
          }
        } else {
          console.error('列出zip内容失败:', listResult.stderr);
          throw new Error('解压文件失败');
        }
      }
    }
  } catch (error) {
    console.error('解压错误详情:', error.message);
    throw new Error('解压文件失败');
  }
  
  // 获取解压后的目录名（GitHub的zip解压后会有一个以仓库名和分支名命名的目录）
  const tempFiles = fs.readdirSync(TEMP_DIR);
  if (tempFiles.length === 0) {
    throw new Error('解压后临时目录为空');
  }
  
  const zipContentDir = tempFiles[0];
  const extractedPath = path.join(TEMP_DIR, zipContentDir);
  
  console.log(`解压完成，内容在: ${extractedPath}`);
  
  try {
    // 复制所有文件到public目录（覆盖已存在的文件）
    // 使用-p保留文件权限，-r递归复制，-f强制覆盖
    execSync(`cp -prf ${extractedPath}/* ${PUBLIC_DIR}/`, { encoding: 'utf-8' });
  } catch (error) {
    console.error('复制文件错误详情:', error.stderr);
    throw new Error('复制文件到public目录失败');
  }
  
  console.log('已将解压后的内容覆盖写入到public目录');
}

// 清理临时文件
function cleanup() {
  console.log('清理临时文件...');
  if (fs.existsSync(TEMP_ZIP)) {
    fs.unlinkSync(TEMP_ZIP);
  }
  if (fs.existsSync(TEMP_DIR)) {
    execSync(`rm -rf ${TEMP_DIR}`);
  }
  console.log('清理完成');
}

// 执行prebuild
async function prebuild() {
  try {
    // 确保public目录存在
    ensureDir(PUBLIC_DIR);
    
    // 下载文件
    await downloadFile(DOWNLOAD_URL, TEMP_ZIP);
    
    // 解压并覆盖
    unzipAndOverwrite();
    
    // 清理临时文件
    cleanup();
    
    console.log('prebuild完成');
  } catch (error) {
    console.error('prebuild失败:', error.message);
    // 发生错误时也要清理临时文件
    cleanup();
    process.exit(1);
  }
}


prebuild();