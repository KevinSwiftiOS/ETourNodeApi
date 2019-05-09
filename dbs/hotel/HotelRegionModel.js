/**
 * Created by hcnucai on 2016/11/19.
 */
const mongoose = require('../db');
const Schema =  mongoose.Schema;
const hotelRegionSchema = new Schema({
        //定义字段
        id:String,
        address:String,
        lng:Number,
        lat:Number,
        name:String,
        shop_rate:String,
        commentScore:Number,
        commentNumber:Number,
        comment_service_grade: Number,
            comment_health_grade: Number,
            comment_location_grade: Number,
            comment_facility_grade: Number,
            shop_rate:String
    },
    { collection: 'hotel_shop' });

// exports.HotelRegion = mongoose.model("HotelRegion", hotelregion);
module.exports = mongoose.model('HotelRegion', hotelRegionSchema);