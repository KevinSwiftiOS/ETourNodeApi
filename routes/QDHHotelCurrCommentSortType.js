// 这是获取当前酒店最近的评分以及评论数量
var express = require('express');
var logger = require('log4js').getLogger("index");
var router = express.Router();
var funcs = require('./../commons/common');
var HotelCommentModel = require('./../dbs/HotelCommentModel');
var HotelComment = HotelCommentModel.HotelComment


//引进HotelRegionModel表
// 返回当前等级的所有酒店，并包含分页功能

function diff_sort_type(hotelrate, sortType, comment_month) {
    var promise = new Promise(function (resolve, reject) {
        if (sortType == 'commentNum') {-
            HotelComment.aggregate([
                {
                    $match: {
                        "shop_rate": hotelrate,
                        "comment_month": comment_month
                    }
                },
                {
                    $group:
                        {
                            _id: '$shop_show_name',
                            comment_num: {"$sum": 1}
                        }
                 },
                {
                    $project: {
                        'hotelname': '$_id',
                        comment_num: 1,
                        _id: 0
                    }
                },
                {$sort: {comment_num: -1}}
            ]).exec(function (err, result) {
                if (err)
                    reject(err);
                else {
                    resolve(result);
                }
            })
        } else if (sortType == 'commentScore') {
            HotelComment.aggregate([
                {
                    $match: {
                        "shop_rate": hotelrate,
                        "comment_month": comment_month,
                        "comment_service_grade": {$ne: 0},
                        "comment_location_grade": {$ne: 0}
                    }
                },
                {
                    $group:
                        {
                            _id: '$shop_show_name',
                            comment_score: {"$avg": '$comment_grade'}
                        }
                },
                {
                    $project: {
                        'hotelname': '$_id',
                        comment_score: 1,
                        _id: 0
                    }
                },
                {$sort: {comment_score: -1}}
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

router.post('/', function (req, res, next) {

    hotelname = req.body.hotelname;
    hotelrate = req.body.hotelrate;
    sorttypes = req.body.sorttypes;

    var currDate = new Date();
    var comment_month =  currDate.getFullYear().toString() + '-' + (currDate.getMonth()+1).toString().padStart(2, '0')
    var comment_month = '2019-01';
    var hotel_promise = new Promise(function (resolve, reject) {
        var commentSort = [];
        sorttypes.forEach((sorttype) => {
            var db_promise = diff_sort_type(hotelrate, sorttype, comment_month);
            db_promise.then(function (result) {
                if(result.length == 0){

                } else {
                    if(sorttype == 'commentScore') {
                        for(var i = 0; i < result.length; i++) {
                            result[i].comment_score =  parseFloat((result[i].comment_score).toFixed(2));
                        }
                    }
                    commentSort.push(result);
                    if (commentSort.length == sorttypes.length) {
                        resolve(commentSort);
                    }
                }
            }).catch(function (err) {
                logger.error('景区详情比较发生错误 接口：spotdetailcompared 错误：' + err);
                res.send({
                    "code": 12,
                    "message": "查询发生错误",
                    "data": {}
                })
            })
        })
    })
    hotel_promise.then(function (commentSort) {
        var data = {};
        data['commentsort'] = commentSort;
        res.send({
            "code": 0,
            "message": "",
            "data": data
        })
    })


})
module.exports = router;
