/**
 * Created by hcnucai on 2016/11/19.
 */
const mongoose = require('../db');
const Schema =  mongoose.Schema;
const spotsSchema = new Schema({
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
module.exports = mongoose.model('Spots', spotsSchema)
// exports.Spots = mongoose.model("Spots", spotsSchema);