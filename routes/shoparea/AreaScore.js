//var mongoose = require('./db');
const express = require('express');
const comments = require('../../dbs/restaurant/RSComment');
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
    console.log(22334455);
    console.log(req.query);
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
    console.log(selectArray);

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
            { $group: { _id: { time: `$${filterKey}`, shopArea: '$shop_area' }, count: { $avg: "$comment_score" } } },
        ]);
    }
    let allResult = [];
    if (selectArray.indexOf('全部') > -1) {
        allResult = await comments.aggregate([
            { $match: match },
            { $group: { _id: { time: `$${filterKey}` }, count: { $avg: "$comment_score" } } },
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

//将model暴露出来供其他文件使用
module.exports = router;
