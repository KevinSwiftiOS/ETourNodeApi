const mongoose = require('../db');
const Schma = mongoose.Schema;
const SecondCommentSchema = new Schma({
    data_website: String,
    data_region: String,
    data_source: String,
    data_name: String,
    shop_area: String,
    shop_name_search_key: String,
    comment_user_name: String,
    comment_time: String,
    comment_content: String,
    comment_score: Number,
    comment_year: String,
    comment_season: String,
    comment_month: String,
    comment_week: String,
    data_region_search_key: String,
    comment_type: String
},

 { collection: 'restaurant_second_comment' });

module.exports = mongoose.model("secondComment", SecondCommentSchema);