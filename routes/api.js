const db = require('./db.js');
const jwt = require('jsonwebtoken');
const md5 = require('./md5.js');
const ObjectId = require('mongodb').ObjectId;
const formidable = require('formidable');
var sd = require('silly-datetime');
const fs = require('fs');
var AVATAR_UPLOAD_FOLDER = '/avatar/'; // 上传图片存放路径，注意在本项目public文件夹下面新建avatar文件夹

exports.test = function(req, res, next) {
  db.find('mytest', 
    { 
      'query': {},
      'limit': req.query.limit,
      'page': req.query.page
    }, 
    function(err, result) {
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

exports.deletetest = function(req, res, next) {
  let data = {
    "title": req.body.title,
  };
  // 删除数据库中的记录
  db.deleteMany('mytest', data, function(err, result) {
    if (err) {
      return res.json({
        "code": 401,
        "message": "test删除失败"
      })
    }
    return res.json({
      "code": 200,
      "message": "test删除成功",
      "result": result
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
    let expires = 1000 * 60 * 60 * 24 * 30;
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
        "message": "登录成功",
        "result": result
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

// 获取个人信息
exports.userInfo = function(req, res, next) {
  db.find('users', { 'query': {
    user: req.body.user || req.cookies.user
  } }, function(err, result) {
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

// 更新个人信息
exports.updateUserinfo = function(req, res, next) {
  let newData = {
    "name": req.body.name,
    "phone": req.body.phone,
    "motto": req.body.motto
  };
  let testTel = /^(13[0-9]|14[579]|15[0-3,5-9]|16[6]|17[0135678]|18[0-9]|19[89])\d{8}$/;
  if (!testTel.test(req.body.phone)) {
    return res.json({
      "code": 401,
      "message": "手机号码格式比正确"
    });
  }
  // 注意这里用 ObjectId(req.cookies.id)
  db.updateMany('users', { "_id": ObjectId(req.cookies.id) }, newData, function(err, result) {
    if (err) {
      return res.json({
        "code": 401,
        "message": "更新失败"
      })
    }

    return res.json({
      "code": 200,
      "message": "更新成功"
    })
  })
}

// 上传图片
exports.uploadImg = function(req, res, next) {
  var form = new formidable.IncomingForm(); // 创建上传表单
  form.encoding = 'utf-8'; // 设置编辑
  form.uploadDir = 'public' + AVATAR_UPLOAD_FOLDER; // 设置上传目录
  form.keepExtensions = true; // 保留后缀
  form.maxFieldsSize = 2 * 1024 * 1024; // 文件大小

  form.parse(req, function(err, fields, files) {
    if (err) {
      return res.json({
        "code": 500,
        "message": "内部服务器错误"
      });
    }

    // 限制文件大小 单位默认字节 这里限制大小为2M
    if (files.fulAvatar.size > form.maxFieldsSize) {
      fs.unlink(files.fulAvatar.path);
      return res.json({
        "code": 401,
        "message": "图片应小于2M"
      });
    }

    var extName = ''; // 后缀名
    switch(files.fulAvatar.type) {
      case 'image/pjpeg':
        extName = 'jpg';
        break;
      case 'image/jpeg':
       extName = 'jpg';
       break;
      case 'image/png':
        extName = 'png';
        break;
      case 'image/x-png':
        extName = 'png';
        break;
    }

    if (extName.length == 0) {
      return res.json({
        "code": 404,
        "message": "只支持png和jpg格式图片"
      });
    }

    //使用第三方模块silly-datetime
    var t = sd.format(new Date(), 'YYYYMMDDHHmmss');
    // 生成随机数
    var ran = parseInt(Math.random() * 8999 + 10000);
    // 生成新图片名称
    // var avatarName = t + '_' + ran + '.' + extName;
    var avatarName = req.cookies.id + '.' + extName;
    // 生成新图片地址
    var newPath = form.uploadDir + avatarName;

    // 更改名字和路径
    fs.rename(files.fulAvatar.path, newPath, function(err) {
      if (err) {
        return res.json({
          "code": 401,
          "message": "图片上传失败"
        });
      }
      return res.json({
        "code": 200,
        "message": "上传成功",
        result: AVATAR_UPLOAD_FOLDER + avatarName
      });
    })
  })
}