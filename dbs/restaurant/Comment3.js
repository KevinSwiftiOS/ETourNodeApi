const mongoose = require('../db');
const Schema = mongoose.Schema;

const CommentThirdSchema = new Schema(
    {

    },
    { collection: 'restaurant_comment3' },
);

module.exports = mongoose.model('CommentThird', CommentThirdSchema);