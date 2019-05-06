var express = require('express');
var logger = require('log4js').getLogger("index");
var jwt = require('jsonwebtoken');
var router = express.Router();
var UserModels = require('./../dbs/UserModels');
var User = UserModels.User;

var HotelRegionModel = require('../dbs/hotel/HotelRegionModel')
var HotelRegion = HotelRegionModel.HotelRegion


//引进HotelRegionModel表
// 返回当前等级的所有酒店，并包含分页功能
function find_Hotel_Rank(matchDict) {
    var promise = new Promise(function (resolve, reject) {
        HotelRegion.aggregate([
            {$match: matchDict['match']},
            {$project: {_id: 0, rate: '$shop_rate', name: 1, address: 1, commentNumber: 1, commentScore: 1, lng: 1, lat: 1}}
        ]).exec(function (err, result) {
            if (err)
                reject(err);
            else {
                resolve(result);
            }
        })
    })
    return promise;
}
//获取不同等级酒店展示 == hotelmap 首页展示
router.post('/', function (req, res, next) {
    var hotelRate = req.body.hotelrate;
    matchDict = {}
    if (hotelRate == '全部酒店') {
        // {$match: {'shop_rate': hotelRate, 'table_type': 'mixed_hotel_shop'}},
        matchDict['match'] = {'table_type': 'mixed_hotel_shop'}
    } else if (hotelRate == '星级酒店') {
        matchDict['match'] = {'table_type': 'mixed_hotel_shop', 'shop_rate': /星级/,}
    } else
        matchDict['match'] = {'shop_rate': hotelRate, 'table_type': 'mixed_hotel_shop'}
    var hotel_promise = new Promise(function (resolve, reject) {
        var db_promise = find_Hotel_Rank(matchDict);
        db_promise.then(function (result) {
            if (result.length == 0) {

            } else {
                var list = [];
                for(var i = 0; i < result.length;i++){
                    list.push(result[i]);
                }
                resolve(list)
            }
        }).catch(function (err) {
            logger.error('酒店详情接口：spotdetailcompared 错误：' + err);
            res.send({
                "code": 12,
                "message": "查询发生错误",
                "data": {}
            })
        })
    })
    hotel_promise.then(function (list) {
        res.send({
            "code": 0,
            "message": "",
            "data": {
                "list": list
            }
        })
    })
});

module.exports = router;
