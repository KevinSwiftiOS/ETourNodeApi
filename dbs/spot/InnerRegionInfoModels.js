/**
 * Created by hcnucai on 2016/11/19.
 */
var mongoose = require('../db');
var Schema =  mongoose.Schema;
var innerregioninfo = new Schema({
        //定义字段
        id:String,
        address:String,
        lng:Number,
        lat:Number,
        search_key:String,
        name:String,


    },
    { collection: 'innerregioninfo' });

exports.InnerRegioninfo = mongoose.model("InnerRegioninfo", innerregioninfo);