const fs = require('fs');
const prettier = require('prettier');

function config() {
  let cfg = fs.readFileSync('./config.js', 'utf-8');

  // 去掉注释
  cfg = cfg.replace(/\/\/[^\n]*/g, '');
  cfg = cfg.replace(/\/\*.*?\*\//g, '');

  // 在config.js中提取配置参数
  let stack = [];
  let end = 0;
  let findinfo = cfg.match(/const\s+config\s*=\s*/);
  for (let i = findinfo.index + findinfo[0].length; i < cfg.length; ++i) {
    if (cfg[i] == '{') {
      stack.push('{');
    } else if (cfg[i] == '}') {
      stack.pop();
    }
    if (stack.length == 0) {
      end = i + 1;
      break;
    }
  }

  let obj = JSON.parse(prettier.format(cfg.slice(findinfo.index + findinfo[0].length - 1, end), { parser: 'json' }));
  obj.server.environment='production';
  // console.log(obj);

  // cluster引入config的配置文件
  let cluster = fs.readFileSync('./http/cluster.js', 'utf-8');
  cluster = cluster.replace(/\/\/[^\n]*/g, '');
  cluster = cluster.replace(/\/\*.*?\*\//g, '');
  cluster = cluster.replace(
    /this\s*\.\s*serverConfig\s*=\s*require\s*\(\s*this\s*\.\s*path\s*\.\s*resolve\s*\(\s*__dirname\s*,\s*["']\.\.\/config["']\s*\)\s*\)\s*\.\s*server\s*;*/,
    `this.serverConfig=${JSON.stringify(obj.server)}`
  );

  cluster = prettier.format(cluster, { parser: 'babel' });
  fs.writeFileSync('./dist/http/cluster.js', cluster);

  // 引入http的配置文件
  let http = fs.readFileSync('./dist/http/http.js', 'utf-8');
  http = http.replace(/\/\/[^\n]*/g, '');
  http = http.replace(/\/\*.*?\*\//g, '');
  http = http.replace(/this\s*\.\s*httpConfig\s*=\s*require\s*\(\s*path\s*\.\s*resolve\s*\(\s*__dirname\s*,\s*["']\.\.\/config["']\s*\)\s*\)\s*\.\s*server\s*;*/,
    `this.httpConfig = ${JSON.stringify(obj.server)}`
  );
  http = http.replace(/this\s*\.\s*uploadUrl\s*=\s*require\s*\(\s*path\s*\.\s*resolve\s*\(\s*__dirname\s*,\s*["']\.\.\/config["']\s*\)\s*\)\s*\.\s*uploadUrl\s*;*/,
    `this.uploadUrl = ${JSON.stringify(obj.uploadUrl)}`
  );

  http = prettier.format(http, { parser: 'babel' });
  fs.writeFileSync('./dist/http/http.js', http);

  // 引入日志文件的配置文件
  if(fs.existsSync('./log')&&fs.existsSync('./log/log.js')){
    let log = fs.readFileSync('./log/log.js', 'utf-8');
    log = log.replace(/if\s*\(\s*config\s*\.\s*server\s*\.\s*environment\s*==\s*['"]development['"]\s*&&\s*config\s*\.\s*logConsole\s*\)/g, '');
    log = log.replace(/const\s+config\s*=\s*require\s*\(\s*path\s*\.\s*resolve\s*\(\s*__dirname\s*,\s*['"]\.\.\/config['"]\s*\)\s*\)\s*;*/, '');
    log = log.replace(/console\s*\.\s*log\s*\([^\)]*\)\s*;*/g, '');
    log = prettier.format(log, { parser: 'babel' });
    fs.writeFileSync('./dist/log/log.js', log);
  }else{
    console.log('\n'+chalk.hex('#ff4500')('[WARNING]: ') + 'log/log.js is lost!(ignore)');
  }
  

  // 处理plugin文件，并引入配置文件
  if (fs.existsSync('./utils')&&fs.existsSync('./utils/plugin')&&fs.existsSync('./utils/plugin/plugin.js')) {
    let plugin = fs.readFileSync('./utils/plugin/plugin.js', 'utf-8');
    plugin = plugin.replace(/\/\/[^\n]*/g, '');
    plugin = plugin.replace(/\/\*.*?\*\//g, '');
    plugin = plugin.replace(/\n/g, '');
    plugin = plugin.replace(
      /const\s+config\s*=\s*require\s*\(\s*path\s*\.\s*resolve\s*\(\s*__dirname\s*,\s*['"]\.\.\/\.\.\/config['"]\s*\)\s*\)\s*;*/g,
      `const config=${JSON.stringify(obj)}`
    );
    plugin = prettier.format(plugin, { parser: 'babel' });
    // console.log(plugin);
    fs.writeFileSync('./dist/utils/plugin/plugin.js', plugin);
  }else{
    console.log('\n'+chalk.hex('#ff4500')('[WARNING]: ') + 'utils/database/plugin.js is lost!(ignore)');
  }

  // 引入redis配置文件
  if (fs.existsSync('./utils')&&fs.existsSync('./utils/database')&&fs.existsSync('./utils/database/redis.js')) {
    let redis = fs.readFileSync('./utils/database/redis.js', 'utf-8');
    redis = redis.replace(/\/\/[^\n]*/g, '');
    redis = redis.replace(/\/\*.*?\*\//g, '');
    redis = redis.replace(/\n/g, '');
    redis = redis.replace(/const\s+path\s*=\s*require\s*\(\s*['"]path['"]\s*\)\s*;*/, '');
    redis = redis.replace(
      /const\s+config\s*=\s*require\s*\(\s*path\s*\.\s*resolve\s*\(\s*__dirname\s*,\s*['"]\.\.\/\.\.\/config['"]\s*\)\s*\)\s*\.\s*redis\s*;*/,
      `const config={redis:${JSON.stringify(obj.redis)}}`
    );
    // console.log(redis);
    redis = prettier.format(redis, { parser: 'babel' });
    fs.writeFileSync('./dist/utils/database/redis.js', redis);
  }else{
    console.log('\n'+chalk.hex('#ff4500')('[WARNING]: ') + 'utils/database/redis.js is lost!(ignore)');
  }

  // 引入mysql配置文件
  if (fs.existsSync('./utils')&&fs.existsSync('./utils/database')&&fs.existsSync('./utils/database/mysql.js')) {
    let mysql = fs.readFileSync('./utils/database/mysql.js', 'utf-8');
    mysql = mysql.replace(/\/\/[^\n]*/g, '');
    mysql = mysql.replace(/\/\*.*?\*\//g, '');
    // mysql = mysql.replace(/\n/g, '');
    mysql = mysql.replace(/const\s+path\s*=\s*require\s*\(\s*['"]path['"]\s*\)\s*;*/, '');
    mysql = mysql.replace(
      /const\s+log\s*=\s*require\s*\(\s*path\s*\.\s*resolve\s*\(\s*__dirname\s*,\s*['"]\.\.\/\.\.\/log\/log['"]\s*\)\s*\)\s*;*/,
      `const log=require('../../log/log');`
    );
    mysql = mysql.replace(
      /const\s*\{\s*mysql\s*,\s*server\s*\}\s*=\s*require\s*\(\s*path\s*\.\s*resolve\s*\(\s*__dirname\s*,\s*['"]\.\.\/\.\.\/config['"]\s*\)\s*\)\s*;*/,
      `const mysql=${JSON.stringify(obj.mysql)};
      const server={environment:'production'};
      `
    );
    mysql = prettier.format(mysql, { parser: 'babel' });
    // console.log(mysql.slice(0, 400));
    fs.writeFileSync('./dist/utils/database/mysql.js', mysql);
  }else{
    console.log('\n'+chalk.hex('#ff4500')('[WARNING]: ') + 'utils/database/mysql.js is lost!(ignore)');
  }

  // 引入alone.js配置文件
  let main = fs.readFileSync('./http/alone.js', 'utf-8');
  main = main.replace(/\/\/[^\n]*/g, '');
  main = main.replace(/\/\*.*?\*\//g, '');
  // main = main.replace(/const\s+path\s*=\s*require\s*\(\s*['"]path['"]\s*\)\s*;*/, '');
  main = main.replace(
    /const\s+config\s*=\s*require\s*\(\s*path\s*\.\s*resolve\s*\(\s*__dirname\s*,\s*['"]\.\.\/config['"]\s*\)\s*\)\s*\.\s*server\s*;*/,
    `const config=${JSON.stringify(obj.server)}`
  );
  // main = main.replace(
  //   /const\s+http\s*=\s*require\s*\(\s*path\s*\.\s*resolve\s*\(\s*__dirname\s*,\s*['"]\.\/http\/http\.*[js]*['"]\s*\)\s*\)\s*;*/,
  //   `const http = require('./http/http');`
  // );
  main = prettier.format(main, { parser: 'babel' });
  // console.log(main);
  fs.writeFileSync('./dist/http/alone.js',main);
  
}

// 处理http中config
module.exports = config;