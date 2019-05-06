var express = require('express');
var logger = require('log4js').getLogger("index");
var router = express.Router();
var HotelCommentTrainModel = require('./../../dbs/hotel/HotelCommentTrain');
var HotelCommentTrain = HotelCommentTrainModel.HotelCommentTrain

router.post("/", async (req, res) => {
    var selectKey = req.body.featureWord;
    console.log(selectKey, 'selectKey')
    var obj = [];
    var obj2 = [];
    var obj3 = [];


    obj = await HotelCommentTrain.aggregate([
        {
            $match: {$or: [{'位置': 1}, {'位置': 0}]}
        },
        {
            $group: {_id: "$位置", count: {$sum: 1}}
        }
    ]);

    obj2 = await HotelCommentTrain.aggregate([
        {
            $match: {$or: [{'服务': 1}, {'服务': 0}]}
        },
        {
            $group: {_id: "$服务", count: {$sum: 1}}
        }
    ]);

    obj3 = await HotelCommentTrain.aggregate([
        {
            $match: {$or: [{'性价比': 1}, {'性价比': 0}]}
        },
        {
            $group: {_id: "evn", count: {$sum: 1}}
        }
    ]);

    var location = obj[0].count;
    var server = obj2[0].count;
    var price = obj3[0].count;

    var randomNum = parseInt(Math.random() * (1500), 10);
    var comments = [];
    switch (selectKey) {
        case '位置':
            comments = await HotelCommentTrain.aggregate([
                {$match: {$or: [{'位置': 1}, {'位置': 0}]}},
                {$skip:randomNum},
                {$limit: 200},
                {$project:{"_id":0, "content":"$comment", "featureWord":"$位置"}}
            ])
            break;
        case '服务':
            comments = await HotelCommentTrain.aggregate([
                {$match: {$or: [{'服务': 1}, {'服务': 0}]}},
                {$skip:randomNum},
                { $limit: 200},
                {$project:{"_id":0, "content":"$comment", "featureWord":"$服务"}}
            ])
            break;
        case '性价比':
            comments = await HotelCommentTrain.aggregate([
                {$match: {$or: [{'性价比': 1}, {'性价比': 0}]}},
                {$skip:randomNum},
                { $limit: 200},
                {$project:{"_id":0, "content": "$comment", "featureWord":"$性价比"}}
            ])
            break;
    }
    res.send({
        code: 0,
        message: "",
        data: comments,
        resultNum: [location, server, price],
    })
})
module.exports = router;