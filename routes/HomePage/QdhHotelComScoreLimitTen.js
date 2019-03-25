// 查询本季度 评分比较靠前的前十名
var express = require('express');
var logger = require('log4js').getLogger("index");
var router = express.Router();
var funcs = require('./../../commons/common');
var HotelCommentModel = require('./../../dbs/HotelCommentModel');
var HotelComment = HotelCommentModel.HotelComment;

// 获取景点 本年评-论数量

router.post('/', function (req, res, next) {

    var currDate = new Date();
    var year = currDate.getFullYear();
    var month = currDate.getMonth(); // 为了保证 信息的完整新， 都会 获取到当前月份的前一个月
    var now_date;  // 当前日期
    var curr_season =year.toString() + '-' +  funcs.get_curr_season(month + 1);     // 获取当前季度
    var curr_month = year.toString() + '-' + month.toString().padStart(2, '0'); // 获取当前月份
    now_date = curr_season; // 当前以 本季度进行查询

    HotelComment.aggregate([
        {
            $match: {
                "data_region": "千岛湖",
                "data_source": "酒店",
                "comment_season": now_date,
                "comment_grade": {$ne: 0},
            }
        },
        {
            $group: {
                _id: "$shop_show_name",
                comment_weighted_grade: {$avg: "$comment_weighted_grade"},
                comment_num: {$sum: 1}
            }
        },
        {$project: {"_id": 1, "commentNumber": "$comment_num", "commentScore": "$comment_weighted_grade"}},
        {$sort: {commentScore: -1}},
        {$limit: 10}
    ]).exec(function (err, result) {
        var data = {}
        for(var i = 0; i < result.length; i++) {
            result[i].commentScore = parseFloat((result[i].commentScore).toFixed(2));
        }
        data['hotellist'] = result;
        res.send({
            "code": 0,
            "message": "",
            "data": data
        });
    })
})
module.exports = router;

