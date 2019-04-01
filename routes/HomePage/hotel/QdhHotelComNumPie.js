// 获取全部酒店 评分分布， 并生成 饼图
var express = require('express');
var logger = require('log4js').getLogger("index");
var router = express.Router();
var funcs = require('../../../commons/common');
var HotelCommentModel = require('../../../dbs/HotelCommentModel');
var HotelComment = HotelCommentModel.HotelComment

function find_in_db(Grade, startDate, endDate) {
    var section = {}
    switch (Grade) {
        case "差评":
            section['match'] = {$gt: 0.0, $lte: 15.0};
            break;
        case "中评":
            section['match'] = {$gt: 15.0, $lte: 40.0};
            break;
        case "好评":
            section['match'] = {$gt: 40.0, $lte: 70.0};
            break;

        case "较好":
            section['match'] = {$gt: 70.0, $lte: 1000.0};
            break;
    }
    var promise = new Promise(function (resolve, reject) {
        HotelComment.aggregate([
            {$match: {comment_time: {$gte: startDate, $lte: endDate}}},
            {$group: {_id: "$shop_show_name", 'commentNum': {$sum: 1}}},
            {$match: {commentNum: section['match']}}
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

// 获取全部酒店 评分分布， 并生成 饼图
router.post('/', async function (req, res, next) {
    var currDate = new Date();
    var Year = currDate.getFullYear();
    var Month = currDate.getMonth(); // 为了保证 信息的完整新， 都会 获取到当前月份的前一个月
    var triDate = currDate.getDate() - 3; // 为了保证 信息的完整新， 都会 获取到当前月份的前一个月
    var endDate = Year + '-' + Month.toString().padStart(2, '0') + '-' + triDate.toString().padStart(2, 0);
    var startDate = funcs.getDay(currDate, 93);
    var commentNumType = ['(0, 20]', '(20, 50]','(50, 0]', '(90, 1000]']
    var commentGrades = ['差评', '中评', '好评', '较好'];
    var hotel_promise = new Promise(function (resolve, reject) {
        var numberList = [
            {
                "name": "",
                "value": 0
            },
            {
                "name": "",
                "value": 0
            },
            {
                "name": "",
                "value": 0
            },
            {
                "name": "",
                "value": 0
            }
        ];
        var findCount = 0;
        commentGrades.forEach((grade, gradeIndex) => {
            var db_promise = find_in_db(grade, startDate, endDate);
            db_promise.then(function (result) {
                findCount += 1;
                numberList[gradeIndex].name = commentNumType[gradeIndex];
                numberList[gradeIndex].value = result.length;
                if (findCount == commentGrades.length) {
                    resolve(numberList);
                }
            }).catch(function (err) {
                logger.error('千岛湖酒店单季度评论数量 接口：numpiecharts 错误：' + err);
                res.send({
                    "code": 12,
                    "message": "查询发生错误",
                    "data": {}
                });
            })
        })
    }).then(function (numberList) {
        res.send({
            "code": 0,
            "message": "",
            "data": {
                numberList: numberList
            }
        })
    })
})
module.exports = router;
