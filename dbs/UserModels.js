/**
 * Created by hcnucai on 2016/11/19.
 */
var mongoose = require('./db');
var Schema =  mongoose.Schema;
//定义用户列表
var user = new Schema({
        //定义字段
        username:String,
        password:String,


    },
    { collection: 'user' });

exports.User = mongoose.model("User", user);