var express = require('express');
var router = express.Router();
var logger = require('log4js').getLogger("index");
var CommentModels = require('./../dbs/CommentModels');
var Comment = CommentModels.Comment;
var funcs = require('./../commons/common');

//千岛湖景点详情页面 返回本月评论数 本月评分 评论数的排名 评分排名 前端去做
router.post('/', function (req, res, next) {

    var year = new Date().getFullYear();
    var month = new Date().getMonth() + 1;
    var now_month = year.toString() + '-' + (funcs.PrefixInteger(month, 2)).toString();


    //获取景区名字 景区名字
    Comment.aggregate([
        {
            $match: {
                "data_source": "景点",
                "comment_month": now_month,
                "data_region_search_key":'千岛湖',
            }
        },
        {
            $group: {
                _id: "$shop_name_search_key",
                "commentScore": {"$avg": "$comment_score"},
                "commentNumber": {"$sum": 1}
            },

        },
        {$sort: {commentNumber: -1}},

    ]).exec(function (err, result) {
        res.send({
            "code":0,
            "message":"",
            "data":{
                "list":result
            }
        })
    })
});

module.exports = router;
