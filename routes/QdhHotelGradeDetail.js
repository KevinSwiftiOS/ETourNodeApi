var express = require('express');
var logger = require('log4js').getLogger("index");
var jwt = require('jsonwebtoken');
var router = express.Router();
var UserModels = require('./../dbs/UserModels');
var User = UserModels.User;

var HotelRegionModel = require('../dbs/hotel/HotelRegionModel')
var HotelRegion = HotelRegionModel.HotelRegion


//酒店详细评分获取，用于页面雷达图的展示

router.post('/', function (req, res, next) {
    var hotelnameArray = req.body.hotelname;
    var hotelname = hotelnameArray[0];
    HotelRegion.aggregate([
        {$match: {'name': hotelname}},
        {
            $project: {
                _id: 0,
                commentScore: 1,
                comment_health_grade: 1,
                comment_location_grade: 1,
                comment_service_grade: 1,
                comment_facility_grade: 1
            }
        },
    ]).exec(function (err, result) {
        if (err) {
            logger.error('千岛湖景区景点查询发生错误 接口：qdhspotlist 错误：' + err);
            res.send({
                "code": 12,
                "message": "查询发生错误",
                "data": {}
            })
        } else {
            var list = [];
            for (var i = 0; i < result.length; i++) {
                list.push(result[i]);
            }
            res.send({
                "code": 0,
                "message": "",
                data: {
                    "list": list
                }
            })
        }
    })

});

module.exports = router;
