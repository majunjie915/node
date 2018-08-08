# node

#若不想每次修改代码后都要重启服务器，可以安装并使用 supervisor 工具实现代码修改和自启动
npm install -g supervisor
supervisor bin/www

multer 用于文件上传，目前引入了但没用到

启动 MongoDB 进程：brew services start mongodb
停止 MongoDB 进程：brew services stop mongodb

访问：http://localhost:3000/