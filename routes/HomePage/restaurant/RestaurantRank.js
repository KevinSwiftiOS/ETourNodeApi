const express = require('express');
const comments = require('../../../dbs/restaurant/RSComment');
const ourScore = require("../../../dbs/restaurant/shops")
const router = express.Router();
const getDay = require('../../../commons/common');


router.post('/', async (req, res) => {
    // 查询数据库，返回前TOP10的评分最高和最低的餐饮

    var start_time = getDay(new Date(), 93);
    var end_time = getDay(new Date(), 3);

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
                totalNumber: {
                    $sum: 1
                }
            }
        },
        {
            $project: {
                "_id": "$_id",
                commentScore:"$our_score",
                commentNumber: "$totalNumber"
            }
        },
        {
            $sort: {
                commentScore: -1
            }
        },
        {
            $limit: 10
        },
    ]);
    console.log(goodList);
    res.send({
        code: 0,
        message: "",
        data: {
            goodList,
            badList:[]
        }
    })
})


module.exports = router;