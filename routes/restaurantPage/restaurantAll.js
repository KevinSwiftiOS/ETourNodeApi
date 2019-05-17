const express = require('express');
const comments = require('../../dbs/restaurant/RSComment');
const shop = require("../../dbs/restaurant/shops");
const commentKeyword = require("../../dbs/restaurant/Comment3");
const router = express.Router();
const funcs = require('../../commons/common');
const areaData = require("./components/areaList");

function tongBiCompareYear(lastNum,nowNum){ // 一年中每个月的同比增长率
    //是否有下降的趋势
    return  ((nowNum - lastNum) / lastNum * 100).toFixed(2) + "%";
}


function tongBiCompare(lastNum, nowNum) {
    var res = {};
    var percentNum = (Math.abs(nowNum - lastNum) / lastNum * 100).toFixed(2);
    var numChange = Math.abs(nowNum - lastNum);
    res["isRise"] = nowNum - lastNum > 0 ? 1 : 0;
    if (res["isRise"] == 1) {
        res["percent"] = '+ ' + percentNum + "%";
        res["numChange"] = '+ ' + numChange;
    }else{
        res["percent"] = "- " + percentNum + "%";
        res["numChange"] = '- ' + numChange;
    }
    return res;
}

// 接口一：餐饮关键指标模块（评论数）
router.post('/keyindicator', async (req, res) => {
    
    var lastThreeDate = funcs.getDay(new Date(), 3);
    var year = lastThreeDate.substr(0, 4);
    var month = lastThreeDate.substr(5, 2);
    //今年的月份开始日期和年份开始日期
    var nowStartYearDate = (year - 1).toString() + "-" + month.toString().padStart(2, 0) + "-" + lastThreeDate.substr(8, 2); //去年的结束和年份开始日期
    var lastEndYearDate = (year - 1).toString() + "-" + funcs.PrefixInteger(month, 2) + "-" + lastThreeDate.substr(8, 2);
    var lastStartYearDate = (year - 2).toString() + "-" + month.toString().padStart(2, 0) + "-" + lastThreeDate.substr(8, 2);
    var nowStartMonth = (year - 1).toString() + "-" + month.toString().padStart(2, 0);
    var nowEndMonth = year.toString() + "-" + month.toString().padStart(2, 0);
    var lastStartMonth = (year - 2).toString() + "-" + month.toString().padStart(2, 0);
    var lastEndMonth = nowStartMonth;

    var nowData = await comments.aggregate([
        {
            $match: {
                "data_source": "餐饮",
                "data_region": "千岛湖",
                "comment_time": {$gte: nowStartYearDate, $lte: lastThreeDate}
            }
        },
        {
            $group: {
                _id: "$comment_month",
                "commentNumber": {"$sum": 1}
            },
        },
        {
            $match: {
                "_id": {$gte: nowStartMonth, $lte: nowEndMonth}
            }
        },

        {$sort: {_id: 1}},
        {
            $project: {
                _id: 1, commentNumber: 1,
            }
        }
    ]);

    var lastData = await comments.aggregate([
        {
            $match: {
                "data_source": "餐饮",
                "data_region": "千岛湖",
                "comment_time": {$gte: lastStartYearDate, $lte: lastEndYearDate}
            }
        },
        {
            $group: {
                _id: "$comment_month",
                "commentNumber": {"$sum": 1}
            },

        },
        {
            $match: {
                "_id": {$gte: lastStartMonth, $lte: lastEndMonth}
            }
        },
        {$sort: {_id: 1}},
        {
            $project: {
                _id: 1, commentNumber: 1,
            }
        }
    ]);
    var numList = [];
    var timeList = [];
    var tongPercentList = [];

    console.log(nowData, lastData);
    for (var i = 0; i < nowData.length; i++) { // 最好以 nowData.length 作为 结束值
        numList.push(nowData[i].commentNumber);
        tongPercentList.push(tongBiCompareYear(lastData[i].commentNumber, nowData[i].commentNumber));
        timeList.push(nowData[i]._id);
    }

    var nowMonthCommentNumber = nowData[nowData.length - 1].commentNumber;
    //去年的评分和评论数量
    var lastMonthCommentNumber = lastData[lastData.length - 1].commentNumber;
    //年累积量的评论数量和评分 去年累积量的评论数量和评分
    var nowYearCommentNumber = 0, lastYearCommentNumber = 0;
    for (var i = (nowData.length - parseInt(month)); i < nowData.length; i++) {
        nowYearCommentNumber += nowData[i].commentNumber;
        lastYearCommentNumber += lastData[i].commentNumber;
    }

    var monthNumChange = tongBiCompare(lastMonthCommentNumber, nowMonthCommentNumber);
    var yearNumChange = tongBiCompare(lastYearCommentNumber, nowYearCommentNumber);
    var commentKeyIndicatorModel = {};
    commentKeyIndicatorModel['monthNumCumulant'] = nowMonthCommentNumber;
    commentKeyIndicatorModel["yearNumCumulant"] = nowYearCommentNumber;
    commentKeyIndicatorModel['monthNumChange'] = monthNumChange.numChange;
    commentKeyIndicatorModel["yearNumChange"] = yearNumChange.numChange;
    commentKeyIndicatorModel['monthNumPercent'] = monthNumChange.percent;
    commentKeyIndicatorModel["yearNumPercent"] = yearNumChange.percent;
    commentKeyIndicatorModel['isMonthNumRise'] = monthNumChange.isRise;
    commentKeyIndicatorModel["isYearNumRise"] = yearNumChange.isRise;

    //console.log(commentKeyIndicatorModel, 'commentKeyIndicatorModel')

    res.send({
        "code": 0,
        "message": "",
        "data": {
            "commentKeyIndicatorModel": commentKeyIndicatorModel,
            "commentTrendModel": {
                "timeList": timeList,
                "valueList": [
                    {
                        name: '评论数量', //每月的评论数量，柱状图显示（1年）
                        type: 'bar',
                        data: numList
                    },
                    {
                        name: '同比', //当月的评论数量，折线图显示显示
                        type: 'line',
                        data: tongPercentList
                    },
                ]
            }

        }
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
    if (i == areaData.length) {

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

function findTypeCount(tagname) {
    var searchObj = {}
    var groupObj = {}
    var projectObj = {}
    switch (tagname) {
        case "服务":
            searchObj["matchobj"] = {$or: [{'服务': 1}, {'服务': -1}]}
            groupObj['group'] = {'_id': '$服务', count: {'$sum': 1}}
            break;
        case "价格":
            searchObj["matchobj"] = {$or: [{'价格': 1}, {'价格': -1}]}
            groupObj['group'] = {'_id': '$价格', count: {'$sum': 1}}
            break;
        case "环境":
            searchObj["matchobj"] = {$or: [{'环境': 1}, {'环境': -1}]}
            groupObj['group'] = {'_id': '$环境', count: {'$sum': 1}}
            break;
        case "味道":
            searchObj["matchobj"] = {$or: [{'味道': 1}, {'味道': -1}]}
            groupObj['group'] = {'_id': '$味道', count: {'$sum': 1}}
            break;
    }
    var promise = new Promise(function (resolve, reject) {
        commentKeyword.aggregate([
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

// 接口四：评论智能分析模块
router.post("/keywordcount", async (req, res) => {
    var tagnames = ['味道', '环境', '服务', '价格'];  //  卫生设施   设施

    var infoList = []
    var replacetag = ['口味', '环境', '服务', '性价比'];  //  卫生设施   设施
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
                    everySum['name'] = replacetag[tagIndex];
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
})

// 接口五：评论智能分析模块
router.post("/keywords", async (req, res) => {
    // 分页功能变量
    var tagname = req.body.featureWord;
    var currpage = req.body.currPage;
    var commentclass = req.body.commentClass;
    var pageSize = req.body.pageSize;
    var searchObj = {}
    switch (tagname) {
        case "口味":
            if (commentclass == 1) {
                searchObj["matchobj"] = {'味道': 1}
            } else {
                searchObj["matchobj"] = {'味道': -1}
            }
            break;
        case "环境":
            if (commentclass == 1) {
                searchObj["matchobj"] = {'环境': 1}
            } else {
                searchObj["matchobj"] = {'环境': -1}
            }
            break;
        case "服务":
            if (commentclass == 1) {
                searchObj["matchobj"] = {'服务': 1}
            } else {
                searchObj["matchobj"] = {'服务': -1}
            }
            break;
        case "性价比":
            if (commentclass == 1) {
                searchObj["matchobj"] = {'价格': 1}
            } else {
                searchObj["matchobj"] = {'价格': -1}
            }
            break;
    }
    console.log(tagname, searchObj, currpage, commentclass, '评论数量')
    commentKeyword.aggregate([
        {$match: searchObj["matchobj"]},
        {$project: {'_id': 0, "content": "$评论"}},
        {$skip: (currpage-1)*6},
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



// 接口六：餐饮列表显示模块
router.post('/shoplist', async (req, res) => {
    //获取参数
    // businessArea: 商圈名字: // 商圈。（默认加载全部 businessArea: ”全部“）
    // shopCook： //菜系（默认加载全部shopCook: ”全部“）
    // pageSize： //每页显示餐馆数量
    // sortWay： //排序方式，降序传-1，升序传1 默认传-1
    // commentType: //排序关键字，按照评分传1，按照评论数量传2 默认传1
    //  currPage： // 当前页面
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
                shop_score: 1, //  店铺评分
                shop_cook_style: 1, // 店铺类型
                shop_price: 1, // 人均
                shop_env: 1, // 环境
                shop_taste: 1, // 口味
                shop_service: 1, // 服务
                our_score: 1, // 总分
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
                "next": currPag + 1 <= totalPage ? currPag + 1 : "",
                "total":shops.length
            },
            code:0,
            message:""
        }
    )
});
module.exports = router;
