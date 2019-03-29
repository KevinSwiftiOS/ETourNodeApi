var express = require('express');
var logger = require('log4js').getLogger("index");
var jwt = require('jsonwebtoken');
var router = express.Router();
var CommentModels = require('../../../dbs/CommentModels');
var funcs = require('../../../commons/common');
var Comment = CommentModels.Comment;
//同比的比较函数，返回是否上升，和上升的百分比
function tongBiCompare(lastNum,nowNum){
    console.log(lastNum);
    console.log(nowNum);
    var res = {};
    res["percent"] = (Math.abs(nowNum - lastNum) / lastNum * 100).toFixed(2) + "%";
    res["isRise"] = nowNum - lastNum > 0 ? 1 : 0;
    res["numChange"] = Math.abs(nowNum - lastNum);
    return res;
}
//登录接口
router.post('/', async (req, res) => {
    var lastThreeDate = funcs.getDay(new Date('2019-01-01'),3);
    var year = lastThreeDate.substr(0,4);
    var month = lastThreeDate.substr(5,2);
    //今年的月份开始日期和年份开始日期
    var nowStartMonthDate = year + "-" + funcs.PrefixInteger(month,2) + "-01";
    var nowStartYearDate =  year + "-01-01";
    //去年的结束和年份开始日期
    var lastEndDate = (year-1).toString() + "-" + funcs.PrefixInteger(month,2) + "-" +  lastThreeDate.substr(8,2);
    var lastStartYearDate =  (year-1).toString() + "-01-01";
    console.log(lastEndDate);
    var nowData =  await Comment.aggregate([
        {
            $match: {
                "data_source": "景点",
                "data_region":"千岛湖",
                "comment_time":{$gte: nowStartYearDate, $lte: lastThreeDate}

            }
        },
        {
            $group: {
                _id: "$comment_month",
                "commentScore": {"$avg": "$comment_score"},
                "commentNumber": {"$sum": 1}
            },

        },

        {$sort: {_id: -1}},
        {$project:{ _id:1,commentNumber:1,
                commentScore:{$divide:[
                        {$subtract:[
                                {$multiply:['$commentScore',100]},
                                {$mod:[{$multiply:['$commentScore',100]}, 1]}
                            ]},
                        100]}
            }}
    ]);

    var lastData =  await Comment.aggregate([
        {
            $match: {
                "data_source": "景点",
                "data_region":"千岛湖",
                "comment_time":{$gte: lastStartYearDate, $lte: lastEndDate}

            }
        },
        {
            $group: {
                _id: "$comment_month",
                "commentScore": {"$avg": "$comment_score"},
                "commentNumber": {"$sum": 1}
            },

        },

        {$sort: {_id: -1}},
        {$project:{ _id:1,commentNumber:1,
                commentScore:{$divide:[
                        {$subtract:[
                                {$multiply:['$commentScore',100]},
                                {$mod:[{$multiply:['$commentScore',100]}, 1]}
                            ]},
                        100]}
            }}
    ]);

    console.log(nowData);
    //当月的评分和评论数量
    var nowMonthCommentNumber = nowData[0].commentNumber;
    var nowMonthCommentScore = nowData[0].commentScore;
    //去年的评分和评论数量
    var lastMonthCommentNumber = lastData[0].commentNumber;
    var lastMonthCommentScore = lastData[0].commentScore;
    console.log(lastData);
    //年累积量的评论数量和评分 去年累积量的评论数量和评分
    var nowYearCommentNumber = 0,nowYearCommentScore = 0,lastYearCommentNumber = 0,lastYearCommentScore = 0;
    for(var i = 0; i < nowData.length;i++){
        nowYearCommentNumber += nowData[i].commentNumber;
        nowYearCommentScore += nowData[i].commentScore;
    }
    nowYearCommentScore = (nowYearCommentScore / (nowData.length)).toFixed(2);
    for(var i = 0; i < lastData.length;i++){
        lastYearCommentNumber += lastData[i].commentNumber;
        lastYearCommentScore += lastData[i].commentScore;
    }
    lastYearCommentScore = (lastYearCommentScore / (lastData.length)).toFixed(2);
    data = {};

    var monthNumChange = tongBiCompare(lastMonthCommentNumber,nowMonthCommentNumber);
    var yearNumChange = tongBiCompare(lastYearCommentNumber,nowYearCommentNumber);
    var monthScoreChange = tongBiCompare(lastMonthCommentScore,nowMonthCommentScore);
    var yearScoreChange = tongBiCompare(lastYearCommentScore,nowYearCommentScore);
    console.log(monthNumChange);
    console.log(yearNumChange);
    console.log(monthScoreChange);
    console.log(yearScoreChange);
    data['monthNumCumulant'] = nowMonthCommentNumber;
    data["yearNumCumulant"] = nowYearCommentNumber;
    data['monthNumChange'] = monthNumChange.numChange;
    data["yearNumChange"] = yearNumChange.numChange;
    data['monthNumPercent'] = monthNumChange.percent;
    data["yearNumPercent"] = yearNumChange.percent;
    data['isMonthNumRise'] = monthNumChange.isRise;
    data["isYearNumRise"] = yearNumChange.isRise;

    data['monthScoreCumulant'] = nowMonthCommentScore;
    data["yearScoreCumulant"] = nowYearCommentScore;
    data['monthScoreChange'] = monthScoreChange.numChange.toFixed(2);
    data["yearScoreChange"] = yearScoreChange.numChange.toFixed(2);
    data['monthScorePercent'] = monthScoreChange.percent;
    data["yearScorePercent"] = yearScoreChange.percent;
    data['isMonthScoreRise'] = monthScoreChange.isRise;
    data["isYearScoreRise"] = yearScoreChange.isRise;

    res.send({
        "code":0,
        "message":"",
        "data":data
    })


});
module.exports = router;
