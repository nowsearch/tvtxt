const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 定义常量
const PUBLIC_DIR = path.join(__dirname, 'public');
const REPO_URL = process.env.TV_GIT || 'https://github.com/kimwang1978/tvbox.git';
const REPO_BRANCH = 'main';
const TEMP_DIR = path.join(__dirname, 'temp_repo');

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 克隆或更新Git仓库
function cloneOrUpdateRepo(url, branch, dest) {
  try {
    console.log(`开始获取Git仓库: ${url} (分支: ${branch})`);
    
    // 从环境变量中获取代理信息
    const proxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
    if (proxy) {
      console.log(`使用代理: ${proxy}`);
    } else {
      console.log('未设置代理');
    }
    
    // 检查临时目录是否已存在
    if (fs.existsSync(dest)) {
      // 如果目录已存在，先删除
      console.log('删除已存在的临时目录...');
      execSync(`rm -rf ${dest}`, { encoding: 'utf-8' });
    }
    
    // 使用git clone命令克隆仓库
    // --depth=1: 只克隆最近一次提交，减少下载量
    // --branch: 指定分支
    // --single-branch: 只克隆指定分支
    // --quiet: 安静模式
    let gitCommand = `git clone --depth=1 --branch ${branch} --single-branch`;
    if (proxy) {
      // 设置Git代理
      gitCommand = `git -c http.proxy=${proxy} -c https.proxy=${proxy} clone --depth=1 --branch ${branch} --single-branch`;
    }
    gitCommand += ` ${url} ${dest}`;
    
    execSync(gitCommand, {
      stdio: 'inherit' // 将git的输出重定向到当前进程的输出
    });
    
    console.log('Git仓库获取完成');
  } catch (error) {
    console.error('Git操作错误:', error.message);
    throw new Error('获取Git仓库失败');
  }
}

// 将仓库内容复制到public目录
function copyRepoToPublic(repoDir, publicDir) {
  console.log('开始将仓库内容复制到public目录...');
  
  try {
    // 复制所有文件到public目录（覆盖已存在的文件）
    // 使用-p保留文件权限，-r递归复制，-f强制覆盖
    execSync(`cp -prf ${repoDir}/* ${publicDir}/`, { encoding: 'utf-8' });
    
    // 删除不需要的文件
    const filesToDelete = ['tvbox.txt', 'README.md'];
    filesToDelete.forEach(fileName => {
      const filePath = path.join(publicDir, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`已删除${fileName}文件`);
      }
    });
    
    console.log('已将仓库内容覆盖写入到public目录（已排除指定文件）');
  } catch (error) {
    console.error('复制文件错误详情:', error.stderr);
    throw new Error('复制文件到public目录失败');
  }
}

// 清理临时文件
function cleanup() {
  console.log('清理临时文件...');
  if (fs.existsSync(TEMP_DIR)) {
    execSync(`rm -rf ${TEMP_DIR}`, { encoding: 'utf-8' });
  }
  console.log('清理完成');
}

// 生成tvtxt.txt文件
function generateTvtxtTxt() {
  console.log('开始生成tvtxt.txt文件...');
  
  try {
    // 获取domain环境变量，默认为example.com
    const domain = process.env.domain || 'example.com';
    console.log(`使用域名: ${domain}`);
    
    // 遍历public目录下的所有文件夹
    const folders = fs.readdirSync(PUBLIC_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    // 生成JSON内容
    const tvtxtContent = {
      urls: folders.map(folder => {
        // 检查是否存在api.json文件
        const apiJsonPath = path.join(PUBLIC_DIR, folder, 'api.json');
        if (fs.existsSync(apiJsonPath)) {
          return {
            url: `https://${domain}/${folder}/api.json`,
            name: folder
          };
        }
        return null;
      }).filter(item => item !== null) // 过滤掉没有api.json的文件夹
    };
    
    // 将JSON写入文件
    const tvtxtPath = path.join(PUBLIC_DIR, 'tvtxt.txt');
    fs.writeFileSync(tvtxtPath, JSON.stringify(tvtxtContent, null, 2), 'utf8');
    
    console.log(`tvtxt.txt文件已生成，共包含 ${tvtxtContent.urls.length} 个条目`);
  } catch (error) {
    console.error('生成tvtxt.txt文件失败:', error.message);
    throw new Error('生成tvtxt.txt文件失败');
  }
}

// 执行prebuild
async function prebuild() {
  try {
    // 确保public目录存在
    ensureDir(PUBLIC_DIR);
    
    // 克隆或更新Git仓库
    cloneOrUpdateRepo(REPO_URL, REPO_BRANCH, TEMP_DIR);
    
    // 将仓库内容复制到public目录
    copyRepoToPublic(TEMP_DIR, PUBLIC_DIR);
    
    // 生成tvtxt.txt文件
    generateTvtxtTxt();
    
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