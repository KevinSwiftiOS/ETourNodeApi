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
            HotelRegion.aggregate([
                {
                    $match: {
                        "table_type": "mixed_hotel_shop"
                    }
                },
                {
                    $group: {
                        _id: "$shop_rate",
                        "countNum": {"$sum": 1}
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
            HotelRegion.aggregate([
                {
                    $match: {
                        "table_type": "mixed_hotel_shop",
                        "tradeArea": tradeArea
                    }
                },
                {
                    $group: {
                        _id: "$shop_rate",
                        "countNum": {"$sum": 1}
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
router.post('/shoplist', function (req, res, next) {
    var currpage = parseInt(req.body.currPage);
    var tradearea = req.body.businessArea;
    var hotelrate = req.body.hotelRate;
    var pageSize = parseInt(req.body.pageSize);
    var sortWay = parseInt(req.body.sortWay); // 排序方式 升序 or 降序
    var commentType = parseInt(req.body.commentType); // 按评分 或 评论数量 展示酒店
    console.log(currpage, tradearea, hotelrate, pageSize, sortWay, commentType)
    var matchObj = {}
    if (hotelrate != '全部') {
        matchObj['shop_rate'] = hotelrate;
    } else {
        matchObj['shop_rate'] = {$ne: ""}
    }

    if (tradearea != '全部') {
        matchObj['tradearea'] = tradearea;
    } else {
        matchObj['tradearea'] = {$ne: "0"}
    }

    if (commentType == 1) {
        if (sortWay == 1) {
            matchObj['sortchoice'] = {$sort: {commentScore: -1}}
        } else {
            matchObj['sortchoice'] = {$sort: {commentScore: 1}}
        }
    } else if (commentType == 2) {
        if (sortWay == 1) {
            matchObj['sortchoice'] = {$sort: {commentNumber: -1}}
        } else {
            matchObj['sortchoice'] = {$sort: {commentNumber: 1}}
        }
    }

    HotelRegion.aggregate([
        {
            $match: {
                'shop_rate': matchObj['shop_rate'],
                'tradeArea': matchObj['tradearea'],
                "table_type": "mixed_hotel_shop"
            }
        },
        matchObj['sortchoice'],
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
        {$skip: pageSize * (currpage - 1)},
        {$limit: pageSize}
    ]).exec(function (err, result) {
        if (err) {
            logger.error('千岛湖景区景点查询发生错误 接口：qdhspotlist 错误：' + err);
            res.send({
                "code": 12,
                "message": "查询发生错误",
                "data": {}
            })
        }

        if (result.length == 0) {
            res.send({
                "code": 0,
                "message": "",
                "data": {
                    "list": result
                }
            })
        } else {
            res.send({
                "code": 0,
                "message": "",
                data: {
                    "hotellist": result
                }
            })
        }
    })
});
module.exports = router;
