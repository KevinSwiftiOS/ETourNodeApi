var express = require('express');
var logger = require('log4js').getLogger("index");
var jwt = require('jsonwebtoken');
var router = express.Router();
var HotelRegionModel = require('../../dbs/HotelRegionModel');
var funcs = require('../../commons/common');
var HotelRegion = HotelRegionModel.HotelRegion;
var HotelCommentModel = require('../../dbs/HotelCommentModel');
var HotelComment = HotelCommentModel.HotelComment;

//登录接口


function find_in_db(tradeArea) {

    var promise = new Promise(function (resolve, reject) {
        if (tradeArea == '全部') {
            HotelRegion.aggregate([{
                    $match: {
                        "table_type": "mixed_hotel_shop"
                    }
                },
                {
                    $group: {
                        _id: "$shop_rate",
                        "countNum": {
                            "$sum": 1
                        }
                    },
                }
            ]).exec(function (err, result) {
                if (err)
                    reject(err);
                else {
                    resolve(result);
                }
            })
        } else {
            HotelRegion.aggregate([{
                    $match: {
                        "table_type": "mixed_hotel_shop",
                        "tradeArea": tradeArea
                    }
                },
                {
                    $group: {
                        _id: "$shop_rate",
                        "countNum": {
                            "$sum": 1
                        }
                    },
                }
            ]).exec(function (err, result) {
                if (err)
                    reject(err);
                else {
                    resolve(result);
                }
            })
        }
    })
    return promise;
}

/*
 * 获取同商圈的酒店个数
 * */
router.post('/selectlist', async (req, res) => {
    var tradearea = req.body.businessArea;
    var hotel_promise = new Promise(function (resolve, reject) {
        var db_promise = find_in_db(tradearea);
        db_promise.then(function (result) {
            if (result.length == 0) {
                res.send({
                    "code": 0,
                    "message": "",
                    "data": {}
                })
            } else
                resolve(result)

        }).catch(function (err) {
            logger.error('景区详情比较发生错误 接口：spotdetailcompared 错误：' + err);
            res.send({
                "code": 12,
                "message": "查询发生错误",
                "data": {}
            })
        })
    }).then(function (result) {
        var total = 0;
        for (var i = 0; i < result.length; i++)
            total += result[i].countNum;
        var totalDic = {
            "_id": "全部",
            "countNum": total
        };
        result.unshift(totalDic);
        res.send({
            "code": 0,
            "message": "",
            "data": {
                "hotelShopList": result
            }
        })
    })
});
/*
 * 获取酒店列表
 * */
router.post('/shoplist', async (req, res) => {
    // params: {
    //     businessArea: // 商圈。（默认加载全部 businessArea: ”全部“）
    //     hotelRate： //酒店等级（默认加载全部 hotelrate: ”全部“）
    //     pageSize： //每页显示餐馆数量
    //     sortWay： //排序方式，降序传1，升序传2 默认传1
    //     commentType: //排序关键字，按照评分传1，按照评论数量传2 默认传1
    //     currPage： // 当前页面
    // }

    var tradeArea = req.body.businessArea;
    var hotelRate = req.body.hotelRate;
    var pageSize = req.body.pageSize;
    var sortWay = req.body.sortWay;
    var commentType = req.body.commentType;
    var currPage = req.body.currPage;
    var sortdic = {};

    if (commentType == 1 && sortWay == 1) {
        sortdic = {
            commentScore: 1
        };
    } else if (commentType == 1 && sortWay == -1) {
        sortdic = {
            commentScore: -1
        };
    } else if (commentType == 2 && sortWay == 1) {
        sortdic = {
            commentNumber: 1
        };
    } else {
        sortdic = {
            commentNumber: -1
        };
    }
    var hotelsitereg = new RegExp(tradeArea, 'i');
    var hoteltrendreg = new RegExp(hotelRate, 'i');
    var dic = {
        $match: {}
    };

    if (tradeArea == "全部" && hotelRate == "全部") {
        dic = {
            $match: {}
        };
    } else if (tradeArea == "全部" && hotelRate != "全部") {
        dic = {
            $match: {
                "shop_cook_style": {
                    $regex: hoteltrendreg
                },
            }
        };


    } else if (tradeArea != "全部" && hotelRate == "全部") {
        dic = {
            $match: {
                "shop_site": {
                    $regex: hotelsitereg
                },

            }
        };
    } else {
        dic = {
            $match: {
                "shop_site": {
                    $regex: hotelsitereg
                },
                "shop_cook_style": {
                    $regex: hoteltrendreg
                },
            }
        };
    }

    var hotel = await HotelRegion.aggregate([
        dic,
        {
            $sort: sortdic
        },
        {
            $project: {
                _id: 0,
                name: 1,
                address: 1,
                shop_rate: 1,
                commentScore: 1,
                commentNumber: 1,
                comment_service_grade: 1,
                comment_health_grade: 1,
                comment_location_grade: 1,
                comment_facility_grade: 1
            }
        },
    ])

    var result = []; //表示最终的数组
    if (currPage * pageSize <= hotel.length)
        var ends = currPage * pageSize;
    else
        ends = hotel.length;

    for (var i = (currPage - 1) * pageSize; i < ends; i++)
        result.push(hotel[i]);

    var totalPage = Math.ceil(hotel.length / pageSize);
    res.send({
        data: {
            hotellist: result
        },
        "page": {
            "currPage": currPage,
            "pageSize": result.length,
            "totalPage": totalPage,
            "next": currPage + 1 <= totalPage ? currPage + 1 : ""
        },
        code: 0,
        message: ""
    })
});
module.exports = router;