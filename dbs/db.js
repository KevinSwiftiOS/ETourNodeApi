/**
 * Created by hcnucai on 2016/11/20.
 */
var mongoose = require("mongoose");
//进行数据库的链接 这里暂不管是生产环境还是调式环境
mongoose.Promise = global.Promise;
// var options = {
//     db:{native_parser:true},
//     server:{poolSize:5},
//     auth:{
//         user:'lab421',
//         pass:';lab421_1'
// }
// mongoose.connect("mongodb://lab421:lab421_1@120.55.59.187:28117/dspider2?authSource=admin");
mongoose.connect("mongodb://120.55.59.187:27017/dspider2");
//mongoose.connect("mongodb://caobourne:CaoBourne@111.231.71.167:27017/dspider2?authSource=admin");
// mongoose.connect("mongodb://lab421:lab421_1@10.1.17.25:27517/dspider2?authSource=admin");

//mongoose.connect("mongodb://localhost:27017/dspider2?authSource=admin");
var db = mongoose.connection;
db.on("error",function (err) {
    console.log(err);
})
module.exports = mongoose;




// var mongoose = require('mongoose'),
//     DB_URL = 'mongodb://lab421:lab421_1@120.55.59.187:28117/dsipder2';
//
// /**
//  * 连接
//  */
// mongoose.connect(DB_URL);
//
// /**
//  * 连接成功
//  */
// mongoose.connection.on('connected', function () {
//     console.log('Mongoose connection open to ' + DB_URL);
// });
//
// /**
//  * 连接异常
//  */
// mongoose.connection.on('error',function (err) {
//     console.log('Mongoose connection error: ' + err);
// });
//
// /**
//  * 连接断开
//  */
// mongoose.connection.on('disconnected', function () {
//     console.log('Mongoose connection disconnected');
// });
// module.exports = mongoose;
