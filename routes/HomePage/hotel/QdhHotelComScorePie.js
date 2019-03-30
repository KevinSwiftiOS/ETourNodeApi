// 获取全部酒店 评分分布， 并生成 饼图
var express = require('express');
var logger = require('log4js').getLogger("index");
var router = express.Router();
var funcs = require('../../../commons/common');
var HotelCommentModel = require('../../../dbs/HotelCommentModel');
var HotelComment = HotelCommentModel.HotelComment

// 获取全部酒店 评分分布， 并生成 饼图

router.post('/', async function (req, res, next) {
    var currDate = new Date();
    var Year = currDate.getFullYear();
    var Month = currDate.getMonth(); // 为了保证 信息的完整新， 都会 获取到当前月份的前一个月
    var triDate = currDate.getDate() - 3; // 为了保证 信息的完整新， 都会 获取到当前月份的前一个月
    var endDate = Year + '-' + Month.toString().padStart(2, '0') + '-' + triDate.toString().padStart(2, 0);
    var startDate = funcs.getDay(currDate, 93);
    var commentScoreSection = ['(0.0, 3.0]', '(3.0, 4.0]', '(4.0, 4.3]', '(4.3, 4.7]', '(4.7, 5.0]']
    var commentNumType = ['(0, 5]', '(5, 15]', '(15, 30]', '(30, 70]', '(70, 1000]']
    var badScore = await HotelComment.aggregate([
        {$match: {comment_time: {$gte: startDate, $lte: endDate}}},
        {$group: {_id: "$shop_show_name", commentScore: {$avg: "$comment_weighted_grade"}, 'commentNum': {$sum: 1}}},
        {$match: {commentNum: {$gte: 10}, commentScore: {$gt: 0.0, $lte: 3.0}}},
        {$project: {value: "$commentScore", _id: 0}}
    ]);
    var midScore = await HotelComment.aggregate([
        {$match: {comment_time: {$gte: startDate, $lte: endDate}}},
        {$group: {_id: "$shop_show_name", commentScore: {$avg: "$comment_weighted_grade"}, 'commentNum': {$sum: 1}}},
        {$match: {commentNum: {$gte: 10}, commentScore: {$gt: 3.0, $lte: 4.0}}},
        {$project: {value: "$commentScore", _id: 0}}
    ]);
    var goodScore = await HotelComment.aggregate([
        {$match: {comment_time: {$gte: startDate, $lte: endDate}}},
        {$group: {_id: "$shop_show_name", commentScore: {$avg: "$comment_weighted_grade"}, 'commentNum': {$sum: 1}}},
        {$match: {commentNum: {$gte: 10}, commentScore: {$gt: 4.0, $lte: 4.3}}},
        {$project: {value: "$commentScore", _id: 0}}
    ]);
    var betterScore = await HotelComment.aggregate([
        {$match: {comment_time: {$gte: startDate, $lte: endDate}}},
        {$group: {_id: "$shop_show_name", commentScore: {$avg: "$comment_weighted_grade"}, 'commentNum': {$sum: 1}}},
        {$match: {commentNum: {$gte: 10}, commentScore: {$gt: 4.3, $lte: 4.7}}},
        {$project: {value: "$commentScore", _id: 0}}
    ]);
    var bestScore = await HotelComment.aggregate([
        {$match: {comment_time: {$gte: startDate, $lte: endDate}}},
        {$group: {_id: "$shop_show_name", commentScore: {$avg: "$comment_weighted_grade"}, 'commentNum': {$sum: 1}}},
        {$match: {commentNum: {$gte: 10}, commentScore: {$gt: 4.7, $lte: 5.0}}},
        {$project: {value: "$commentScore", _id: 0}}
    ]);
    var badComNum = await HotelComment.aggregate([
        {$match: {comment_time: {$gte: startDate, $lte: endDate}}},
        {$group: {_id: "$shop_show_name", 'commentNum': {$sum: 1}}},
        {$match: {commentNum: {$gt: 0.0, $lte: 5.0}}},
        {$project: {value: "$commentNum", _id: 0}}
    ]);
    var midComNum = await HotelComment.aggregate([
        {$match: {comment_time: {$gte: startDate, $lte: endDate}}},
        {$group: {_id: "$shop_show_name", 'commentNum': {$sum: 1}}},
        {$match: {commentNum: {$gt: 5.0, $lte: 15.0}}},
        {$project: {value: "$commentNum", _id: 0}}
    ]);
    var goodComNum = await HotelComment.aggregate([
        {$match: {comment_time: {$gte: startDate, $lte: endDate}}},
        {$group: {_id: "$shop_show_name", 'commentNum': {$sum: 1}}},
        {$match: {commentNum: {$gt: 15.0, $lte: 30.0}}},
        {$project: {value: "$commentNum", _id: 0}}
    ]);
    var betterComNum = await HotelComment.aggregate([
        {$match: {comment_time: {$gte: startDate, $lte: endDate}}},
        {$group: {_id: "$shop_show_name", 'commentNum': {$sum: 1}}},
        {$match: {commentNum: {$gt: 30.0, $lte: 70.0}}},
        {$project: {value: "$commentNum", _id: 0}}
    ]);
    var bestComNum = await HotelComment.aggregate([
        {$match: {comment_time: {$gte: startDate, $lte: endDate}}},
        {$group: {_id: "$shop_show_name", 'commentNum': {$sum: 1}}},
        {$match: {commentNum: {$gt: 70.0, $lte: 1000.0}}},
        {$project: {value: "$commentNum", _id: 0}}
    ]);

    res.send({
        code: 0,
        message: "",
        data: {
            scoreList: [  //  评论分数区间段
                {
                    name: commentScoreSection[0],
                    value: badScore.length
                },
                {
                    name: commentScoreSection[1],
                    value: midScore.length
                },
                {
                    name: commentScoreSection[2],
                    value: goodScore.length
                },
                {
                    name: commentScoreSection[3],
                    value: betterScore.length
                },
                {
                    name: commentScoreSection[4],
                    value: bestScore.length
                },
            ],
            numberList: [  //  评论分数区间段
                {
                    name: commentNumType[0],
                    value: badComNum.length
                },
                {
                    name: commentNumType[1],
                    value: midComNum.length
                },
                {
                    name: commentNumType[2],
                    value: goodComNum.length
                },
                {
                    name: commentNumType[3],
                    value: betterComNum.length
                },
                {
                    name: commentNumType[4],
                    value: bestComNum.length
                },
            ]
        }
    })
})
module.exports = router;
