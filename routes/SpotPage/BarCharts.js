const express = require('express');
const router = express.Router();
const Spots = require('../../dbs/spot/CommentModels');
const funcs = require('../../commons/common');

router.post('/number', async function (req, res, next) {
    var currSpot = req.body.currSpot;

    var lastThreeDate = funcs.getDay(new Date(), 3);
    var year = lastThreeDate.substr(0, 4);
    var month = lastThreeDate.substr(5, 2);
    //今年的月份开始日期和年份开始日期
    var nowStartYearDate = (year - 1).toString() + "-" + month.toString().padStart(2, 0) + "-" + lastThreeDate.substr(8, 2); //去年的结束和年份开始日期
    var nowStartMonth = (year - 1).toString() + "-" + month.toString().padStart(2, 0);
    var nowEndMonth = year.toString() + "-" + month.toString().padStart(2, 0);

    var nowData = await Spots.aggregate([{
            $match: {
                data_region_search_key: currSpot,
                "crawl_time": {
                    $gte: nowStartYearDate,
                    $lte: lastThreeDate
                }
            }
        },
        {
            $group: {
                _id: "$comment_month",
                "comment_content": {
                    "$sum": 1
                }
            },
        },
        {
            $match: {
                "_id": {
                    $gte: nowStartMonth,
                    $lte: nowEndMonth
                }
            }
        },
        {
            $sort: {
                _id: 1
            }
        },
        {
            $project: {
                _id: 1,
                commentNumber: "$comment_content",
            }
        }
    ]);
    console.log(nowData)
    var numList = [];
    var timeList = [];
    for (var i = 0; i < nowData.length; i++) { // 最好以 nowData.length 作为 结束值
        numList.push(nowData[i].commentNumber);
        timeList.push(nowData[i]._id);
    }
    res.send({
        "code": 0,
        "message": "",
        "data": {
            timeList: timeList,
            valueList: [{
                name: '评论数量', //每月的评论数量，柱状图显示（1年）
                type: 'bar',
                data: numList
            }]
        }
    })

})
module.exports = router;