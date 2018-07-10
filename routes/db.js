const MongoClient = require('mongodb').MongoClient;
const settings = require('./settings');

// 链接数据库 如果没有自动创建
function _connectDB(callback) {
  let url = settings.dbUrl;
  MongoClient.connect(url, function(err, db) {
    if (err) {
      callback(err, null);
      return;
    }
    // 数据库连接成功执行回调
    callback(err, db);
  })
}

// 插入数据
exports.insertOne = function(collectionName, json, callback) {
  _connectDB(function(err, db) {
    db.collection(collectionName).insertOne(json, function(err, result) {
      if (err) {
        callback(err, null);
        db.close();
        return;
      }
      callback(err, result);
      db.close();
    })
  })
}

// 查找数据
exports.find = function(collectionName, queryJson, callback) {
  _connectDB(function(err, db) {
    let json = queryJson.query || {},
      limit = Number(queryJson.limit) || 0,
      count = Number(queryJson.page) - 1,
      sort = queryJson.sort || {};
      // 页数为0或1都显示前 limit 跳数据
      if (count <= 0) {
        count = 0;
      } else {
        count = count * limit;
      }

      let cursor = db.collection(collectionName)
            .find(json).limit(limit).skip(count).sort(sort);
      console.log(222, cursor);
      cursor.toArray(function(err, results) {
        if( err) {
          callback(err, null);
          db.close();
          return;
        }
        callback(err, results);
        db.close();
      });
  })
}

// 删除数据
exports.deleteMany = function(collectionName, json, callback) {
  _connectDB(function(err, db) {
    db.collection(collectionName).deleteMany(json, function(err, resulters) {
      if (err) {
        callback(err, null);
        db.close();
        return;
      }
      callback(err, resulters);
      db.close();
    })
  })
}

// 修改数据
exports.updateMany = function(collectionName, jsonOld, jsonNew, callback) {
  _connectDB(function(err, db) {
    db.collection(collectionName).updateMany(
      jsonOld, {
        $set: jsonNew,
        $curerntDate: { 'lastModified:': false}
      },
      function(err, resulters) {
        if (err) {
          callback(err, null);
          db.close();
          return;
        }
        callback(err, resulters);
        db.close();
      }
    )
  })
}