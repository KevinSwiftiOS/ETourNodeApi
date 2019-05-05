//var mongoose = require('./db');
const express = require('express');
const comments = require('../../dbs/restaurant/RSComment');
const commentKeywords = require('../../dbs/restaurant/CommentKeywords');
// const shops = require('../../dbs/restaurant/shops');
const router = express.Router();
// const moment = require('moment');
// const util = require('util');
var logger = require('log4js').getLogger('index');
//mongoose.Promise = global.Promise;

const YEAR = '年';
const QUARTER = '季度';
const MONTH = '月';
const WEEK = '周';

router.get('/', async (req, res) => {
    const { startTime, endTime, time, selectBusinessCirle } = req.query;
    let selectArray = [];
    if (selectBusinessCirle != null) {
        selectArray = selectBusinessCirle.split(',');
    }



    if (selectArray.length == 0) {
     return  res.send({
            code: 1,
            data: {},
            message: '请选择要对比的区域',
        });
    }

    logger.info('req', req.query);
    let filterKey = '';
    switch (time) {
    case YEAR:
        filterKey = 'comment_year';
        break;
    case QUARTER:
        filterKey = 'comment_season';
        break;
    case MONTH:
        filterKey = 'comment_month';
        break;
    case WEEK:
        filterKey = 'comment_week';
        break;

    default:
        res.send({
            code: 1,
            data: {},
            message: '对比维度选择不正确',
        });
        return;
    }
    let keyResult = [];
    const match = {};
    match[filterKey] = { $gte: startTime, $lte: endTime };
    if (selectArray.length > 1 || (selectArray.length == 1 && selectArray[0] != '全部')) {
        keyResult = await comments.aggregate([
            { $match: match },
            {
                $match: {
                    $or: selectArray
                        .filter((key) => key != '全部')
                        .map((shop_area) => {
                            return { shop_area };
                        }),
                },
            },
            { $group: { _id: { time: `$${filterKey}`, shopArea: '$shop_area' }, count: { $sum: 1 } } },
        ]);
    }
    let allResult = [];
    if (selectArray.indexOf('全部') > -1) {
        allResult = await comments.aggregate([
            { $match: match },
            { $group: { _id: { time: `$${filterKey}` }, count: { $sum: 1 } } },
        ]);
    }
    let result = [];
    if (allResult.length > 0) {
        result.push({
            key: '全部',
            data: allResult
                .map(({ _id: { time }, count }) => {
                    return {
                        time,
                        count,
                    };
                })
                .sort((a, b) => a.time.replace('-', '') - b.time.replace('-', '')),
        });
    }

    if (keyResult.length > 0) {
        let areaMap = {};
        keyResult
            .sort((a, b) => a._id.time.replace('-', '') - b._id.time.replace('-', ''))
            .forEach(({ _id: { time, shopArea }, count }) => {
                if (areaMap[shopArea] != undefined) {
                    areaMap[shopArea].push({
                        time,
                        count,
                    });
                } else {
                    areaMap[shopArea] = [
                        {
                            time,
                            count,
                        },
                    ];
                }
            });
        result.push(
            ...Object.keys(areaMap).map((key) => {
                return {
                    key,
                    data: areaMap[key],
                };
            }),
        );
    }

    res.send({
        code: 0,
        data: result,
    });
});


router.post("/keywords", async (req, res) => {
    let selectKey = req.body.featureWord;
    let obj = {};
    let obj2 = {};
    let obj3 = {};
    let obj4 = {};
    let taste = 0;
    let price = 0;
    let server = 0;
    let evn = 0;

    obj = await commentKeywords.aggregate([
        {$match:{taste:{$ne:"undefined"}}},
        {$group:{_id:"taste",count:{$sum:1}}}
    ]);

    obj2 = await commentKeywords.aggregate([
        {$match:{server:{$ne:"undefined"}}},
        {$group:{_id:"server",count:{$sum:1}}}
    ]);

    obj3 = await commentKeywords.aggregate([
        {$match:{evn:{$ne:"undefined"}}},
        {$group:{_id:"evn",count:{$sum:1}}}
    ]);

    obj4 = await commentKeywords.aggregate([
        {$match:{price:{$ne:"undefined"}}},
        {$group:{_id:"price",count:{$sum:1}}}
    ]);
    taste = obj[0].count;
    server = obj2[0].count;
    evn = obj3[0].count;
    price = obj4[0].count;

    var randomNum = parseInt(Math.random()*(10000),10);
    switch(selectKey){
        case 'taste':
            var comments = await commentKeywords.aggregate([
                {$match:{"taste":{$ne:"undefined"}}},
                {$skip:randomNum},
                { $limit: 200},
                {$project:{"_id":0, "content":1, "isGood":"$taste"}},

            ])
            break;
        case 'price':
            var comments = await commentKeywords.aggregate([
                {$match:{price:{$ne:"undefined"}}},
                {$skip:randomNum},
                { $limit: 200},
                {$project:{"_id":0, "content":1, "isGood":"$price"}},

            ])
            break;
        case 'evn':
            var comments = await commentKeywords.aggregate([
                {$match:{evn:{$ne:"undefined"}}},
                {$skip:randomNum},
                { $limit: 200},
                {$project:{"_id":0, "content":1, "isGood":"$evn"}},

            ])
            break;
        case 'server':
            var comments = await commentKeywords.aggregate([
                {$match:{server:{$ne:"undefined"}}},
                {$skip:randomNum},
                {$limit: 200},
                {$project:{"_id":0, "content":1, "isGood":"$server"}},

            ])
            break;
    }
    res.send({
        code:0,
        message: "",
        data: comments,
        resultNum: [taste,server,evn,price],
    })

})
//将model暴露出来供其他文件使用
module.exports = router;
