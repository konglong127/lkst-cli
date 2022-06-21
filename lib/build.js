const fs = require('fs');
const chalk = require('chalk');
const ora = require('ora');
const exists = ['config', 'controller', 'http', 'package-lock.json', 'package.json'];

const routerBuild = require('./build/router');
const copyFile = require('./build/copy.js');
const config = require('./build/config.js');
const middleware = require('./build/middleware.js');
const compiling = require('./build/compiling.js');
const configTs = require('./build/configTs.js');

function rmdir(rootPath) {
  if (fs.existsSync(rootPath)) {
    let dir = fs.readdirSync(rootPath);
    for (let i in dir) {
      if (fs.statSync(`${rootPath}/${dir[i]}`).isDirectory()) {
        rmdir(`${rootPath}/${dir[i]}`);
        fs.rmdirSync(`${rootPath}/${dir[i]}`);
      } else {
        fs.unlinkSync(`${rootPath}/${dir[i]}`);
      }
    }
  }
}

function stop(times) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, times);
  });
}

module.exports = async () => {

  // public判断是javascript还是typescript
  let spinner = ora('build project start...').start();
  if(fs.existsSync('config.js')){
    exists[0]='config.js'
  }
  if(fs.existsSync('config.ts')){
    exists[0]='config.ts'
  }

  for (let i in exists) {
    if (!fs.existsSync(exists[i])) {
      console.warn('\n'+chalk.red('[ERROR]: ') + 'this directory has no project can build!');
      spinner.stop();
      return;
    }
  }

  // public删除dist文件夹
  if (fs.existsSync('./dist')) {
    rmdir('./dist');
  } else {
    fs.mkdirSync('dist');
  }
  await stop(500);

  // javascript路由处理
  if(exists[0]=='config.js')
  try {
    spinner.text = 'router file processing...';
    routerBuild();
    await stop(500);
  } catch (error) {
    console.log('\n'+chalk.red('[ERROR]: ') + 'project build fail! format error, please check the router.js、http.js and controller.\n' + error);
    spinner.stop();
    return;
  }

  // typescript编译
  if(exists[0]=='config.ts')
  try{
    spinner.text = 'typescript compiling...';
    compiling();
    await stop(500);
  }catch(error){
    console.log('\n'+chalk.red('[ERROR]: ') + 'project build fail! typescript compile fail.\n' + error);
    spinner.stop();
    return;
  }

  // public复制views文件夹
  try {
    spinner.text = 'file copy. views file processing...';
    copyFile('./views');
    await stop(500);
  } catch (error) {
    console.log('\n'+chalk.red('[ERROR]: ') + 'project build fail! views file error.\n' + error);
    spinner.stop();
    return;
  }

  // public复制utils文件夹
  try{
    spinner.text = 'utils file processing...';
    copyFile('./utils');
    await stop(500);
  } catch (error) {
    console.log('\n'+chalk.red('[ERROR]: ') + 'project build fail! utils file error.\n' + error);
    spinner.stop();
    return;
  }
  
  // public复制public文件夹
  try{
    spinner.text = 'public file processing...';
    copyFile('./public');
    await stop(500);
  } catch (error) {
    console.log('\n'+chalk.red('[ERROR]: ') + 'project build fail! public file error.\n' + error);
    spinner.stop();
    return;
  }

  // typescript配置处理
  if(exists[0]=='config.ts')
  try{
    spinner.text = 'typescript config processing...';
    configTs();
    await stop(500);
  }catch(error){
    console.log('\n'+chalk.red('[ERROR]: ') + 'project build fail! typescript config error.\n' + error);
    spinner.stop();
    return;
  }
  
  // javascript复制log日志
  if(exists[0]=='config.js')
  try{
    spinner.text = 'log file processing...';
    copyFile('./log');
    await stop(500);
  } catch (error) {
    console.log('\n'+chalk.red('[ERROR]: ') + 'project build fail! log file error.\n' + error);
    spinner.stop();
    return;
  }
  
  // javascript复制socket文件夹
  if(exists[0]=='config.js')
  try{
    spinner.text = 'socket file processing...';
    copyFile('./socket');
    await stop(500);
  } catch (error) {
    console.log('\n'+halk.red('[ERROR]: ') + 'project build fail! socket file error.\n' + error);
    spinner.stop();
    return;
  }

  // javascript配置config.js文件
  if(exists[0]=='config.js')
  try{
    spinner.text = 'config file processing...';
    config();
    await stop(500);
  } catch (error) {
    console.log('\n'+chalk.red('[ERROR]: ') + 'project build fail! file config error.\n' + error);
    spinner.stop();
    return;
  } 

  // javascript复制middleware
  if(exists[0]=='config.js')
  try{
    spinner.text = 'middleware file processing...';
    middleware();
    await stop(500);
  } catch (error) {
    console.log('\n'+chalk.red('[ERROR]: ') + 'project build fail! middleware error.\n' + error);
    spinner.stop();
    return;
  }
  
  spinner.stop();

  console.log(chalk.hex('#87ceeb')('project built success!'));
}