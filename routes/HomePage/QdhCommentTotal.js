var express = require('express');
var logger = require('log4js').getLogger("index");
var jwt = require('jsonwebtoken');
var router = express.Router();
var CommentModels = require('./../../dbs/CommentModels');
var funcs = require('./../../commons/common');
var Comment = CommentModels.Comment;

//登录接口
router.post('/', function (req, res, next) {
    //获取当前的月份和年份
    var date = new Date();
    var nowYear = date.getFullYear();
    var nowMonth = date.getMonth() + 1;
    var lastYear = nowYear;
    var lastMonth = nowMonth;
    //如果是1月份
    if (nowMonth == 1) {
        nowYear -= 1;
        nowMonth = 12;
        lastYear = nowYear;
        lastMonth = 11;
    } else {
        nowMonth -= 1;
        lastMonth = nowMonth;
        if (nowMonth == 1) {
            lastYear -= 1;
            lastMonth = 12;
        }else{
            lastMonth -= 1;
        }
    }
    var now_date = nowYear.toString() + "-" + (funcs.PrefixInteger(nowMonth, 2)).toString();
    var last_date = lastYear.toString() + "-" + (funcs.PrefixInteger(lastMonth, 2)).toString();
    var last_year_date = (nowYear - 1).toString() + "-" + (funcs.PrefixInteger(nowMonth, 2)).toString();


        //今年月份的查询
        Comment.aggregate([
            {
                $match: {
                    "data_region_search_key": '千岛湖', 'data_source': '景点',
                    'comment_month': {$gte: last_year_date, $lte: now_date},
                }
            },
            {
                $group: {
                    _id: "$comment_month",
                    "commentScore": {"$avg": "$comment_score"},
                    "commentNumber": {"$sum": 1},

                },

            },
            {$sort: {_id: 1}},
            {$project:{ _id:1,commentNumber:1,
                    commentScore:{$divide:[
                            {$subtract:[
                                    {$multiply:['$commentScore',100]},
                                    {$mod:[{$multiply:['$commentScore',100]}, 1]}
                                ]},
                            100]}
                }}

        ]).exec(function (err, result) {
            if(err) {
                logger.error('千岛湖同环比接口发生错误 接口：qdhcommenttoal错误：' + err);
                res.send({
                    "code": 12,
                    "message": "查询发生错误",
                    "data": {}
                })
            }
            //当月的评论条数
            var data = {};
            res_1 = result[result.length - 1];
            res_2 = result[result.length - 2];
            res_3 = result[0];
            data['nowMonthCommentNumber'] = res_1['commentNumber'];
            //环比分析
            if(res_1['commentNumber'] > res_2['commentNumber']){
                data['isHuanNumberRise'] = 1;
            }else{
                data['isHuanNumberRise'] = 0;
            }
            data['huanChangeNumber'] = Math.abs(res_1['commentNumber'] - res_2['commentNumber']);
            data['huanChangeNumberPercent'] = (((Math.abs(res_1['commentNumber'] - res_2['commentNumber'])) /  res_2['commentNumber'] * 100).toFixed(2)).toString() + "%" ;




            if(res_1['commentNumber'] > res_3['commentNumber']){
                data['isTongNumberRise'] = 1;
            }else{
                data['isTongNumberRise'] = 0;
            }
            data['tongChangeNumber'] = Math.abs(res_1['commentNumber'] - res_3['commentNumber']);
            data['tongChangeNumberPercent'] = (((Math.abs(res_1['commentNumber'] - res_3['commentNumber'])) /  res_3['commentNumber'] * 100).toFixed(2)).toString() + "%" ;


            data['nowMonthCommentScore'] = (res_1['commentScore']).toFixed(2);

            if(res_1['commentScore'] > res_2['commentScore']){
                data['isHuanScoreRise'] = 1;
            }else{
                data['isHuanScoreRise'] = 0;
            }
            data['huanChangeScore'] = (Math.abs(res_1['commentScore'] - res_2['commentScore'])).toFixed(2);


            if(res_1['commentScore'] > res_3['commentScore']){
                data['isTongScoreRise'] = 1;
            }else{
                data['isTongScoreRise'] = 0;
            }
            data['tongChangeScore'] = (Math.abs(res_1['commentScore'] - res_3['commentScore'])).toFixed(2);
          res.send({
              "code":0,
               "data":data,
               "message":""
          })

        });
    });


module.exports = router;
