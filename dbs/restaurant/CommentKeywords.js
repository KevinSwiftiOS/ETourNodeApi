const mongoose = require('../db');
const Schema = mongoose.Schema;

const CommentKeywordsSchema = new Schema(
    {
        content: String,
        taste: String,
        server: String,
        evn: String,
        price: String,
        // loc:String
    },
    { collection: 'restaurant_comment_third' },
);

module.exports = mongoose.model('CommentKeywords', CommentKeywordsSchema);