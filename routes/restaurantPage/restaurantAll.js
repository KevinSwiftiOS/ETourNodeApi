const express = require('express');
const comments = require('../../dbs/restaurant/RSComment');
const shop = require("../../dbs/restaurant/shops");
const commentKeywords = require("../../dbs/restaurant/CommentKeywords");
const router = express.Router();
const funcs = require('../../commons/common');
const areaData = require("./components/areaList");

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


// 接口一：餐饮关键指标模块（评论数）
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
            "data": {
                "commentKeyIndicatorModel": {
                    "monthNumCumulant": thisMonthNumber,
                    "yearNumCumulant": thisYearNumber,
                    "monthNumChange": tongMonthNumber,
                    "yearNumChange": tongYearNumber,
                    "monthNumPercent": tongMonthPercent,
                    "yearMonthPercent": tongYearPercent,
                    "isMonthNumRise": isMonthNumRise,
                    "isYearNumRise": isYearNumRise
                },
                // 餐饮评论数变化趋势 返回参数

                "commentTrendModel": {
                    "timeList": timeList,
                    "valueList": [{
                        "name": "评论数量",
                        "type": 'line',
                        "data": commentValue
                    }]
                }


            },


            "message": ""
        })
    })
})

//  接口二：商圈选择对饮菜系模块
router.post("/selectlist", async (req, res) => {

    var areaCuisine = [];
    // var businessArea = "阳光路";
    var businessArea = req.body.businessArea;
    for (var i = 0; i < areaData.length; i++) {
        if (areaData[i].area === businessArea) {

            areaCuisine = areaData[i].cuisine;
            break;
        }
    }
    if(i == areaData.length) {

            res.send({
                code: 0,
                data: [],
                message: "无此商圈"
            })

    }
    res.send({
        code: 0,
        data: {
            shopCookList: areaCuisine
        },
        message: ""
    });
})


// 接口三：餐饮排行列表模块
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


// 接口四：评论智能分析模块
router.post("/keywords", async (req, res) => {
    // 分页功能变量
    var pageSize = req.body.pageSize;
    var currPag = req.body.currPage;

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
    var tasteNumber = await commentKeywords.aggregate([{
        $group: {
            _id: "$taste",
            num_tutorial: {
                $sum: 1
            }
        }
    }])
    var serverNumber = await commentKeywords.aggregate([{
        $group: {
            _id: "$server",
            num_tutorial: {
                $sum: 1
            }
        }
    }])
    var evnNumber = await commentKeywords.aggregate([{
        $group: {
            _id: "$evn",
            num_tutorial: {
                $sum: 1
            }
        }
    }])
    var priceNumber = await commentKeywords.aggregate([{
        $group: {
            _id: "$price",
            num_tutorial: {
                $sum: 1
            }
        }
    }])

    taste = obj[0].count;
    server = obj2[0].count;
    evn = obj3[0].count;
    price = obj4[0].count;

    var randomNum = parseInt(Math.random() * (10000), 10);
    var result = [];
    // console.log(randomNum);
    switch (selectKey) {
        case 'taste':
            var currArray = await commentKeywords.aggregate([{
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

            ]);
            var goodNum = tasteNumber[3].num_tutorial;
            var badNum = tasteNumber[1].num_tutorial;
            break;
        case 'price':
            var currArray = await commentKeywords.aggregate([{
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
            var goodNum = priceNumber[2].num_tutorial;
            var badNum = priceNumber[0].num_tutorial;
            break;
        case 'evn':
            var currArray = await commentKeywords.aggregate([{
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
            var goodNum = evnNumber[2].num_tutorial;
            var badNum = evnNumber[0].num_tutorial;
            break;
        case 'server':
            var currArray = await commentKeywords.aggregate([{
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
            var goodNum = serverNumber[3].num_tutorial;
            var badNum = serverNumber[0].num_tutorial;
            break;
    }

    if (currPag * pageSize <= currArray.length) {
        var ends = currPag * pageSize;
    } else {
        ends = currArray.length;
    }
    for (var i = (currPag - 1) * pageSize; i < ends; i++) {
        result.push(currArray[i])
    }
    var totalPage = Math.ceil(currArray.length / pageSize);

    // console.log(priceNumber);
    // console.log(goodNum);
    // console.log(badNum);
    // console.log(result);
    res.send({
        code: 0,
        message: "",
        data: {
            result: result,
            resultNum: [taste, server, evn, price],
            keywordsNum: [goodNum, badNum],

            page: {
                "currPage": currPag,
                "pageSize": result.length,
                "totalPage": totalPage,
                "next": currPag + 1 <= totalPage ? currPag + 1 : ""
            }
        }
    })
})


router.post('/shoplist', async (req, res) => {
    //获取参数
    var businessArea = req.body.businessArea;
    var shopCook = req.body.shopCook;
    var pageSize = req.body.pageSize;
    var sortWay = req.body.sortWay;
    var commentType = req.body.commentType;
    var currPag = req.body.currPage;
    var sortdic = {};
    if(commentType == 1 && sortWay == 1)
        sortdic = {our_score:1};
    else if(commentType == 1 && sortWay == -1)
        sortdic = {our_score: -1};
    else if(commentType == 2 && sortWay == 1)
        sortdic = {shop_comment_num: 1};
    else
        sortdic = {shop_comment_num:-1};
    var shopsitereg = new RegExp(businessArea,'i');
    var shopcookreg = new RegExp(shopCook,'i');
    var dic =   {$match:{}};
    if(businessArea == "全部" && shopCook == "全部") {
        dic =   {$match:{}};
    }
    else if(businessArea == "全部" && shopCook != "全部"){
        dic = {
            $match: {
                "shop_cook_style": {
                    $regex:shopcookreg
                },
            }
        };


    }
    else if(businessArea != "全部" && shopCook == "全部"){
        dic = {
            $match: {
                "shop_site": {
                    $regex:shopsitereg
                },

            }
        };
    }
    else{
        dic = {
            $match: {
                "shop_site": {
                    $regex:shopsitereg
                },
                "shop_cook_style": {
                    $regex:shopcookreg
                },
            }
        };
    }
    var shops = await shop.aggregate([
        dic,
        {
            $sort: sortdic
        },
        {
            $project:{
                _id:0,
                shop_name: 1, // 店铺名
                shop_comment_num: 1, // 评论数
                shop_address: 1, // 店铺地址
                our_score: 1, //  店铺评分
                shop_cook_style: 1, // 店铺类型
                shop_price: 1, // 人均
                shop_env: 1, // 环境
                shop_taste: 1, // 口味
                shop_service: 1 // 服务

            }
        }
    ]);

    var result = []; //表示最终的数组
    if(currPag * pageSize <= shops.length)
        var ends = currPag * pageSize;
    else
        ends = shops.length;

    for(var i = (currPag - 1) * pageSize; i < ends;i++)
        result.push(shops[i]);

    var totalPage = Math.ceil(shops.length / pageSize);
    res.send(
        {
            data: {
                restaurantShopList: result

            },
            "page": {
                "currPage": currPag,
                "pageSize": result.length,
                "totalPage":totalPage,
                "next": currPag + 1 <= totalPage ? currPag + 1 : ""
            },
            code:0,
            message:""
        }
    )
});
module.exports = router;
