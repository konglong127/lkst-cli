const fs = require('fs');
var fileName='';

function rmdir(rootPath){
  if(fs.existsSync(`${rootPath}`)){
    let dir=fs.readdirSync(`${rootPath}`);
    for(let i in dir){
      if(fs.statSync(`${rootPath}/${dir[i]}`).isDirectory()){
        if(`${rootPath}/${dir[i]}`!=`./${fileName}/utils/keys`){
          rmdir(`${rootPath}/${dir[i]}`);
          fs.rmdirSync(`${rootPath}/${dir[i]}`);
        }
      }else{
        fs.unlinkSync(`${rootPath}/${dir[i]}`);
      }
    }
  }
}

module.exports = (tools, name) => {
  fileName=name;
  if (!tools) {
    rmdir(`./${name}/utils`);
    fs.writeFileSync(`./${name}/http/http.js`,`
const KOA = require('koa')
const koa = new KOA();
const sslify = require('koa-sslify').default;
const http = require('http');
const http2 = require('http2');
const https = require('https');
const logger = require('koa-logger');
const cors = require('koa2-cors');
const range = require('koa-range');
const koaStatic = require('koa-static');
const session = require('koa-session');
const views = require('koa-views');
const router = require('koa-router')();
const path = require('path');
const fs = require('fs');

class HttpServer {
  constructor() {
    // 端口号
    this.port;
    // 进程角色
    this.role;
    // 标记是否开启服务器间通信
    this.serverSocket;
    // 中间件处理
    this.middlewares = require(path.resolve(__dirname, './assist/middlewares'))();
    // 路由处理
    this.controller = require(path.resolve(__dirname, './assist/controller'));
    // 引入路由列表
    this.routerList = require(path.resolve(__dirname, '../router/router'));
    // http配置文件
    this.httpConfig = require(path.resolve(__dirname, '../config/config')).server;
    // 指定文件上传接口
    this.uploadUrl = require(path.resolve(__dirname, '../config/config')).uploadUrl;
  }
  create(info, serverSocket) {
    this.port = info.port;
    this.role = info.role;
    this.serverSocket = serverSocket;
    this.middleware(koa);
  }
  middleware(koa) {

    const config = {
      key: 'koa:http-https-socket', //cookie key (default is koa:sess) 
      maxAge: 1000 * 60 * 60, // cookie 的过期时间 1小时 
      overwrite: true, //是否可以 overwrite (default true) 
      httpOnly: true, //cookie 是否只有服务器端可以访问 false or true (default true) 
      signed: true, //签名默认 true 
      rolling: true, //在每次请求时刷新过期时间(deault false)
      renew: false, //再快过期时刷新有效期
    }

    koa.keys = ['some secret hurr'];

    koa.use(session(config, koa));

    if (this.httpConfig.environment == 'development')
      koa.use(logger());

    koa.use(cors({
      origin: '*',
      // exposeHeaders: ['WWW-Authenticate', 'Server-Authorization', 'Date'],
      maxAge: 100,
      credentials: true,
      allowMethods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      allowHeaders: ['X-Requested-With', 'X_Requested_With', 'Content-Type', 'Content-Length', 'Authorization', 'Accept', 'X-Custom-Header', 'anonymous', 'token'],
    }));

    for (let i in this.middlewares) {
      let userPlugin = this.middlewares[i];
      koa.use(userPlugin());
    }

    koa.use(views(path.resolve(__dirname, '../views'), {
      extension: this.httpConfig.template || 'html'
    }));

    if (this.role != 'agent') {
      koa.use(range);

      koa.use(koaStatic(path.resolve(__dirname, '../public')));

      if (this.httpConfig.environment != 'development') {
        koa.use(async (ctx, next) => {
          try {
            await next();
          } catch (err) {
            ctx.app.emit('error', err, ctx);
          }
        });
      }

      koa.use(this.controller());

      koa.use(this.routerList(router));

      koa.use(router.routes(), router.allowedMethods());

      if (this.httpConfig.environment != 'development') {
        koa.on('error', (err, ctx) => {
          ctx.response.status = 200;
          ctx.response.body = '404,您访问路径不存在！';
          ctx.log(\`
              --------------------------------------------------------------------------\n
                  出错时间：\${new Date()}\n
                  文件名：http.js\n
                  错误描述：查询处理中发生错！\n
                  错误信息：\${JSON.stringify(err)}\n
              --------------------------------------------------------------------------\n
          \`);
        });
      }
    }

    this.start();
  }
  serverSocketConnect(server) {
    const WebSocket = require('ws');

    const socketout = require(path.resolve(__dirname, '../socket/socket-out/socket-out.js'));

    if (this.httpConfig.webSocket) {
      const WebSocketApi = require(path.resolve(__dirname, '../socket/socket-in/socket-in.js'));
      const wss = new WebSocket.Server({ server });

      WebSocketApi(wss, this.port);
    }

    if ((this.httpConfig.serverSocket == undefined && this.serverSocket ||
      this.httpConfig.serverSocket) && this.role == 'agent') {

      let arr = this.httpConfig.workers.filter(item => item.port != this.port);
      for (let i in arr) {
        socketout(arr[i].port);
      }

    }
  }
  start() {
    const options = {
      key: fs.readFileSync(this.httpConfig.keyPath, 'utf-8'),
      cert: fs.readFileSync(this.httpConfig.certPath, 'utf-8')
    };

    if (this.httpConfig.type == 'https') {
      koa.use(sslify());

      const server = https.createServer(options, koa.callback());

      this.serverSocketConnect(server);

      koa.use((ctx) => {
        ctx.response.type = 'html';
        ctx.response.body = '404';
      });

      server.listen(this.port, () => {
        if (this.httpConfig.environment == 'development')
          console.log('server:', this.httpConfig.desc || '127.0.0.1', this.port);
      });
    } else if (this.httpConfig.type == 'http2') {

      const server = http2.createServer(options, koa.callback());

      koa.use((ctx) => {
        ctx.response.type = 'html';
        ctx.response.body = '404';
      });

      server.listen(this.port, () => {
        if (this.httpConfig.environment == 'development')
          console.log('server:', this.httpConfig.desc || '127.0.0.1', this.port);
      });
    } else {
      const server = http.createServer(koa.callback());
      // const server=http2.createServer(options, koa.callback());

      this.serverSocketConnect(server);

      koa.use((ctx) => {
        ctx.response.type = 'html';
        ctx.response.body = '404';
      });

      server.listen(this.port, () => {
        if (this.httpConfig.environment == 'development')
          console.log('server:', this.httpConfig.desc || '127.0.0.1', this.port);
      });
    }

  }
}

module.exports = new HttpServer();
    
    `);

  }
}