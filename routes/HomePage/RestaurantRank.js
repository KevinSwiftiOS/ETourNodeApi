const express = require('express');
const comments = require('../../dbs/restaurant/RSComment');
const ourScore = require("../../dbs/restaurant/shops")
const router = express.Router();

var selectSeason = "";
// 获取当前月份
var nowMonth = new Date().getMonth() + 1;
// 添加分隔符“-”
var seperator = "-";
// 对月份进行处理，1-9月在前面添加一个“0”
if (nowMonth >= 1 && nowMonth <= 9) {
    nowMonth = "0" + nowMonth;
}
var nowDate = new Date().getFullYear();

if (nowMonth < 4) {
    var year = nowDate - 1;
    selectSeason = year.toString() + seperator + "04";
} else if (nowMonth < 7) {
    selectSeason = nowDate.toString() + seperator + "01";
} else if (nowMonth < 10) {
    selectSeason = nowDate.toString() + seperator + "02";
} else {
    selectSeason = nowDate.toString() + seperator + "03";
}

router.post('/rank', async (req, res) => {
    // 查询数据库，返回前TOP10的评论数最多的餐饮
                
var restaurantRankList = await comments.aggregate([
        {
            $match: {
                "comment_season": selectSeason
            }
        },
        {
            $group: {
                "_id": "$shop_name",
                totalNumber: {
                    $sum: 1
                }
            }
        },
        {
            $sort: {
                totalNumber: -1
            }
        },
        {
            $limit: 10
        },
    ]);
    // console.log(typeof restaurantRankList);
    res.send({
        code: 0,
        message: "",
        data: restaurantRankList,
    })
})

router.post('/badColum', async (req, res) => {
    // 查询数据库，返回最近一年内差评个数
    var end_month = nowMonth - 1;
    // 对月份进行处理，1-9月在前面添加一个“0”
    if (end_month >= 1 && end_month <= 9) {
        end_month = "0" + end_month;
    }
    var end_time = nowDate.toString() + seperator + end_month.toString();
    var start_year = nowDate - 1;
    var start_time = start_year.toString() + seperator + end_month.toString();

    var restaurantBadCommentNumber = await comments.aggregate([
        {
            $match: {
                comment_month: {
                    $gte: start_time,
                    $lte: end_time
                }
            }
        },
        {
            $group:{
                _id: "$comment_month",
            totalNumber: {
                $sum: 1
            }
            }
        },
        {
            $sort: {
                _id: 1
            }
        }
    ])
    // var xAxis = await comments.aggregate([
    //     {
    //         $match: {
    //             "comment_month": {
    //                 $gte: start_time,
    //                 $lte: end_time
    //             }
    //         }
    //     },
    //     {
    //         $project: {
    //             "_id": 0,
    //             "comment_month": 1
    //         }
    //     }
    // ])
    res.send({
        code: 0,
        message: "",
        data: restaurantBadCommentNumber,
        // Xtime: xAxis
    })
})

router.post('/piechart', async (req, res) => {
    var badScore = await ourScore.aggregate([
        {$match: {
            "our_score":{
                $gt: '0',
                $lte: '3'
            }
        }},
        {$group:{
            _id: 'null',
            count:{
                $sum: 1
            }
        }}
    ]);
    var middleScore = await ourScore.aggregate([{
            $match: {
                "our_score": {
                    $gt: '3',
                    $lte: '4'
                }
            }
        },
        {
            $group: {
                _id: 'null',
                count: {
                    $sum: 1
                }
            }
        }
    ]);
    var goodScore = await ourScore.aggregate([{
            $match: {
                "our_score": {
                    $gt: '4',
                    $lte: '4.5'
                }
            }
        },
        {
            $group: {
                _id: 'null',
                count: {
                    $sum: 1
                }
            }
        }
    ]);
    var preScore = await ourScore.aggregate([{
            $match: {
                "our_score": {
                    $gte: '4.5',
                    $lte: '5'
                }
            }
        },
        {
            $group: {
                _id: 'null',
                count: {
                    $sum: 1
                }
            }
        }
    ]);

    var total = badScore[0].count + middleScore[0].count + goodScore[0].count + preScore[0].count;

    var bad = (badScore[0].count / total * 100).toFixed(2).toString() + '%';
    var middle = (middleScore[0].count / total * 100).toFixed(2).toString() + "%";
    var good = (goodScore[0].count / total * 100).toFixed(2).toString() + "%";
    var perfect = (preScore[0].count / total * 100).toFixed(2).toString() + "%"
    
    res.send({
        code: 0,
        message: "",
        data: [bad,middle,good,perfect]
    })
})
module.exports = router;