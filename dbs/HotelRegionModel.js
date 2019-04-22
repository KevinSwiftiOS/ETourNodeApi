/**
 * Created by hcnucai on 2016/11/19.
 */
var mongoose = require('./db');
var Schema =  mongoose.Schema;
var hotelregion = new Schema({
        //定义字段
        id:String,
        address:String,
        lng:Number,
        lat:Number,
        name:String
    },
    { collection: 'hotel_shop' });

exports.HotelRegion = mongoose.model("HotelRegion", hotelregion);