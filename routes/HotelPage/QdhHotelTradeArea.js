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
    // console.log(req.query.tradearea, '输出千岛湖风景区')
    var tradearea = req.query.tradearea;
    console.log(tradearea, '输出上去');
    // console.log(tradearea, '后台输出这些东西')
    // var hotelRates = ['五星级', '四星级', '豪华型', '高档型', '三星级', '舒适型', '经济型', '客栈民宿'];

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
    var currpage = parseInt(req.query.currpage);
    var tradearea = req.query.tradearea;
    var hotelrate = req.query.hotelrate;
    var pageSize = parseInt(req.query.pageSize);
    var sortWay = req.query.sortWay; //'commentNumber'; //req.body.sortway;

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

// 获取景点 本年评-论数量
function find_limit_hotel(startDate, endDate, sortWay, commentNumLimit, matchObj) {
    var sortDict = {}
    switch (sortWay) {
        case "前十名":
            sortDict['sortway'] = {commentScore: -1}
            break;
        case "后十名":
            sortDict['sortway'] = {commentScore: 1}
            break;
    }
    var promise = new Promise(function (resolve, reject) {
        HotelComment.aggregate([
            {
                $match: {
                    'comment_time': {$gte: startDate, $lte: endDate},
                    'comment_grade': {$ne: 0},
                    'shop_rate': matchObj['shop_rate'],
                    'tradeArea': matchObj['tradearea']
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
            {$match: {commentNumber: commentNumLimit['limitnum']}},
            {$sort: sortDict['sortway']},
            {$limit: 10},
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
/*
* 获取酒店排行榜
* */
router.post('/hoteltenlimit', function (req, res, next) {

    var tradearea = req.query.tradearea;
    var hotelrate = req.query.hotelrate;

    var currDate = new Date();
    var Year = currDate.getFullYear();
    var Month = currDate.getMonth(); // 为了保证 信息的完整新， 都会 获取到当前月份的前一个月
    var triDate = currDate.getDate() - 3; // 为了保证 信息的完整新， 都会 获取到当前月份的前一个月
    var endDate = Year + '' + Month.toString().padStart(2, '0') + '' + triDate.toString().padStart(2, 0);
    var startDate = funcs.getDay(currDate, 93);
    var commentNumLimit = {}
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


    if (Month == 1 || Month == 2 || Month == 12) {
        commentNumLimit['limitnum'] = {$gte: 40};
    } else if (Month == 8 || Month == 9 || Month == 10) {
        commentNumLimit['limitnum'] = {$gte: 80};
    } else {
        commentNumLimit['limitnum'] = {$gte: 60};
    }

    var sortWays = ['前十名', '后十名']

    var hotel_promise = new Promise(function (resolve, reject) {
        var hotelrank = {};
        var endSearchFlag = 0;

        sortWays.forEach((sortway) => {
            var db_promise = find_limit_hotel(startDate, endDate, sortway, commentNumLimit, matchObj);
            db_promise.then(function (result) {
                if (result.length == 0) {

                } else {
                    for (var i = 0; i < result.length; i++) {
                        result[i].commentScore = parseFloat((result[i].commentScore).toFixed(2));
                    }
                    if (sortway == '前十名') {
                        hotelrank['goodList'] = result;
                        endSearchFlag++;
                    } else if (sortway == '后十名') {
                        hotelrank['badList'] = result.reverse(); // 将排在 后十名 的 颠倒
                        endSearchFlag++;
                    }

                    if (endSearchFlag == 2) {
                        resolve(hotelrank);
                    }
                }
            }).catch(function (err) {
                logger.error('千岛湖 酒店排行前十 和后十名  接口：api/homepage/hotelrank 错误：' + err);
                res.send({
                    "code": 12,
                    "message": "查询发生错误",
                    "data": {}
                })
            })
        })
    })
    hotel_promise.then(function (hotelrank) {
        res.send({
            "code": 0,
            "message": "",
            "data": {
                "hotelrank": hotelrank
            }
        })
    })
});
module.exports = router;