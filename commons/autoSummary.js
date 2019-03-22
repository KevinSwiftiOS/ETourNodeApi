/*
var express = require('express');
var logger = require('log4js').getLogger("index");
var router = express.Router();
var HotelCommentTrainModel = require('./../dbs/HotelCommentTrain');
var HotelCommentTrain = HotelCommentTrainModel.HotelCommentTrain

function findTypeCount(tagname) {
    var searchObj = {}
    var groupObj = {}

    if (tagname == "卫生") {
        searchObj["matchobj"] = {$or: [{'卫生': 1}, {'卫生': 0}]}
        groupObj['group'] = {'_id': '$卫生', count: {'$sum': 1}}
    } else if (tagname == "服务") {
        searchObj["matchobj"] = {$or: [{'服务': 1}, {'服务': 0}]}
        groupObj['group'] = {'_id': '服务', count: {'$sum': 1}}
    } else if (tagname == "设施") {
        searchObj["matchobj"] = {$or: [{'设施': 1}, {'设施': 0}]}
        groupObj['group'] = {'_id': '设施', count: {'$sum': 1}}
    } else if (tagname == "位置") {
        searchObj["matchobj"] = {$or: [{'位置': 1}, {'位置': 0}]}
        groupObj['group'] = {'_id': '位置', count: {'$sum': 1}}
    } else if (tagname == "性价比") {
        searchObj["matchobj"] = {$or: [{'性价比': 1}, {'性价比': 0}]}
        groupObj['group'] = {'_id': '性价比', count: {'$sum': 1}}
    }
    var promise = new Promise(function (resolve, reject) {
        HotelComment.aggregate([
            {
                $match: searchObj["matchobj"],
                $group: groupObj['group']
            },
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

function autoGetTypeSum() {
    var tagnames = ['性价比', '卫生', '位置', '服务', '设施'];
    var getPromose = new Promise(function (resolve, reject) {
        tagnames.forEach((tagname, tagIndex) => {
            var typename = {};
            var db_promise = findTypeCount(tagname);
            db_promise.then(function (result) {
                if (result.length == 0) {

                } else {
                    console.log(result)
                }
            }).catch(function (err) {
                logger.error('千岛湖景点单周或单月查询出错 接口：spotdetail 错误：' + err);
                res.send({
                    "code": 12,
                    "message": "查询发生错误",
                    "data": {}
                });
            })
        })
    })
}
setTimeout(autoGetTypeSum(), 2000);
*/
setTimeout(function(){
    console.log('这是自动加载函数');
}, 2000)
