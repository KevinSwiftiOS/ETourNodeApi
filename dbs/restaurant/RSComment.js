const mongoose = require('../db');
const Schma = mongoose.Schema;
const NewCommentSchema = new Schma({
        data_website: String,
        data_region: String,
        data_source: String,
        shop_name: String,
        shop_area: String,
        shop_name_search_key: String,
        comment_user_name: String,
        comment_time: String,
        comment_content: String,
        comment_score: Number,
        comment_year: Number,
        comment_season: String,
        comment_month: String,
        comment_week: String,
        data_region_search_key: String,
        comment_type: String,
        crawl_time: String,
        comment_taste_score: String,
        comment_service_score: String,
        comment_env_score: String,
        comment_average_price: Number,
        our_score: String
},

 { collection: 'restaurant_newest_comment' });

module.exports = mongoose.model("newComment", NewCommentSchema);

