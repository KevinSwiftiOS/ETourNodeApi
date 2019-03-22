/**
 * Created by hcnucai on 2016/11/19.
 */
var mongoose = require('./db');
var Schema =  mongoose.Schema;
var regioninfo = new Schema({
        //定义字段
        id:String,
        address:String,
        lng:Number,
        lat:Number,
        search_key:String,
        name:String,


    },
    { collection: 'regioninfo' });

exports.Regioninfo = mongoose.model("Regioninfo", regioninfo);