var express = require('express');
var logger = require('log4js').getLogger("index");
var jwt = require('jsonwebtoken');
var router = express.Router();
var HotelCommentModel = require('../../dbs/HotelCommentModel');
var funcs = require('../../commons/common');
var HotelComment = HotelCommentModel.HotelComment

function tongBiCompare(lastNum, nowNum) {
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
    var nowStartYearDate = (year - 1).toString() + "-" + month.toString().padStart(2, 0) + "-01";    //去年的结束和年份开始日期
    var lastEndYearDate = (year - 1).toString() + "-" + funcs.PrefixInteger(month, 2) + "-" + lastThreeDate.substr(8, 2);
    var lastStartYearDate = (year - 2).toString() + "-" + month.toString().padStart(2, 0) + "-01";
    var nowStartMonth = (year - 1).toString() + "-" + month.toString().padStart(2, 0);
    var nowEndMonth = year.toString() + "-" + month.toString().padStart(2, 0);
    var lastStartMonth = (year - 2).toString() + "-" + month.toString().padStart(2, 0);
    var lastEndMonth = nowStartMonth;

    console.log(nowStartYearDate, lastThreeDate, lastStartYearDate, lastEndYearDate)
    console.log(nowStartMonth, nowEndMonth, lastStartMonth, lastEndMonth)
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

        {$sort: {_id: 1}},
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
                "comment_time": {$gte: lastStartYearDate, $lte: lastEndYearDate}

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
        {$sort: {_id: 1}},
        {
            $project: {
                _id: 1, commentNumber: 1,
            }
        }
    ]);
    console.log('输出今年的');
    for (var i = 0; i < nowData.length; i++) {
        console.log(nowData[i])
    }
    console.log('输出去年的');
    for (var i = 0; i < nowData.length; i++) {
        console.log(lastData[i])
    }

    var numList = [];
    var timeList = [];
    var tongPercentList = [];
    for (var i = 0; i < nowData.length; i++) {
        numList.push(nowData[i].commentNumber);
        timeList.push(nowData[i]._id);
        tongPercentList.push(tongBiCompare(lastData[i].commentNumber, nowData[i].commentNumber));
    }
    console.log(numList, 'numList')
    console.log(timeList, 'timeList')
    console.log(tongPercentList, "tongPercentList")
    res.send({
        "code": 0,
        "message": "",
        "data": {
            "timelist": timeList,
            "valuelist": [
                {
                    name: '评论数量', //当月的评论数量，柱状图显示
                    type: 'bar',
                    data: numList
                },
                {
                    name: '同比', //当月的评论数量，折线图显示显示
                    type: 'line',
                    data: tongPercentList
                }
            ]
        }
    })
});


module.exports = router;
