var express = require('express');
var logger = require('log4js').getLogger("index");
var jwt = require('jsonwebtoken');
var router = express.Router();
var CommentModels = require('../../../dbs/spot/CommentModels');
var funcs = require('../../../commons/common');
var Comment = CommentModels.Comment;

//登录接口
router.post('/', function(req, res) {
    try {
        var lastThreeDate = funcs.getDay(new Date(), 3);
        //向前减去93天
        var lastSeasonDate = funcs.getDay(new Date(), 93);
        var promise_1 = new Promise(function (resolve, reject) {
            Comment.aggregate([
                {
                    $match: {
                        "data_source": "景点",
                        "comment_time": {$gte: lastSeasonDate, $lte: lastThreeDate}

                    }
                },
                {
                    $group: {
                        _id: "$data_region_search_key",
                        "commentScore": {"$avg": "$comment_score"},
                        "commentNumber": {"$sum": 1}
                    },

                },

                {$sort: {commentScore: -1}},
                {$limit: 10},
                {
                    $project: {
                        _id: 1, commentNumber: 1,
                        commentScore: {
                            $divide: [
                                {
                                    $subtract: [
                                        {$multiply: ['$commentScore', 100]},
                                        {$mod: [{$multiply: ['$commentScore', 100]}, 1]}
                                    ]
                                },
                                100]
                        }
                    }
                }
            ]).exec(function (err, result) {
                resolve(result);
            });
        });
        promise_1.then(function (spotlist) {
            Comment.aggregate([
                {
                    $match: {
                        "data_source": "景点",
                        "data_region": "千岛湖",
                        "comment_time": {$gte: lastSeasonDate, $lte: lastThreeDate}

                    }
                },
                {
                    $group: {
                        _id: "$shop_name_search_key",
                        "commentScore": {"$avg": "$comment_score"},
                        "commentNumber": {"$sum": 1}
                    },

                },

                {$sort: {commentScore: -1}},
                {$limit: 10},
                {
                    $project: {
                        _id: 1, commentNumber: 1,
                        commentScore: {
                            $divide: [
                                {
                                    $subtract: [
                                        {$multiply: ['$commentScore', 100]},
                                        {$mod: [{$multiply: ['$commentScore', 100]}, 1]}
                                    ]
                                },
                                100]
                        }
                    }
                }
            ]).exec(function (err, result) {
                res.send({
                    "code": 0,
                    "list": spotlist,
                    "qdhlist": result,
                    "message": ""
                })
            });
        });
    }catch (error) {
        logger.error('景区景点排行（POST) 近3个月的统计：spotrank 错误：' + err);
        res.send({
            "code": 12,
            "message": "查询发生错误",
            "data": {}
        });
    }
});


module.exports = router;
