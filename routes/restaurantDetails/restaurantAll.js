const express = require('express');
const comments = require('../../dbs/restaurant/RSComment');
const shop = require("../../dbs/restaurant/shops");
const commentKeywords = require("../../dbs/restaurant/CommentKeywords");
const router = express.Router();
const funcs = require('../../commons/common');

// 获取当前的月份和年份
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
    } else {
        lastMonth -= 1;
    }
}

var nowDate = nowYear.toString() + "-" + (funcs.PrefixInteger(nowMonth, 2)).toString();
var lastYearDate = (nowYear - 1).toString() + "-" + (funcs.PrefixInteger(nowMonth, 2)).toString();
var lastYear = (nowYear - 1).toString() + "-" + "01";
var thisYear = nowYear.toString() + "-" + "01";


// 餐饮关键指标模块（评论数）、餐饮评论数变化趋势
router.post('/keyindicator', async (req, res) => {


    await comments.aggregate([{
            $match: {
                "comment_content": {
                    $ne: null
                },
                "comment_month": {
                    $gte: lastYear,
                    $lte: nowDate
                },
            }
        },
        {
            $group: {
                _id: "$comment_month",
                "commentNumber": {
                    $sum: 1
                }
            }
        },
        {
            $sort: {
                _id: 1
            }
        }, {
            $project: {
                _id: 1,
                commentNumber: 1,
            }
        }
    ]).exec((err, result) => {
        if (err) {
            logger.error('同环比接口发生错误 接口：qdhcommenttoal错误：' + err);
            res.send({
                "code": 12,
                "message": "查询发生错误",
                "data": {}
            })

        }
        var isMonthNumRise = 0;
        var isYearNumRise = 0;

        // 本月累计量
        var thisMonthNumber = result[result.length - 1].commentNumber;
        // 去年同时期月份累计量
        var lastMonthNumber = result[result.length - 2].commentNumber;

        // 是否上升
        if (thisMonthNumber > lastMonthNumber) {
            isMonthNumRise = 0
        } else {
            isMonthNumRise = 1;
        }

        var thisYearArray = result.filter((item, index, array) => {
            if (item._id >= thisYear) {
                return item.commentNumber;
            }
        })
        var lastYearArray = result.filter((item, index, array) => {
            if (item._id >= lastYear && item._id <= lastYearDate) {
                return item.commentNumber;
            }
        })

        // 本年累计量
        var thisYearNumber = 0;
        for (var i = 0; i < thisYearArray.length; i++) {
            thisYearNumber += thisYearArray[i].commentNumber;
        }
        // 去年同时期累计量
        var lastYearNumber = 0;
        for (var i = 0; i < lastYearArray.length; i++) {
            lastYearNumber += lastYearArray[i].commentNumber;
        }
        // 是否上升
        if (thisYearNumber > lastYearNumber) {
            isYearNumRise = 0
        } else {
            isYearNumRise = 1;
        }

        var tongMonthNumber = Math.abs(thisMonthNumber - lastMonthNumber);
        var tongYearNumber = Math.abs(thisYearNumber - lastYearNumber);

        var tongMonthPercent = (((tongMonthNumber / lastMonthNumber) * 100).toFixed(2)).toString() + "%";
        var tongYearPercent = (((tongYearNumber / lastYearNumber) * 100).toFixed(2)).toString() + "%";

        //  餐饮评论数变化趋势
        var timeList = [];
        var commentValue = [];
        var value = result.filter((item, index, arry) => {
            if (item._id >= lastYearDate) {
                timeList.push(item._id);
                commentValue.push(item.commentNumber)
                return commentValue, timeList;
            }
        })

        res.send({
            "code": 0,

            // 餐饮关键指标模块（评论数）返回参数
            "commentKeyIndicatorModel": [{
                "monthNumCumulant": thisMonthNumber,
                "yearNumCumulant": thisYearNumber,
                "monthNumChange": tongMonthNumber,
                "yearNumChange": tongYearNumber,
                "monthNumPercent": tongMonthPercent,
                "yearMonthPercent": tongYearPercent,
                "isMonthNumRise": isMonthNumRise,
                "isYearNumRise": isYearNumRise
            }],

            // 餐饮评论数变化趋势 返回参数
            "commentTrendModel": [{
                "timeList": timeList,
                "valueList": {
                    "name": "评论数量",
                    "type": 'line',
                    "data": commentValue
                }
            }],

            "message": ""
        })
    })
})

//  餐饮选择模块
router.post("/selectlist", async (req, res) => {
    var businessCircle = req.query.businessCircle || '全部';
    var cinsine = req.query.cinsine || '全部';

    var unParsePage = req.query.page;
    var unParsePageSize = req.query.pageSize;

    var page = 0;
    var pageSize = 20;

    try {
        if (unParsePage != null && unParsePage.length > 0) {
            page = parseInt(unParsePage);
        }
        if (unParsePageSize != null && unParsePageSize.length > 0) {
            pageSize = parseInt(unParsePageSize);
        }
    } catch (e) {
        logger.warn('page/pageSize is not a number', unParsePage, unParsePageSize);
    }

    var findQuery = {}; // 过滤信息用的对象
    if (businessCircle != "全部") {
        findQuery.shop_area = businessCircle;
    }
    if (cinsine != "全部") {
        findQuery.shop_cook_style = cinsine;
    }

    var totalCount = await shop.find(findQuery).count();
    var result = [];
    var pageObj = {
        page: page,
        pageSize: pageSize,
        total: totalCount,
    }
    if (page * pageSize < totalCount) {
        result = await shop.find(findQuery, {
                _id: 0,
                shop_name: 1, // 店铺名
                shop_comment_num: 1, // 评论数
                shop_address: 1, // 店铺地址
                our_score: 1, //  店铺评分
                shop_cook_style: 1, // 店铺类型
                shop_price: 1, // 人均
                shop_env: 1, // 环境
                shop_taste: 1, // 口味
                shop_service: 1 // 服务
            }).sort({
                "our_score": -1
            })
            .skip(page * pageSize) // 跳过多少条数据
            .limit(pageSize); // 从跳过数据开始数下面20条数据
        console.log(result);
        if (page * pageSize + pageSize < totalCount) {
            pageObj.next = page + 1;
        }
    }
    res.send({
        code: 0,
        data: [{
            result: result,
            page: pageObj
        }],
        message: ""
    });
})


// 餐饮排行列表模块
router.post("/ranklist", async (req, res) => {
    var start_time = funcs.getDay(new Date(), 93);
    var end_time = funcs.getDay(new Date(), 3);

    var goodList = await comments.aggregate([{
            $match: {
                comment_time: {
                    $gte: start_time,
                    $lte: end_time
                }
            }
        },
        {
            $group: {
                "_id": "$shop_name",
                totalNumber: {
                    $sum: 1
                },
                commentScore: {
                    $avg: "$our_score"
                }
            }
        },
        {
            $match: {
                totalNumber: {
                    $gte: 100
                }
            }
        },
        {
            $project: {
                "_id": "$_id",
                commentNumber: "$totalNumber",
                commentScore: {
                    $divide: [{
                            $subtract: [{
                                    $multiply: ['$commentScore', 100]
                                },
                                {
                                    $mod: [{
                                        $multiply: ['$commentScore', 100]
                                    }, 1]
                                }
                            ]
                        },
                        100
                    ]
                }
            }
        },
        {
            $sort: {
                commentScore: -1
            }
        },
        {
            $limit: 10
        },
    ]);
    var badList = await comments.aggregate([{
            $match: {
                comment_time: {
                    $gte: start_time,
                    $lte: end_time
                }
            }
        },
        {
            $group: {
                "_id": "$shop_name",
                totalNumber: {
                    $sum: 1
                },
                commentScore: {
                    $avg: "$our_score"
                }
            }
        },
        {
            $match: {
                totalNumber: {
                    $gte: 100
                }
            }
        },
        {
            $project: {
                "_id": "$_id",
                commentNumber: "$totalNumber",
                commentScore: {
                    $divide: [{
                            $subtract: [{
                                    $multiply: ['$commentScore', 100]
                                },
                                {
                                    $mod: [{
                                        $multiply: ['$commentScore', 100]
                                    }, 1]
                                }
                            ]
                        },
                        100
                    ]
                }
            }
        },
        {
            $sort: {
                commentScore: 1
            }
        },
        {
            $limit: 10
        },
    ]);

    var commentNumList = await comments.aggregate([{
            $match: {
                comment_time: {
                    $gte: start_time,
                    $lte: end_time
                }
            }
        },
        {
            $group: {
                "_id": "$shop_name",
                totalNumber: {
                    $sum: 1
                },
                commentScore: {
                    $avg: "$our_score"
                }
            }
        },
        {
            $project: {
                "_id": "$_id",
                commentNumber: "$totalNumber",
                commentScore: {
                    $divide: [{
                            $subtract: [{
                                    $multiply: ['$commentScore', 100]
                                },
                                {
                                    $mod: [{
                                        $multiply: ['$commentScore', 100]
                                    }, 1]
                                }
                            ]
                        },
                        100
                    ]
                }
            }
        },
        {
            $sort: {
                commentNumber: -1
            }
        },
        {
            $limit: 10
        },
    ]);

    res.send({
        code: 0,
        message: "",
        data: {
            goodList,
            badList,
            commentNumList
        }
    })
})

// 评论智能分析模块
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

    obj = await commentKeywords.aggregate([{
            $match: {
                taste: {
                    $ne: "undefined"
                }
            }
        },
        {
            $group: {
                _id: "taste",
                count: {
                    $sum: 1
                }
            }
        }
    ]);

    obj2 = await commentKeywords.aggregate([{
            $match: {
                server: {
                    $ne: "undefined"
                }
            }
        },
        {
            $group: {
                _id: "server",
                count: {
                    $sum: 1
                }
            }
        }
    ]);

    obj3 = await commentKeywords.aggregate([{
            $match: {
                evn: {
                    $ne: "undefined"
                }
            }
        },
        {
            $group: {
                _id: "evn",
                count: {
                    $sum: 1
                }
            }
        }
    ]);

    obj4 = await commentKeywords.aggregate([{
            $match: {
                price: {
                    $ne: "undefined"
                }
            }
        },
        {
            $group: {
                _id: "price",
                count: {
                    $sum: 1
                }
            }
        }
    ]);
    taste = obj[0].count;
    server = obj2[0].count;
    evn = obj3[0].count;
    price = obj4[0].count;
    var randomNum = parseInt(Math.random() * (10000), 10);
    // console.log(randomNum);
    switch (selectKey) {
        case 'taste':
            var result = await commentKeywords.aggregate([
                {
                    $match: {
                        "taste": {
                            $ne: "undefined"
                        }
                    }
                },
                {
                    $skip: randomNum
                },
                {
                    $limit: 200
                },
                
                {
                    $project: {
                        "_id": 0,
                        "content": 1,
                        "taste": 1
                    }
                },
                
            ])
            break;
        case 'price':
            var result = await commentKeywords.aggregate([
                {
                    $match: {
                        price: {
                            $ne: "undefined"
                        }
                    }
                },
                {
                    $skip: randomNum
                },
                {
                    $limit: 200
                },
                
                {
                    $project: {
                        "_id": 0,
                        "content": 1,
                        "price": 1
                    }
                },
                
            ])
            break;
        case 'evn':
            var result = await commentKeywords.aggregate([
                {
                    $match: {
                        evn: {
                            $ne: "undefined"
                        }
                    }
                },
                {
                    $skip: randomNum
                },
                {
                    $limit: 200
                },
                
                {
                    $project: {
                        "_id": 0,
                        "content": 1,
                        "evn": 1
                    }
                },
                
            ])
            break;
        case 'server':
            var result = await commentKeywords.aggregate([
                {
                    $match: {
                        server: {
                            $ne: "undefined"
                        }
                    }
                },
                {
                    $skip: randomNum
                },
                {
                    $limit: 200
                },
                {
                    $project: {
                        "_id": 0,
                        "content": 1,
                        "server": 1
                    }
                },
                
            ])
            break;
    }
    // console.log(result);
    res.send({
        code: 0,
        message: "",
        data: result,
        resultNum: [taste, server, evn, price],
    })
})
module.exports = router;