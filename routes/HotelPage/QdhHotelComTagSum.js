// 这是获取当前酒店关于某个特征词相关的评论
var express = require('express');
var logger = require('log4js').getLogger("index");
var router = express.Router();
var HotelCommentTrainModel = require('../../dbs/hotel/HotelCommentTrain');
var HotelCommentTrain = HotelCommentTrainModel.HotelCommentTrain
function findTypeCount(tagname) {
    var searchObj = {}
    var groupObj = {}
    switch (tagname) {
        case "服务":
            searchObj["matchobj"] = {$or: [{'服务': 1}, {'服务': 0}]}
            groupObj['group'] = {'_id': '$服务', count: {'$sum': 1}}
            break;
        case "位置":
            searchObj["matchobj"] = {$or: [{'位置': 1}, {'位置': 0}]}
            groupObj['group'] = {'_id': '$位置', count: {'$sum': 1}}
            break;
        case "性价比":
            searchObj["matchobj"] = {$or: [{'性价比': 1}, {'性价比': 0}]}
            groupObj['group'] = {'_id': '$性价比', count: {'$sum': 1}}
            break;
    }
    var promise = new Promise(function (resolve, reject) {
        HotelCommentTrain.aggregate([
            {
                $match: searchObj["matchobj"]
            },
            {
                $group: groupObj['group']
            }
        ]).exec(function (err, result) {
            if (err)
                reject(err);
            else {
                resolve(result);
            }
        })
    })
    return promise;
}

router.post('/', function (req, res, next) {
    var tagnames = ['性价比', '服务', '位置'];  //  卫生设施   设施
    var infoList = []
    var getPromose = new Promise(function (resolve, reject) {
        tagnames.forEach((tagname, tagIndex) => {
            var db_promise = findTypeCount(tagname);
            db_promise.then(function (result) {
                if (result.length == 0) {

                } else {
                    var everySum = {
                        name: '',
                        count: []
                    };
                    everySum['name'] = tagname;
                    for(var i = 0; i < result.length; i++) {
                        everySum['count'].push( result[i]['count']);
                    }
                    infoList.push(everySum);
                    if(infoList.length == tagnames.length){
                        resolve(infoList);
                    }
                }
            }).catch(function (err) {
                logger.error('评论分析  接口：comment_analyze 错误：' + err);
                res.send({
                    "code": 12,
                    "message": "查询发生错误",
                    "data": {}
                });
            })
        })
    }).then(function (infoList) {
        var data = {}
        data['infoList'] = infoList;
        res.send({
            "code": 0,
            "message": "",
            "data": data
        })
    })
});
module.exports = router;