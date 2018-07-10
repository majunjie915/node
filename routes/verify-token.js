const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
  let token = req.cookies.token; // 获取 cookies 中的 token
  let user = req.cookies.user;
  let id = req.cookies.id;
  if (token) {
    jwt.verify(token, 'secret', function(err, decode) { // 与加密时使用同样的方法对token进行解密
      // token正确就进入下一个方法继续执行，否则就清空cookie
      if (!err && decode.user === user && decode.id === id) {
        req.decode = decode;
        next();
      } else {
        res.cookie('token', '', { maxAge: 0});
        res.cookie('user', '', { maxAge: 0});
        res.cookie('id', '', { maxAge: 0});
        return res.json({
          "code": 401,
          "message": "登录失败"
        })
      }
    })
  } else {
    return res.json({
      "code": 401,
      "message": "请登陆后操作"
    })
  }
}