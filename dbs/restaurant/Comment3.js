const mongoose = require('../db');
const Schema = mongoose.Schema;

const CommentThirdSchema = new Schema(
    {

    },
    { collection: 'restaurant_comment' },
);

module.exports = mongoose.model('CommentThird', CommentThirdSchema);