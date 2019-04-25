var express = require('express');
var logger = require('log4js').getLogger("index");
var jwt = require('jsonwebtoken');
var router = express.Router();
var CommentModels = require('../../../dbs/CommentModels');
var funcs = require('../../../commons/common');
var Comment = CommentModels.Comment;
//同比的比较函数，返回是否上升，和上升的百分比
function tongBiCompare(lastNum,nowNum,isScore){

    var res = {};
    res["percent"] =  nowNum >= lastNum ? "+" + (Math.abs(nowNum - lastNum) / lastNum * 100).toFixed(2) + "%" : "-" + (Math.abs(nowNum - lastNum) / lastNum * 100).toFixed(2) + "%" ;
    res["isRise"] = nowNum - lastNum > 0 ? 1 : 0;
    if(!isScore)
    res["numChange"] =  nowNum >= lastNum ? "+" +  Math.abs(nowNum - lastNum) : "-" +  Math.abs(nowNum - lastNum) ;
    else
        res["numChange"] =  nowNum >= lastNum ? "+" +  Math.abs(nowNum - lastNum).toFixed(2) : "-" +  Math.abs(nowNum - lastNum).toFixed(2) ;
    return res;
}
const getYearData = async(startDate,endDate) => {
    return new Promise((resolve, reject) => {
        Comment.aggregate([
            {
                $match: {
                    "data_source": "景点",
                    "data_region":"千岛湖",
                    "comment_time":{$gte: startDate, $lte: endDate}

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
        ],
        (err, res) => {
            if (err) {
                reject(err);
            } else {
              resolve(res);
            }
        }

        )
        ;

    })
}
//登录接口
router.post('/', async (req, res) => {
    var lastThreeDate = funcs.getDay(new Date(),3);
    var year = lastThreeDate.substr(0,4);
    var month = lastThreeDate.substr(5,2);
    //今年的月份开始日期和年份开始日期
    var nowStartMonthDate = year + "-" + funcs.PrefixInteger(month,2) + "-01";
    var nowStartYearDate =  year + "-01-01";
    //去年的结束和年份开始日期
    var lastEndDate = (year-1).toString() + "-" + funcs.PrefixInteger(month,2) + "-" +  lastThreeDate.substr(8,2);
    var lastStartYearDate =  (year-1).toString() + "-01-01";

    try {
        var nowData = await getYearData(nowStartYearDate, lastThreeDate);
        var lastData = await getYearData(lastStartYearDate, lastEndDate);


        //当月的评分和评论数量
        var nowMonthCommentNumber = nowData[0].commentNumber;
        var nowMonthCommentScore = nowData[0].commentScore;
        //去年的评分和评论数量
        var lastMonthCommentNumber = lastData[0].commentNumber;
        var lastMonthCommentScore = lastData[0].commentScore;

        //年累积量的评论数量和评分 去年累积量的评论数量和评分
        var nowYearCommentNumber = 0, nowYearCommentScore = 0, lastYearCommentNumber = 0, lastYearCommentScore = 0;
        for (var index = 0; index < nowData.length; index++) {
            lastYearCommentNumber += lastData[index].commentNumber;
            lastYearCommentScore += lastData[index].commentScore;
            nowYearCommentNumber += nowData[index].commentNumber;
            nowYearCommentScore += nowData[index].commentScore;
        }
        var nowYearCommentScore = (nowYearCommentScore / (nowData.length)).toFixed(2);

        var lastYearCommentScore = (lastYearCommentScore / (lastData.length)).toFixed(2);
        var data = {};

        var monthNumChange = tongBiCompare(lastMonthCommentNumber, nowMonthCommentNumber,false);
        var yearNumChange = tongBiCompare(lastYearCommentNumber, nowYearCommentNumber,false);
        var monthScoreChange = tongBiCompare(lastMonthCommentScore, nowMonthCommentScore,true);
        var yearScoreChange = tongBiCompare(lastYearCommentScore, nowYearCommentScore,true);






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
        data['monthScoreChange'] = monthScoreChange.numChange;
        data["yearScoreChange"] = yearScoreChange.numChange;
        data['monthScorePercent'] = monthScoreChange.percent;
        data["yearScorePercent"] = yearScoreChange.percent;
        data['isMonthScoreRise'] = monthScoreChange.isRise;
        data["isYearScoreRise"] = yearScoreChange.isRise;

        res.send({
            "code": 0,
            "message": "",
            "data": data
        })
    }
    catch (error) {

        logger.error('景区模块 关键指标：keyindicator 错误：' + err);
        res.send({
            "code": 12,
            "message": "查询发生错误",
            "data": {}
        });
    }

});
module.exports = router;
