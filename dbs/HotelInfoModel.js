/**
 * Created by hcnucai on 2016/11/19.
 */
var mongoose = require('./db');
var Schema =  mongoose.Schema;
var shop = new Schema({
        //定义字段
        data_website:String,            // 爬取平台
        data_region:String,             // 千岛湖
        data_source:String,             // 酒店
        shop_name:String,               // 酒店名称
        shop_all_name:String,           // 百度地图坐标获取对应酒店名称
        shop_img:String,                // 酒店图片
        shop_url:String,                // URL
        shop_feature:String,            // 酒店特点
        shop_rate:String,               // 酒店等级
        shop_price:String,              // 酒店价格
        shop_grade:String,              // 酒店评分
        shop_location:String,           // 百度地图坐标获取对应酒店地理位置
        shop_address:String,            // 平台爬取对应地理位置
        shop_comment_num:String,        // 酒店评论数量
        crawl_time:String,              // 酒店信息爬去时间
        shop_longitude:String,          // 酒店经度
        shop_latitude:String,           // 酒店纬度
        shop_same_amount:String,        // 多家酒店融合 对应的数量
        shop_same_id:String,            // 融合酒店信息 ID
        shop_show_name:String,          // 融合酒店信息 名称
        shop_show_grade:String,         // 融合酒店信息 评分
        shop_show_address:String,       // 融合酒店信息 地理位置
        shop_show_comment_num:String    // 融合酒店信息 品论数量
    },
    { collection: 'shop' });

exports.Shop = mongoose.model("Shop", shop);