// 这是获取当前酒店关于某个特征词相关的评论
var express = require('express');
var logger = require('log4js').getLogger("index");
var router = express.Router();
var HotelCommentTrainModel = require('../../dbs/hotel/HotelCommentTrain');
var HotelCommentTrain = HotelCommentTrainModel.HotelCommentTrain
router.post('/', function (req, res, next) {
    var tagname = req.body.featureWord;
    var currpage = req.body.currPage;
    var commentclass = req.body.commentClass;
    var pageSize = req.body.pageSize;
    var searchObj = {}
    var getInfoObj = {}
    switch (tagname) {
        case "服务":
            if (commentclass == 1) {
                searchObj["matchobj"] = {'服务': 1}
            } else {
                searchObj["matchobj"] = {'服务': -1}
            }
            break;
        case "位置":
            if (commentclass == 1) {
                searchObj["matchobj"] = {'位置': 1}
            } else {
                searchObj["matchobj"] = {'位置': -1}
            }
            break;
        case "性价比":
            if (commentclass == 1) {
                searchObj["matchobj"] = {'性价比': 1}
            } else {
                searchObj["matchobj"] = {'性价比': -1}
            }
            break;
    }
    HotelCommentTrain.aggregate([
        {$match: searchObj["matchobj"]},
        {$project: {'_id': 0, "content": "$评论"}},
        {$skip: (currpage-1)*pageSize},
        {$limit: pageSize},
        ]).exec(function (err, result) {
        if (err) {
            logger.error('查询有特征词的评论失败' + err);
            res.send({
                "code": 12,
                "message": "查询失败",
                "data": {}
            });
        }else{
            //console.log(result, '韦森么没有输出那')
            res.send({
                "code":0,
                "message":"",
                data:{
                    "commentList":result
                }
            })
        }
    })
});
module.exports = router;
