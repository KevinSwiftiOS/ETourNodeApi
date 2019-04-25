// 这是获取当前酒店关于某个特征词相关的评论
var express = require('express');
var logger = require('log4js').getLogger("index");
var router = express.Router();
var HotelCommentTrainModel = require('./../dbs/HotelCommentTrain');
var HotelCommentTrain = HotelCommentTrainModel.HotelCommentTrain
router.post('/', function (req, res, next) {
    var tagname = req.query.tagname;
    var currpage = req.query.currpage;
    var commentclass = req.query.commentclass;
    //console.log(currpage, tagname, commentclass, '输出这些参数，为什么怎么回事');
    var searchObj = {}
    var getInfoObj = {}
    switch (tagname) {
        case "服务":
            if (commentclass == 1) {
                searchObj["matchobj"] = {'服务': 1}
            } else {
                searchObj["matchobj"] = {'服务': 0}
            }
            getInfoObj["filterstr"] = {'_id': 0, 'commentstate':'$服务', "comment": 1};
            break;
        case "位置":
            if (commentclass == 1) {
                searchObj["matchobj"] = {'位置': 1}
            } else {
                searchObj["matchobj"] = {'位置': 0}
            }
            getInfoObj["filterstr"] = {'_id': 0, 'commentstate':'$位置', "comment": 1};
            break;
        case "性价比":
            if (commentclass == 1) {
                searchObj["matchobj"] = {'性价比': 1}
            } else {
                searchObj["matchobj"] = {'性价比': 0}
            }
            getInfoObj["filterstr"] = {'_id': 0, 'commentstate':'$性价比', "comment": 1};
            break;
    }
    HotelCommentTrain.aggregate([
        {$match: searchObj["matchobj"]},
        {$project: getInfoObj["filterstr"]},
        {$skip: (currpage-1)*6},
        {$limit: 6},
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
                    "list":result
                }
            })
        }
    })
});
module.exports = router;