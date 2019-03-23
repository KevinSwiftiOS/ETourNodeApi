//
var express = require('express');
var logger = require('log4js').getLogger("index");
var router = express.Router();
var funcs = require('./../../commons/common');
var CommentModels = require('./../../dbs/CommentModels');
var Spot_Comment = CommentModels.Comment;

// 获取景点 本年评-论数量

// new

router.post('/', function (req, res, next) {

    var currDate = new Date();
    var year = currDate.getFullYear();
    var month = currDate.getMonth(); // 为了保证 信息的完整新， 都会 获取到当前月份的前一个月
    var now_date;  // 当前日期
    var start_date;  // 开始日期
    var time_list;
    var time_search_key = "月";

    now_date = year.toString() + "-" + (funcs.PrefixInteger(month, 2)).toString().padStart(2, '0');
    start_date = (year - 1).toString() + '-' + (funcs.PrefixInteger(month, 2)).toString().padStart(2, '0');
    time_list = funcs.get_time_list(start_date, now_date, time_search_key);

    var data = {};
    var num_axis = [];

    Spot_Comment.aggregate([
        {
            $match: {
                "data_region" : "千岛湖",
                "data_source": "景点",
                'comment_month': {$gte: start_date, $lte: now_date}
            }
        },
        {$group: {_id: "$comment_month", month_cnt: {"$sum": 1}}},
        {$project: {"comment_month": "$_id", month_cnt: 1, "_id": 0}},
        {$sort: {comment_month: 1}}
    ]).exec(function (err, result) {
        var data = {}
        data['numAxis'] = result;
        data['xAxis'] = time_list;
        res.send({
            "code": 0,
            "message": "",
            "data": data
        });
    })
})
module.exports = router;
