const express = require('express');
const comments = require('../../../dbs/restaurant/RSComment');
const router = express.Router();
const funcs = require('../../../commons/common');

router.post('/', async (req, res) => {
    // 查询数据库，返回前TOP10的评分最高和最低的餐饮
    var start_time = funcs.getDay(new Date(), 93);
    var end_time = funcs.getDay(new Date(), 3);


var goodList = await comments.aggregate([
        {
            $match: {
                comment_time: {
                     $gte: start_time,
                     $lte: end_time
                }
            }
        },
        {
            $group: {
                "_id": "$shop_name",
                "commentNumber":{"$sum": 1},
                "commentScore": {
                    "$avg": "$our_score"
                },
            }
        },
        {
            $match:{
                commentNumber : {
                    $gte: 100
                }
            }
        },
        {
            $sort:{commentScore: -1},
        },
        {
            $limit: 10
        },
        {$project:{
            _id:1,
            conmmentScore:"$commentScore",
            commentNumber:"$commentNumber"}}
                   
        ]);
var badList = await comments.aggregate([{
        $match: {
            comment_time: {
                $gte: start_time,
                $lte: end_time
            }
        }
    },
    {
        $group: {
            "_id": "$shop_name",
            "commentNumber": {
                "$sum": 1
            },
            "commentScore": {
                "$avg": "$our_score"
            },
        }
    },
    {
        $match: {
            commentNumber: {
                $gte: 100
            }
        }
    },
    {
        $sort: {
            commentScore: 1
        },
    },
    {
        $limit: 10
    },
    {
        $project: {
            _id: 1,
            conmmentScore: "$commentScore",
            commentNumber: "$commentNumber"
        }
    }

]);
    res.send({
        code: 0,
        message: "",
        data:{
            goodList,
            badList
        } 
    })
})
module.exports = router;