var express = require('express');
var logger = require('log4js').getLogger("index");
var jwt = require('jsonwebtoken');
var router = express.Router();
var Comment = require('../../../dbs/spot/CommentModels');
var funcs = require('../../../commons/common');
// var Comment = CommentModels.Comment;
//同比比较
function tongBiCompare(lastNum,nowNum){
    //是否有下降的趋势
   return  ((nowNum - lastNum) / lastNum * 100).toFixed(2) + "%";
}
//登录接口
router.post('/', async(req, res) => {
    try {
        var nowDate = funcs.getDay(new Date(), 3);
        //向前减去368天
        var nowYearDate = funcs.getDay(new Date(), 368);
        //去年的同期比较
        var lastDate = (parseInt(nowDate.substr(0, 4)) - 1).toString() + nowDate.substr(4, 6);
        var lastYearDate = (parseInt(nowYearDate.substr(0, 4)) - 1).toString() + nowYearDate.substr(4, 6);

        var nowData = await Comment.aggregate([
            {
                $match: {
                    "data_source": "景点",
                    "data_region": "千岛湖",
                    "comment_time": {$gte: nowYearDate, $lte: nowDate}

                }
            },
            {
                $group: {
                    _id: "$comment_month",
                    "commentNumber": {"$sum": 1}
                },

            },

            {$sort: {_id: 1}},

        ]);
        var lastData = await Comment.aggregate([
            {
                $match: {
                    "data_source": "景点",
                    "data_region": "千岛湖",
                    "comment_time": {$gte: lastYearDate, $lte: lastDate}

                }
            },
            {
                $group: {
                    _id: "$comment_month",
                    "commentNumber": {"$sum": 1}
                },

            },

            {$sort: {_id: 1}},

        ]);

        var numList = [];
        var timeList = [];
        var tongPercentList = [];
        var leiJiList = [];
        var leiJiNum = 0;
        for (var i = 0; i < nowData.length; i++) {
            numList.push(nowData[i].commentNumber);
            leiJiNum += nowData[i].commentNumber;
            timeList.push(nowData[i]._id);
            tongPercentList.push(tongBiCompare(lastData[i].commentNumber, nowData[i].commentNumber));
            leiJiList.push(leiJiNum);
        }
        res.send({
            "code": 0,
            "data": {
                "timelist": timeList,
                "valuelist": [{
                    name: '评论数量', //当月的评论数量，柱状图显示
                    type: 'bar',
                    data: numList
                },
                    {
                        name: '同比', //当月的评论数量，折线图显示显示
                        type: 'line',
                        data: tongPercentList
                    },
                    {
                        name: '累积量',//当月的累积评论数量，折线图显示显示
                        type: 'line',
                        data: leiJiList
                    }
                ]
            }
        });
    }
    catch (error) {
        logger.error('千岛湖景区热度变化图 （POST) 近1年的统计 按具体使用图表框架返回不同字段：spothotchange 错误：' + err);
        res.send({
            "code": 12,
            "message": "查询发生错误",
            "data": {}
        });
    }
});




module.exports = router;
