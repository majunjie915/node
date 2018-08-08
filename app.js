// 加载依赖库
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var multer = require('multer');
var mongoose = require('mongoose');
var session = require('express-session');

// 加载路由
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

// 项目实例化
var app = express();

app.use(session({ 
  resave: false, //添加 resave 选项
  saveUninitialized: true, //添加 saveUninitialized 选项
  secret: 'secret',
  cookie:{ 
    maxAge: 1000 * 60 * 60 * 24 * 30,
  }
}));
// view engine setup （设置模板位置和模板引擎格式）
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').__express);
app.set('view engine', 'html');

// 定义日志和输出级别
app.use(logger('dev'));
// 定义数据解析器 基于 body-parser
app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));
// 定义 cookie 解析器
app.use(cookieParser());
// 定义静态文件目录
app.use(express.static(path.join(__dirname, 'public')));

// 定义匹配路由
app.use('/', indexRouter); // 为 / 设置路由
app.use('/users', usersRouter); // 为 /user 设置路由
app.use('/login',indexRouter); // 即为为路径 /login 设置路由
app.use('/register',indexRouter); // 即为为路径 /register 设置路由
app.use('/home',indexRouter); // 即为为路径 /home 设置路由
app.use("/logout",indexRouter); // 即为为路径 /logout 设置路由

// catch 404 and forward to error handler（处理404错误）
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(req, res, next) {
  res.locals.user = req.session.user;   // 从session 获取 user对象
  var err = req.session.error;   //获取错误信息
  delete req.session.error;
  res.locals.message = "";   // 展示的信息 message
  if(err){ 
    res.locals.message = '<div class="alert alert-danger" style="margin-bottom:20px;color:red;">'+err+'</div>';
  }
  next();  //中间件传递
});

module.exports = app;
