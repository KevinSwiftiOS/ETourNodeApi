// 这是获取当前酒店关于某个特征词相关的评论
var express = require('express');
var logger = require('log4js').getLogger("index");
var router = express.Router();
var HotelCommentTrainModel = require('../dbs/hotel/HotelCommentTrain');
var HotelCommentTrain = HotelCommentTrainModel.HotelCommentTrain

router.post('/', function (req, res, next) {
    // 特征分类
    var tagname = req.body.tagname;
    // 好评还是差评
    var commentclass = req.body.commentclass;
   
    console.log(tagname, '输出这些i你改成好像', commentclass, '好像');
    var searchObj = {}
    var groupObj = {}
    if(commentclass == 0) {
        console.log(commentclass, '输出了这些comemntclass')
    }
    if(tagname == '性价比') {
        searchObj['matchStr'] = {'性价比': commentclass}
        groupObj['groupStr']  = {'_id': '$性价比', count: {$sum: 1}}
    }else if(tagname == '位置'){
        searchObj['matchStr'] = {'位置': commentclass}
        groupObj['groupStr']  = {'_id': '$位置', count: {$sum: 1}}
    }else if(tagname == '服务'){
        searchObj['matchStr'] = {'服务': commentclass}
        groupObj['groupStr']  = {'_id': '$服务', count: {$sum: 1}}
    }
    console.log(searchObj['matchStr'],groupObj['groupStr'], '可能就是这儿出问题了');

    console.log('hehehshuchueyzhhdjfhsjdfhjksdfhkjasdf')
    HotelCommentTrain.aggregate([
        {$match: searchObj['matchStr']},
        {$group: groupObj['groupStr']}
    ]).exec(function (err, result) {
        if (err) {
            logger.error('统计 评论总数失败' + err);
            res.send({
                "code": 12,
                "message": "查询失败",
                "data": {}
            });
        } else {
            console.log(result, '这是在统计 性价比方面好评或者是 超ing 有多少的时候输出的');
            res.send({
                "code": 0,
                "message": "",
                "data": {
                    "result": result
                }
            });
        }
    })
})
module.exports = router;