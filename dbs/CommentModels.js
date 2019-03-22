/**
 * Created by hcnucai on 2016/11/19.
 */
var mongoose = require('./db');
var Schema =  mongoose.Schema;
var comment = new Schema({
        //定义字段
        data_website:String,
        data_region:String,
        data_source:String,
        comment_user_name:String,
        comment_time:String,
        shop_name:String,
        comment_content:String,
        comment_score:Number,
        crawl_time:String,

    },
    { collection: 'spot_comment' });

exports.Comment = mongoose.model("Comment", comment);