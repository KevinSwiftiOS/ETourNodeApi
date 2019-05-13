var express = require('express');
var router = express.Router();
var logger = require('log4js').getLogger("index");
var funcs = require('./../commons/common');
var CommentModels = require('./../dbs/spot/CommentModels');
var Comment = CommentModels.Comment;
//千岛湖动态接口
router.post('/', function (req, res, next) {

    //获取当前年份和月份
    var year = new Date().getFullYear();
    var month = new Date().getMonth() + 1;
    var local_year_month = year.toString() + "-" + (funcs.PrefixInteger(month, 2)).toString();

    Comment.aggregate([
        {$match: {'comment_month': local_year_month, 'data_source': '景点'}},
        {$group: {_id: "$data_region_search_key", "cnt": {"$sum": 1}, "avg": {"$avg": "$comment_score"}}}, //根据景区的search_key聚合
        {$sort: {cnt: -1}},

    ]).exec(function (err, result) {

        if (err) {
            logger.error('千岛湖动态查询失败 接口：qdhstate 错误：' + err);
            res.send({
                "code": 12,
                "message": "查询失败",
                "data": {}

            });
        }
        else {
            var cnt = 0;
            if (result.length == 0) {
                var dic = {
                    "monthCommentNumber": 0,
                    'monthCommentScore': "0",
                    'rank': "0"
                };

                res.send({
                    "data": dic,
                    "code": 0,
                    "message": ""
                });
            }
            else for (var i = 0; i < result.length; i++) {
                if (result[i]._id == '黄山' || result[i]._id == '三清山')
                    cnt++;
                if (result[i]._id == '千岛湖') {
                    var dic = {
                        "monthCommentNumber": result[i].cnt,
                        'monthCommentScore': (result[i].avg).toFixed(1),
                        'rank': ((i + 1) - cnt).toString() + "/16"
                    };

                    res.send({
                        "data": dic,
                        "code": 0,
                        "message": ""
                    })
                }
            }
        }
    })
})


module.exports = router;
