const fs = require('fs');
const prettier = require('prettier');

module.exports = () => {
  // ------------------------------------http文件处理-------------------------------------
  // -----------------------------------router处理---------------------------------------
  let httpFile = fs.readFileSync('./http/http.js', 'utf-8');
  httpFile = httpFile.replace(/const\s+router\s*=\s*require\s*\(\s*['"]koa-router['"]\s*\)\s*\(\s*\)\s*;*/, `const router=require('../router/router.js');`);
  httpFile = httpFile.replace(/koa\s*\.\s*use\s*\(\s*this\s*\.\s*controller\s*\(\s*\)\s*\)\s*;*/, '');
  httpFile = httpFile.replace(/koa\s*\.\s*use\s*\(\s*this\s*\.\s*routerList\s*\(\s*router\s*\)\s*\)\s*;*/, '');
  httpFile = httpFile.replace(/this\s*\.\s*controller\s*=\s*require\s*\(\s*path\s*\.\s*resolve\(\s*__dirname\s*,\s*["']\.\/assist\/controller["']\s*\)\s*\)\s*;*/g, '');
  httpFile = httpFile.replace(/this\s*\.\s*routerList\s*=\s*require\s*\(\s*path\s*\.\s*resolve\(\s*__dirname\s*,\s*["']\.\.\/router\/router["']\s*\)\s*\)\s*;*/g, '');  

  if(!fs.existsSync('./dist/http'))
    fs.mkdirSync('./dist/http');
  fs.writeFileSync('./dist/http/http.js', prettier.format(httpFile, { parser: 'babel' }));

  // 读出router.js文件中关键字
  let routerFile = fs.readFileSync('./router/router.js', 'utf-8');
  let rStart = 0, rEnd = 0, sCount = 0, eCount = 0;
  for (let i = 0; i < routerFile.length; i++) {
    if (routerFile[i] == '{')
      sCount++;
    if (sCount == 2) {
      rStart = i + 1;
      break;
    }
  }
  for (let i = routerFile.length; i > 0; --i) {
    if (routerFile[i] == '}')
      eCount++;
    if (eCount == 2) {
      rEnd = i;
      break;
    }
  }
  routerFile = routerFile.slice(rStart, rEnd);
  routerFile = routerFile.replace(/await\s+next\s*\(\s*\)\s*;*/g, '');
  routerFile = routerFile.replace(/\/\/[^\n]*/g, '');
  routerFile = routerFile.replace(/\/\*.*?\*\//g, '');
  routerFile = routerFile.replace(/\s/g, '');
  routerFile = routerFile.match(/router[\s\S\w\W'",()/]+\)/)[0];
  // console.log(routerFile);

  let routerMethods = routerFile.match(/(get|post|put|delete|patch)\s*\(/g).map(item => item.slice(0, item.length - 1));
  let routerList = routerFile.match(/\([^)]+\)/g).map((item, index) => {
    item = item.split(',');
    item[0] = item[0].trim().slice(2, item[0].length - 1);
    item[1] = item[1].replace(/controller\s*\.\s*/, '');
    item[1] = item[1].trim().slice(0, item[1].length - 1);
    item.unshift(routerMethods[index]);
    return item;
  });


  // 读出controller夹下文件放进router.js中
  let result=`
function Controller(){}
  `;
  let controller = fs.readdirSync('./controller');
  for (let i in controller) {

    controller[i] = { file: controller[i].slice(0, controller[i].length - 3), info: fs.readFileSync(`./controller/${controller[i]}`, 'utf-8') };
    // 过滤注释
    controller[i].info = controller[i].info.replace(/\/\/[^\n]*/g, '');
    controller[i].info = controller[i].info.replace(/\/\*.*?\*\//g, '');
    controller[i].info = controller[i].info.replace(/\n/g, '');

    // 删除导出文件
    let moduleExport = new RegExp(`module\\s*\\.\\s*exports\\s*=\\s*${controller[i].file}\\s*;*`);
    controller[i].info = controller[i].info.replace(moduleExport, '');
    controller[i].info+=`
Controller.prototype=new ${controller[i].file}();
Controller.prototype.constructor=Controller;
    `;
    result+=controller[i].info;
  }

  for(let i in routerList){
    // console.log(routerList[i]);
    let whichPath=new RegExp(`${routerList[i][2]}\\s*\\(\\s*ctx\\s*\\)\\s*{`);
    // console.log(whichPath);
    for(let j in controller){
      let res=controller[j].info.match(whichPath);
      if(res){
        routerList[i].push(controller[j].file);
        break;
      }
    }
  }

  let koaRouter='koaRouter';
  for(let i in routerList){
    koaRouter+=`.${routerList[i][0]}('${routerList[i][1]}',controller.${routerList[i][2]})`;
  }

  result=`
const KoaRouter=require('koa-router');
const koaRouter=new KoaRouter();

${result}

const controller = new Controller();

${koaRouter};

module.exports=koaRouter;
  `;
  result=prettier.format(result, { parser: 'babel' });
  
  // console.log(result);
  // console.log(routerList);

  if(!fs.existsSync('./dist/router')){
    fs.mkdirSync('./dist/router');
  }
  fs.writeFileSync('./dist/router/router.js', result);


  // 
}
