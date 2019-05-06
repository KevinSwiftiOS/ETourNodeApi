var express = require('express');
var router = express.Router();
var logger = require('log4js').getLogger("index");
var HotelRegionModel = require('../dbs/hotel/HotelRegionModel')
var HotelRegion = HotelRegionModel.HotelRegion
//引进HotelRegionModel表

router.post('/', function (req, res, next) {
    var hotelname = req.body.hotelname;
    //
    HotelRegion.aggregate([
        {$match: {'shop_rate': hotelname}},
        {$project: {_id: 0, comment_health_grade: 1, comment_location_grade : 1, comment_service_grade : 1, comment_facility_grade : 1}},
    ]).exec(function (err, result) {
        if (err) {
            logger.error('千岛湖景区景点查询发生错误 接口：qdhspotlist 错误：' + err);
            res.send({
                "code": 12,
                "message": "查询发生错误",
                "data": {}
            })
        }
        if(result.length == 21) {
            res.send({
                "code": 0,
                "message": "",
                "data": {
                    "list": result
                }
            })
        }else{

            var list = [];
            for(var i = 0; i < result.length;i++){
                list.push(result[i]);
            }
            res.send({
                "code":0,
                "message":"",
                data:{
                    "list":list
                }
            })
        }
    });


});
module.exports = router;
