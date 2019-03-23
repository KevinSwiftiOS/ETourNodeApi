// 获取全部酒店 评分分布， 并生成 饼图
var express = require('express');
var logger = require('log4js').getLogger("index");
var router = express.Router();
var funcs = require('./../../commons/common');
var HotelRegionModel = require('./../../dbs/HotelRegionModel');
var HotelRegion = HotelRegionModel.HotelRegion


//HotelRegion
// 获取全部酒店 评分分布， 并生成 饼图

function diff_sort_type(commentScoreType) {
    var startScore, endScore;
    switch (commentScoreType) {
        case "较好":
            startScore = 0;
            endScore = 3;
            break;
        case "好":
            startScore = 3;
            endScore = 4;
            break;
        case "良":
            startScore = 4;
            endScore = 4.5;
            break;
        case "差":
            startScore = 4.5;
            endScore = 5;
            break;
    }
    console.log(startScore, endScore);
    var promise = new Promise(function (resolve, reject) {
        HotelRegion.find({
                "table_type": "mixed_hotel_shop",
                "commentScore": {$gte: startScore, $lte: endScore}
            } // .count()
        ).count().exec(function (err, result) {
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

    var commentScoreTypeArr = ["较好", "好", "良", "差"];
    var hotel_promise = new Promise(function (resolve, reject) {
        var hotelScoreCount = [];
        commentScoreTypeArr.forEach((commentScoreType) => {
            var db_promise = diff_sort_type(commentScoreType);
            db_promise.then(function (result) {
                if (result.length == 0) {

                } else {

                    hotelScoreCount.push({
                        comment_type: commentScoreType,
                        hotel_count: result
                    });

                    if (hotelScoreCount.length == commentScoreTypeArr.length) {
                        resolve(hotelScoreCount);
                    }
                }
            }).catch(function (err) {
                logger.error('查询评分数量 生成 饼图：qdhhotelcomscorepie 错误：' + err);
                res.send({
                    "code": 12,
                    "message": "查询发生错误",
                    "data": {}
                })
            })
        })
    })
    hotel_promise.then(function (hotelScoreCount) {
        var data = {};
        data['hotelScoreCount'] = hotelScoreCount;
        res.send({
            "code": 0,
            "message": "",
            "data": data
        })
    })


})
module.exports = router;
