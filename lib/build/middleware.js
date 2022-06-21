const fs = require('fs');
const prettier = require('prettier');

function middleware() {
  let obj = [];
  if (fs.existsSync('./middlewares')) {
    let mws = fs.readdirSync('./middlewares');
    if (mws) {
      for (let i in mws) {
        obj[i] = fs.readFileSync(`./middlewares/${mws[i]}`, 'utf-8');
        obj[i] = obj[i].replace(/\/\/[^\n]*/g, '');
        obj[i] = obj[i].replace(/\/\*.*?\*\//g, '');
        obj[i] = obj[i].replace(/module\s*\.\s*exports\s*=\s*\(\s*\)\s*=\s*>\s*{/, '');
        let start = obj[i].indexOf('return');
        let end = obj[i].lastIndexOf('}');
        obj[i] = obj[i].slice(start + 6, end);
      }
    }
  }else{
    return ;
  }

  let middleware = '';
  for (let i in obj) {
    middleware += `
    koa.use(${obj[i]});
    `;
  }
  middleware = prettier.format(middleware, { parser: 'babel' });
  // console.log(middleware);

  // 引入http文件进行读写
  let http = fs.readFileSync('./dist/http/http.js', 'utf-8');
  http = http.replace(/this\s*\.\s*middlewares\s*=\s*require\s*\(\s*path\s*\.\s*resolve\s*\(\s*__dirname\s*,\s*["']\s*\.\/assist\/middlewares["']\s*\)\s*\)\s*\(\s*\)\s*;*/, '');
  http = http.replace(
    /for\s*\(\s*let\s+i\s+in\s+this\s*\.\s*middlewares\s*\)\s*\{\s*let\s+userPlugin\s*=\s*this\s*\.\s*middlewares\[i\]\s*;*\s*koa\s*\.\s*use\s*\(\s*userPlugin\s*\(\s*\)\s*\)\s*;*\s*}/
    , middleware);
  http = prettier.format(http, { parser: 'babel' });

  fs.writeFileSync('./dist/http/http.js', http);

  let pkg=fs.readFileSync('./package.json','utf-8');
  let pkgl=fs.readFileSync('./package-lock.json','utf-8');

  fs.writeFileSync('./dist/package.json',pkg);
  fs.writeFileSync('./dist/package-lock.json',pkgl);
}

module.exports = middleware;