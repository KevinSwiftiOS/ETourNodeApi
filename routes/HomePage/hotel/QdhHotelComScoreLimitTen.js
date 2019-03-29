// 查询本季度 评分比较靠前的前十名
var express = require('express');
var logger = require('log4js').getLogger("index");
var router = express.Router();
var funcs = require('./../../commons/common');
var HotelCommentModel = require('./../../dbs/HotelCommentModel');
var HotelComment = HotelCommentModel.HotelComment;

// 获取景点 本年评-论数量
function find_limit_hotel(startDate, endDate, sortWay) {
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
            {$match: {'comment_time': {$gte: startDate, $lte: endDate}, 'comment_grade': {$ne: 0}}},
            {$group: {_id: '$shop_show_name', 'commentScore': {$avg: '$comment_weighted_grade'}, 'commentNumber': {$sum: 1}, 'shopRate':{$first: '$shop_rate'}}},
            {$match: {commentNumber: {$gte: 50}}},
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

router.post('/', function (req, res, next) {


    var currDate = new Date();
    var Year = currDate.getFullYear();
    var Month = currDate.getMonth(); // 为了保证 信息的完整新， 都会 获取到当前月份的前一个月
    var triDate = currDate.getDate() - 3; // 为了保证 信息的完整新， 都会 获取到当前月份的前一个月
    var endDate = Year + '' + Month.toString().padStart(2, '0') + '' + triDate.toString().padStart(2, 0);
    var startDate = funcs.getDay(currDate, 93);

    var sortWays = ['前十名', '后十名']

    var hotel_promise = new Promise(function (resolve, reject) {
        var data = {};
        var endSearchFlag = 0;

        sortWays.forEach((sortway) => {
            var db_promise = find_limit_hotel(startDate, endDate, sortway);
            db_promise.then(function (result) {
                if(result.length == 0){

                } else {
                    for (var i = 0; i < result.length; i++) {
                        result[i].commentScore = parseFloat((result[i].commentScore).toFixed(2));
                    }
                    if (sortway == '前十名') {
                        data['goodList'] = result;
                        endSearchFlag++;
                    } else if (sortway == '后十名') {
                        data['badList'] = result.reverse(); // 将排在 后十名 的 颠倒
                        endSearchFlag++;
                    }

                    if (endSearchFlag == 2) {
                        resolve(data);
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
    hotel_promise.then(function (data) {
        res.send({
            "code": 0,
            "message": "",
            "data": data
        })
    })
})
module.exports = router;
