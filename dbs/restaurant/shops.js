var mongoose = require('../db');
var Schema = mongoose.Schema;

var shopSchema = new Schema(
    {
        data_website: String,
        data_region: String,
        data_source: String,
        shop_name: String,
        shop_url: String,
        shop_comment_num: Number,
        shop_price: Number,
        shop_address: String,
        shop_img: String,
        shop_score: Number,
        shop_cook_style: String,
        shop_site: String,
        shop_comment_url: String,
        shop_lng: Number,
        shop_lat: Number,
        shop_service: Number,
        shop_taste: Number,
        shop_env: Number,
        crawl_time: Date,
        shop_category_name: String,
        shop_flag: Number,
    },
    { collection: 'restaurant_shop' },
);

module.exports = mongoose.model('Shop', shopSchema);
