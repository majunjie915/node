var express = require('express');
var router = express.Router();

// 我新增的api，用于连接到数据库
var api = require('./api.js')
const verifyToken = require('./verify-token.js')

// 我新增的测试接口
router.get('/api/test', api.test) // 获取数据
// router.post('/api/addtest', api.addtest) // 添加数据
router.route('/api/addtest').all(verifyToken).post(api.addtest) // 登录后操作
router.post('/api/login', api.login) // 登录模块
router.post('/api/register', api.register) // 注册模块
router.post('/api/updateUserinfo', api.updateUserinfo) // 修改个人信息模块
router.route('/api/uploadImg').all(verifyToken).post(api.uploadImg); // 图片上传模块

// 下面是页面跳转的路由
/* GET / page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET login page. */
router.route("/login").get(function(req,res){    // 到达此路径则渲染login文件，并传出title值供 login.html使用
  res.render("login",{title:'User Login', message: '登录页面'});
});

/* GET register page. */
router.route("/register").get(function(req,res){    // 到达此路径则渲染register文件，并传出title值供 register.html使用
  res.render("register",{title:'User register', message: '注册页面'});
});

/* GET userInfo page. */
router.route("/userInfo").get(function(req,res){    // 到达此路径则渲染userInfo文件，并传出title值供 userInfo.html使用
  if(!req.session.user){                     //到达/home路径首先判断是否已经登录
    req.session.error = "请先登录"
    res.redirect("/login");                //未登录则重定向到 /login 路径
  }
  res.render("userInfo",{title:'User infomation', message: '用户信息页面'});
});

/* GET home page. */
router.get("/home",function(req,res){ 
  if(!req.session.user){                     //到达/home路径首先判断是否已经登录
    req.session.error = "请先登录"
    res.redirect("/login");                //未登录则重定向到 /login 路径
  }
  res.render("home",{
    title:'Home',
    user: {name: req.session.user.user}
  });         //已登录则渲染home页面
});

/* GET logout page. */
router.get("/logout",function(req,res){    // 到达 /logout 路径则登出， session中user,error对象置空，并重定向到根路径
  req.session.user = null;
  req.session.error = null;
  res.redirect("/");
});

module.exports = router;
