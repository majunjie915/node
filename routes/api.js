const db = require('./db.js');
const jwt = require('jsonwebtoken');
let md5 = require('./md5.js');

exports.test = function(req, res, next) {
  db.find('mytest', { 'query': {} }, function(err, result) {
    if (err) {
      return res.json({
        "code": 404,
        "message": "数据查询失败",
        "result": []
      });
    }
    return res.json({
      "code": 200,
      "message": "数据获取成功",
      "result": result,
      "total": result.length
    });
    return next();
  })
}

exports.addtest = function(req, res, next) {
  let newData = {
    "title": req.body.title,
    "content": req.body.content
  };
  // 插入到数据库
  db.insertOne('mytest', newData, function(err, result) {
    if (err) {
      return res.json({
        "code": 401,
        "message": "test新增失败"
      })
    }
    return res.json({
      "code": 200,
      "message": "test新增成功"
    })
  })
}

exports.login = function(req, res, next) {
  let user = req.body.user,
    pwd = md5(req.body.pwd);
  // 根据用户名查询数据库中是否含有该用户
  db.findOne('users', { "user": user }, function(err, result) {
    if (err) {
      return res.json({
        "code": 500,
        "message": "内部服务器错误"
      });
    }

    if (!result || result.length === 0) {
      req.session.error = '用户名不存在';
      return res.json({
        "code": 401,
        "message": "用户名不存在"
      });
    }

    let dbPassword = result.pwd;
    let id = result._id;
    let expires = 60 * 60 * 24 * 30;
    if (dbPassword === pwd) {
      // 根据查到的 id、user 按照一定的加密方式生成 token，并且缓存在 cookie 中，
      // 后期当用户使用别的接口时我们可以直接通过 req.cookies.token 获取到 token，
      // 此时根据用户的 id 和 user 利用同样的方法解密得到对应的 user 和 id ，
      // 将新旧数据对比即可知道改 token 是否为正确登录的 token
      let token = jwt.sign({ id, user }, 'secret', { expiresIn: expires });
      res.cookie('token', token, { maxAge: expires });
      res.cookie('id', id, { maxAge: expires });
      res.cookie('user', user, { maxAge: expires });
      req.session.user = result;
      return res.json({
        "code": 200,
        "message": "登录成功"
      })
    } else {
      req.session.error = "密码错误";
      return res.json({
        "code": 401,
        "message": "密码错误"
      })
    }
  })
}

exports.register = function(req, res, next) {
  let user = req.body.user,
    pwd = md5(req.body.pwd);
  // 根据用户名查询数据库中是否含有该用户
  db.findOne('users', { "user": user }, function(err, result) {
    if(err){
      res.send({
        code: 500,
        message: '网络异常错误！'
      });
      req.session.error =  '网络异常错误！';
      console.log(err);
    }else if(result){ 
      req.session.error = '用户名已存在！';
      res.send({
        code: 500,
        message: '用户名已存在！'
      });
    }else{
      db.insertOne('users', { // 创建一组user对象置入model
        user: user,
        pwd: pwd
      }, function(err,result){ 
        if (err) {
          res.send(
            {
              code: 500,
              message: '用户名创建失败！'
            }
          );
          console.log(err);
        } else {
          req.session.error = '用户名创建成功！';
          res.send({
            code: 200,
            message: '用户名创建成功！'
          });
        }
      });
    }
  })
}