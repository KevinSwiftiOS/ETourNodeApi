var express = require('express');
var logger = require('log4js').getLogger("index");
var jwt = require('jsonwebtoken');
var router = express.Router();
var HotelRegionModel = require('../../dbs/HotelRegionModel');
var funcs = require('../../commons/common');
var HotelRegion = HotelRegionModel.HotelRegion;
var HotelCommentModel = require('../../dbs/HotelCommentModel');
var HotelComment = HotelCommentModel.HotelComment;

//登录接口


function find_in_db(tradeArea) {

    var promise = new Promise(function (resolve, reject) {
        if (tradeArea == '全部') {
            HotelRegion.aggregate([
                {
                    $match: {
                        "table_type": "mixed_hotel_shop"
                    }
                },
                {
                    $group: {
                        _id: "$shop_rate",
                        "countNum": {"$sum": 1}
                    },
                }
            ]).exec(function (err, result) {
                if (err)
                    reject(err);
                else {
                    resolve(result);
                }
            })
        } else {
            HotelRegion.aggregate([
                {
                    $match: {
                        "table_type": "mixed_hotel_shop",
                        "tradeArea": tradeArea
                    }
                },
                {
                    $group: {
                        _id: "$shop_rate",
                        "countNum": {"$sum": 1}
                    },
                }
            ]).exec(function (err, result) {
                if (err)
                    reject(err);
                else {
                    resolve(result);
                }
            })
        }
    })
    return promise;
}

/*
* 获取同商圈的酒店个数
* */
router.post('/hotelratecount', async (req, res) => {
    var tradearea = req.query.tradearea;
    console.log(tradearea, '输出上去');
    var hotel_promise = new Promise(function (resolve, reject) {
        var db_promise = find_in_db(tradearea);
        db_promise.then(function (result) {
            if (result.length == 0) {
                res.send({
                    "code": 0,
                    "message": "",
                    "data": {}
                })
            } else
                resolve(result)

        }).catch(function (err) {
            logger.error('景区详情比较发生错误 接口：spotdetailcompared 错误：' + err);
            res.send({
                "code": 12,
                "message": "查询发生错误",
                "data": {}
            })
        })
    }).then(function (result) {
        res.send({
            "code": 0,
            "message": "",
            "data": {
                "hotelrates": result
            }
        })
    })
});
/*
* 获取酒店列表
* */
router.post('/hotelshoplist', function (req, res, next) {
    var currpage = parseInt(req.body.currpage);
    var tradearea = req.body.tradearea;
    var hotelrate = req.body.hotelrate;
    var pageSize = parseInt(req.body.pageSize);
    var sortWay = req.body.sortWay;
    console.log(currpage, tradearea, hotelrate, pageSize, sortWay)
    var matchObj = {}
    if (hotelrate != '全部') {
        matchObj['shop_rate'] = hotelrate;
    } else {
        matchObj['shop_rate'] = {$ne: ""}
    }

    if (tradearea != '全部') {
        matchObj['tradearea'] = tradearea;
    } else {
        matchObj['tradearea'] = {$ne: "0"}
    }

    if (sortWay == "commentScore") {
        matchObj['sortway'] = {$sort: {commentScore: -1}}
    } else if (sortWay == "commentNum") {
        matchObj['sortway'] = {$sort: {commentNumber: -1}}
    } else if (sortWay == "comment_health_grade") {
        matchObj['sortway'] = {$sort: {comment_health_grade: -1}}
    } else if (sortWay == "comment_service_grade") {
        matchObj['sortway'] = {$sort: {comment_location_grade: -1}}
    }

    console.log(matchObj, '输出match');
    HotelRegion.aggregate([
        {
            $match: {
                'shop_rate': matchObj['shop_rate'],
                'tradeArea': matchObj['tradearea'],
                "table_type": "mixed_hotel_shop"
            }
        },
        matchObj['sortway'],
        {
            $project: {
                _id: 0,
                name: 1,
                address: 1,
                shop_rate: 1,
                commentScore: 1,
                commentNumber: 1,
                comment_service_grade: 1,
                comment_health_grade: 1,
                comment_location_grade: 1,
                comment_facility_grade: 1
            }
        },
        {$skip: pageSize * (currpage - 1)},
        {$limit: pageSize}
    ]).exec(function (err, result) {
        if (err) {
            logger.error('千岛湖景区景点查询发生错误 接口：qdhspotlist 错误：' + err);
            res.send({
                "code": 12,
                "message": "查询发生错误",
                "data": {}
            })
        }
        console.log(result, '输出结果')
        if (result.length == 0) {
            res.send({
                "code": 0,
                "message": "",
                "data": {
                    "list": result
                }
            })
        } else {
            console.log(result, '输出结果')
            res.send({
                "code": 0,
                "message": "",
                data: {
                    "hotellist": result
                }
            })
        }
    })
});
/*
* 获取酒店排行榜
* */
router.post('/hoteltenlimit', function (req, res, next) {
    var endDate = funcs.getDay(new Date(), 3);
    var startDate = funcs.getDay(new Date(), 93);
    HotelComment.aggregate([
        {
            $match: {
                'comment_time': {$gte: startDate, $lte: endDate},
                'comment_grade': {$ne: 0}
            }
        },
        {
            $group: {
                _id: '$shop_show_name',
                'commentScore': {$avg: '$comment_weighted_grade'},
                'commentNumber': {$sum: 1},
                'shopRate': {$first: '$shop_rate'}
            }
        },
        {$sort: {'commentNumber': -1}},
        {$limit: 10},
    ]).exec(function (err, result) {
        if (err) {
            logger.error('千岛湖景区景点查询发生错误 接口：qdhspotlist 错误：' + err);
            res.send({
                "code": 12,
                "message": "查询发生错误",
                "data": {}
            })
        }
        if (result.length == 0) {
            res.send({
                "code": 0,
                "message": "",
                "data": {
                    "list": result
                }
            })
        } else {
            for(var i = 0; i < result.length; i++) {
                result[i].commentScore = parseFloat((result[i].commentScore).toFixed(2));
            }
            res.send({
                "code": 0,
                "message": "",
                data: {
                    "hotelrank": result
                }
            })
        }
    })
});
module.exports = router;