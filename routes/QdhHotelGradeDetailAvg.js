var express = require('express');
var logger = require('log4js').getLogger("index");
var jwt = require('jsonwebtoken');
var router = express.Router();
var UserModels = require('./../dbs/UserModels');
var User = UserModels.User;

var HotelRegionModel = require('./../dbs/HotelRegionModel')
var HotelRegion = HotelRegionModel.HotelRegion

//酒店详细平均评分获取，用于页面雷达图的展示
/* 'comment_location_grade': {$ne: 0},
                    'comment_service_grade': {$ne: 0},
                    'comment_facility_grade': {$ne: 0},*/
function find_in_db(hotelrate) {
    var promise = new Promise(function (resolve, reject) {
        HotelRegion.aggregate([
            {
                $match: {
                    'shop_rate': hotelrate,
                    'comment_grade': {$ne: 0},
                    'comment_health_grade': {$ne: 0},

                }
            },
            {
                $group: {
                    _id: '$shop_rate',
                    commentScore: {$avg: '$commentScore'},
                    comment_health_grade: {$avg: '$comment_health_grade'},
                    comment_location_grade: {$avg: '$comment_location_grade'},
                    comment_service_grade: {$avg: '$comment_service_grade'},
                    comment_facility_grade: {$avg: '$comment_facility_grade'}
                }
            },
            {
                $project: {
                    _id: 0,
                    commentScore: 1,
                    comment_health_grade:1,
                    comment_location_grade: 1,
                    comment_service_grade: 1,
                    comment_facility_grade: 1
                }
            }
        ]).exec(function (err, result) {
            if (err)
                reject(err);
            else
                resolve(result);
        })
    })
    return promise;
}

router.post('/', function (req, res, next) {
    var hotelrate = req.body.hotelrate;
    var comparedrate = req.body.comparedrate;
    var hotelrates = [];
    hotelrates.push(hotelrate);
    if(comparedrate != ''){
        hotelrates.push(comparedrate);
    }
    var num_axis = [];
    var hotel_promise = new Promise(function (resolve, reject) {
        hotelrates.forEach((hotelrank, rankIndex) => {
            var num_region_res = {}
            var db_promise = find_in_db(hotelrank);
            db_promise.then(function (result) {
                if(result.length == 0){

                }
                else{
                    for (var j = 0; j < result.length; j++) {
                        result[j].commentScore =  parseFloat((result[j].commentScore).toFixed(2));
                        result[j].comment_facility_grade =  parseFloat((result[j].comment_facility_grade).toFixed(2));
                        result[j].comment_health_grade =  parseFloat((result[j].comment_health_grade).toFixed(2));
                        result[j].comment_location_grade =  parseFloat((result[j].comment_location_grade).toFixed(2));
                        result[j].comment_service_grade =  parseFloat((result[j].comment_service_grade).toFixed(2));
                        num_region_res['hotelrate'] = hotelrank;
                        num_region_res['data'] = result[j];
                        num_axis.push(num_region_res);
                        if (num_axis.length == hotelrates.length) {
                            var axis = {};
                            axis['numAxis'] = num_axis;
                            resolve(axis);
                        }
                    }
                }
            }).catch(function (err) {
                logger.error('千岛湖景点单周或单月查询出错 接口：spotdetail 错误：' + err);
                res.send({
                    "code": 12,
                    "message": "查询发生错误",
                    "data": {}
                });
            })
        })
    })
    hotel_promise.then(function (axis) {
        res.send({
            "code": 0,
            "message": "",
            "data": axis
        })
    })
});

module.exports = router;
