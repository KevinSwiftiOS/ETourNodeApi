var express = require('express');
var logger = require('log4js').getLogger("index");
var jwt = require('jsonwebtoken');
var router = express.Router();
var HotelCommentModel = require('../../dbs/hotel/HotelCommentModel');
var funcs = require('../../commons/common');
var HotelComment = HotelCommentModel.HotelComment

function tongBiCompare(lastNum, nowNum) {
    var res = {};
    var percentNum = (Math.abs(nowNum - lastNum) / lastNum * 100).toFixed(2);
    var numChange = Math.abs(nowNum - lastNum);
    res["isRise"] = nowNum - lastNum > 0 ? 1 : 0;
    if (res["isRise"] == 1) {
        res["percent"] = '+ ' + percentNum + "%";
        res["numChange"] = '+ ' + numChange;
    }else{
        res["percent"] = "- " + percentNum + "%";
        res["numChange"] = '- ' + numChange;
    }
    return res;
}

function tongBiCompareYear(lastNum,nowNum){ // 一年中每个月的同比增长率
    //是否有下降的趋势
    return  ((nowNum - lastNum) / lastNum * 100).toFixed(2) + "%";
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
    var numList = [];
    var timeList = [];
    var tongPercentList = [];


    for (var i = 0; i < nowData.length; i++) {
        numList.push(nowData[i].commentNumber);
        tongPercentList.push(tongBiCompareYear(lastData[i].commentNumber, nowData[i].commentNumber));
        timeList.push(nowData[i]._id);
    }

    var nowMonthCommentNumber = nowData[nowData.length - 1].commentNumber;
    //去年的评分和评论数量
    var lastMonthCommentNumber = lastData[lastData.length - 1].commentNumber;
    //年累积量的评论数量和评分 去年累积量的评论数量和评分
    var nowYearCommentNumber = 0, lastYearCommentNumber = 0;
    for (var i = (nowData.length - parseInt(month)); i < nowData.length; i++) {
        nowYearCommentNumber += nowData[i].commentNumber;
        lastYearCommentNumber += lastData[i].commentNumber;
    }

    var monthNumChange = tongBiCompare(lastMonthCommentNumber, nowMonthCommentNumber);
    var yearNumChange = tongBiCompare(lastYearCommentNumber, nowYearCommentNumber);
    var commentKeyIndicatorModel = {};
    commentKeyIndicatorModel['monthNumCumulant'] = nowMonthCommentNumber;
    commentKeyIndicatorModel["yearNumCumulant"] = nowYearCommentNumber;
    commentKeyIndicatorModel['monthNumChange'] = monthNumChange.numChange;
    commentKeyIndicatorModel["yearNumChange"] = yearNumChange.numChange;
    commentKeyIndicatorModel['monthNumPercent'] = monthNumChange.percent;
    commentKeyIndicatorModel["yearNumPercent"] = yearNumChange.percent;
    commentKeyIndicatorModel['isMonthNumRise'] = monthNumChange.isRise;
    commentKeyIndicatorModel["isYearNumRise"] = yearNumChange.isRise;

    //console.log(commentKeyIndicatorModel, 'commentKeyIndicatorModel')

    res.send({
        "code": 0,
        "message": "",
        "data": {
            "commentKeyIndicatorModel": commentKeyIndicatorModel,
            "commentTrendModel": {
                "timeList": timeList,
                "valueList": [
                    {
                        name: '评论数量', //每月的评论数量，柱状图显示（1年）
                        type: 'bar',
                        data: numList
                    },
                    {
                        name: '同比', //当月的评论数量，折线图显示显示
                        type: 'line',
                        data: tongPercentList
                    },
                ]
            }

        }
    })
});

module.exports = router;
