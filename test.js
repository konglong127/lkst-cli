return async (ctx, next) => {
  if (ctx.config.passMiddlewares && ctx.config.passMiddlewares.find(item => ctx.request.url.startsWith(item))) {
    let { jwt, response, request } = ctx;
    let openid = request.query.openid || request.body.openid;
    let token = new jwt(request.header.token).verifyToken();
    if (token == err) {
      response.body = { msg: "请求头错误！", status: 404 };
    } else {
      token = JSON.parse(token);
      if (token.openid == openid) {
        await next();
      } else {
        response.body = { msg: "请求头错误！", status: 404 };
      }
    }
  } else {
    await next();
  }
}
