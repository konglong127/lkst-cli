const fs = require('fs');
const { query } = require('./exec.js');

// 删除文件夹
function rmdir(dirPath) {
  if (fs.existsSync(dirPath)) {
    let files = fs.readdirSync(dirPath);
    let childPath = null;
    files.forEach(item => {
      childPath = `${dirPath}/${item}`;
      if (fs.statSync(childPath).isDirectory()) {
        rmdir(childPath);
        fs.rmdirSync(childPath);
      } else {
        fs.unlinkSync(childPath);
      }
    });
  }
}

module.exports = async (git, name) => {
  // 如果使用git
  rmdir(`./${name}/.git`);
  fs.unlinkSync(`./${name}/.gitignore`);
  await query({ cmd: 'git', cArr: ['-rf', '.git'], path: { cwd: `./${name}` }, info: "config processing..." });
  fs.rmdirSync(`./${name}/.git`);

  if (git) {
    await query({ cmd: 'git', cArr: ['init'], path: { cwd: `./${name}` }, info: "git init..." });
  }
}
