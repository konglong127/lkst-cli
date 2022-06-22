const fs = require('fs');
// 输入输出对话框
const inquirer = require('inquirer');
var prompt = inquirer.createPromptModule();
// 对话框问题
const questions = require('./questions/questions.js');
//处理异步
const { promisify } = require('util');
//镂空文字
const figlet = promisify(require('figlet'));
//修改文字颜色
const chalk = require('chalk');
// 旋转进度条
const ora = require('ora');
// 执行命令
const { query } = require('./init/exec.js');
// 是否使用git
const git = require('./init/git.js');
// 是否使用自带工具库
const isUseTools = require('./init/isUseTools.js');
// 删除下载后的多余文件
const afterDownload = require('./init/afterDownload.js');

module.exports = async (name) => {
  // ----------------------------收集问题信息----------------------------------------
  let answer = await prompt(questions);
  // console.log(answer);

  // clear();
  // -------------------------------命令行标题---------------------------------------
  const data = await figlet('welcome to use my server template!');
  console.log(chalk.green(data));


  // ----------------------------------下载-----------------------------------------
  console.log(`${chalk.hex('#87ceeb')('[INFO]: ')}create project ${name}`);
  if (fs.existsSync(`./${name}`)) {
    console.warn(chalk.red('[ERROR]: ') + 'The file has already exists! please change a project name or delete the file.');
    return;
  }
  fs.mkdirSync(`./${name}`);
  try {
    let download=answer.language=='javascript'?
    'https://github.com/konglong127/KoaServerTemplate.git':
    'https://github.com/konglong127/KoaServerTemplateTS.git';

    await query({
      cmd: 'git',
      cArr: ['clone', download],
      path: { cwd: `./${name}` },
      info: 'downloading koa server template!'
    });
  } catch(error){
    console.warn(chalk.red('[ERROR]: ') + 'donwload fail! please check the network.');
    console.log(error);
  }
  console.log(`${chalk.hex('#87ceeb')('[INFO]: ')}${chalk.hex('#90ee90')('download template success!')}`);


  // ----------------------------删除下载后的一些多余文件--------------------------------
  console.log(`${chalk.hex('#87ceeb')('[INFO]: ')}file processing...`);
  try {
    await afterDownload(name);
  } catch(error){
    console.warn(chalk.red('[ERROR]: ') + 'file process fail! please check the network.');
    console.log(error);
    return;
  }
  console.log(`${chalk.hex('#87ceeb')('[INFO]: ')}${chalk.hex('#90ee90')('file process success!')}`);


  // ------------------------------git、isUseTools---------------------------------------
  console.log(`${chalk.hex('#87ceeb')('[INFO]: ')}config processing...`);
  try {
    await git(answer.git, name);
  } catch(error){
    console.warn(chalk.red('[ERROR]: ') + 'git config fail!');
    console.log(error);
  }
  try{
    isUseTools(answer.tools, name);
  }catch(error){
    console.warn(chalk.red('[ERROR]: ') + 'utils config fail!');
    console.log(error);
  }
  console.log(`${chalk.hex('#87ceeb')('[INFO]: ')}${chalk.hex('#90ee90')('config process success!')}`);


  // ------------------------安装node_modules------------------------------------
  console.log(`${chalk.hex('#87ceeb')('[INFO]: ')}install node_modules...`);
  let spinner = ora('install node_modules...').start();
  try {
    await query({
      cmd: process.platform === 'win32' ? 'npm.cmd' : 'npm',
      cArr: ['install'],
      path: { cwd: `./${name}` },
      info: 'install node_modules...'
    });
    spinner.stop();
    console.log(`${chalk.hex('#87ceeb')('[INFO]: ')}${chalk.hex('#90ee90')('node_modules download success!')}`);
  } catch{
    console.warn(chalk.hex('#ff4500')('[WARNING]: ') + "node_modules donwload fail! You can try to execute 'npm install' install the node_modules by yourself.");
    spinner.stop();
  }


  // -----------------------------------处理完成------------------------------------
  console.log(`
  ${chalk.green('template download completed')}
  ====================================
    cd ${name}
      ${chalk.green('npm start')}
      ${chalk.green('npm run serve')}
  ====================================
  `);

  // 运行，打开浏览器
  // await spawn(`cnpm`,['run','serve'],{cwd:`./${name}`});
  // open(`http://localhost:8080`);
}
