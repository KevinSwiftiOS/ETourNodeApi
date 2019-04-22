var express = require('express');
var logger = require('log4js').getLogger("index");
var jwt = require('jsonwebtoken');
var router = express.Router();
var HotelCommentModel = require('../../dbs/HotelCommentModel');
var funcs = require('../../commons/common');
var HotelComment = HotelCommentModel.HotelComment

function tongBiCompare(lastNum,nowNum){
    var res = {};
    res["percent"] = (Math.abs(nowNum - lastNum) / lastNum * 100).toFixed(2) + "%";
    res["isRise"] = nowNum - lastNum > 0 ? 1 : 0;
    res["numChange"] = Math.abs(nowNum - lastNum);
    return res;
}
//登录接口
router.post('/', async (req, res) => {
    var lastThreeDate = funcs.getDay(new Date(), 3);
    var year = lastThreeDate.substr(0, 4);
    var month = lastThreeDate.substr(5, 2);
    //今年的月份开始日期和年份开始日期
    var nowStartYearDate = year + "-01-01";
    //去年的结束和年份开始日期
    var lastEndDate = (year - 1).toString() + "-" + funcs.PrefixInteger(month, 2) + "-" + lastThreeDate.substr(8, 2);
    var lastStartYearDate = (year - 1).toString() + "-01-01";
    var nowStartMonth = (year).toString() + "-" + '01';
    var nowEndMonth = year.toString() + "-" + month.toString().padStart(2, 0);
    var lastStartMonth = (year - 1).toString() + "-" + '01';
    var lastEndMonth = year.toString() + "-" + month.toString().padStart(2, 0);

    var nowData = await HotelComment.aggregate([
        {
            $match: {
                "data_source": "酒店",
                "data_region": "千岛湖",
                "comment_time": {$gte: nowStartYearDate, $lte: lastThreeDate}

            }
        },
        {
            $group: {
                _id: "$comment_month",
                "commentNumber": {"$sum": 1}
            },
        },
        {
            $match: {
                "_id": {$gte: nowStartMonth, $lte: nowEndMonth}
            }
        },

        {$sort: {_id: -1}},
        {
            $project: {
                _id: 1, commentNumber: 1,
            }
        }
    ]);

    var lastData = await HotelComment.aggregate([
        {
            $match: {
                "data_source": "酒店",
                "data_region": "千岛湖",
                "comment_time": {$gte: lastStartYearDate, $lte: lastEndDate}

            }
        },
        {
            $group: {
                _id: "$comment_month",
                "commentNumber": {"$sum": 1}
            },

        },
        {
            $match: {
                "_id": {$gte: lastStartMonth, $lte: lastEndMonth}
            }
        },
        {$sort: {_id: -1}},
        {
            $project: {
                _id: 1, commentNumber: 1,
            }
        }
    ]);
    var nowMonthCommentNumber = nowData[0].commentNumber;
    //去年的评分和评论数量
    var lastMonthCommentNumber = lastData[0].commentNumber;
    //年累积量的评论数量和评分 去年累积量的评论数量和评分
    var nowYearCommentNumber = 0, lastYearCommentNumber = 0;
    for (var i = 0; i < nowData.length; i++) {
        nowYearCommentNumber += nowData[i].commentNumber;
        lastYearCommentNumber += lastData[i].commentNumber;
    }
    comsummary = {};

    var monthNumChange = tongBiCompare(lastMonthCommentNumber, nowMonthCommentNumber);
    var yearNumChange = tongBiCompare(lastYearCommentNumber, nowYearCommentNumber);

    comsummary['monthNumCumulant'] = nowMonthCommentNumber;
    comsummary["yearNumCumulant"] = nowYearCommentNumber;
    comsummary['monthNumChange'] = monthNumChange.numChange;
    comsummary["yearNumChange"] = yearNumChange.numChange;
    comsummary['monthNumPercent'] = monthNumChange.percent;
    comsummary["yearNumPercent"] = yearNumChange.percent;
    comsummary['isMonthNumRise'] = monthNumChange.isRise;
    comsummary["isYearNumRise"] = yearNumChange.isRise;

    res.send({
        "code":0,
        "message":"",
        "data":{
            "comsummary": comsummary
        }
    })
});

module.exports = router;
