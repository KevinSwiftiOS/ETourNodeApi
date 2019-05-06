/**
 * Created by hcnucai on 2016/11/19.
 */
var mongoose = require('../db');
var Schema =  mongoose.Schema;
var hotelcommentfeature = new Schema({
        data_website:String,
        data_region:String,
        data_source:String,
    },
    { collection: 'hotel_comment_second' });
exports.HotelCommentTrain = mongoose.model("HotelCommentTrain", hotelcommentfeature);