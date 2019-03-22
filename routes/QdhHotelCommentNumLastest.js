// 这是获取当前酒店最近的评分以及评论数量
var express = require('express');
var logger = require('log4js').getLogger("index");
var router = express.Router();
var funcs = require('./../commons/common');
var HotelCommentModel = require('./../dbs/HotelCommentModel');
var HotelComment = HotelCommentModel.HotelComment

//引进HotelRegionModel表
// 返回当前等级的所有酒店，并包含分页功能

function find_in_db(hotelname, start_time, end_time, time_search_key) {
    var promise = new Promise(function (resolve, reject) {
        if (time_search_key == '季') {
            HotelComment.aggregate([
                {
                    $match: {
                        "shop_show_name": hotelname,
                        'comment_season': {$gte: start_time, $lte: end_time}
                    }
                },
                {$group: {_id: "$comment_season", month_cnt: {"$sum": 1}}},
                {$sort: {_id: 1}}
            ]).exec(function (err, result) {
                if (err)
                    reject(err);
                else {
                    resolve(result);
                }
            })
        }else if (time_search_key == '月') {
            HotelComment.aggregate([
                {
                    $match: {
                        "shop_show_name": hotelname,
                        'comment_month': {$gte: start_time, $lte: end_time}
                    }
                },
                {$group: {_id: "$comment_month", month_cnt: {"$sum": 1}}},
                {$sort: {_id: 1}}
            ]).exec(function (err, result) {
                if (err)
                    reject(err);
                else {
                    resolve(result);
                }
            })
        } else if (time_search_key == '周') {
            HotelComment.aggregate([
                {
                    $match: {
                        "shop_show_name": hotelname,
                        'comment_week': {$gte: start_time, $lte: end_time},
                        "data_source": "酒店",
                    }
                },
                {$group: {_id: "$comment_week", month_cnt: {"$sum": 1}}},
                {$sort: {_id: 1}}
            ]).exec(function (err, result) {
                if (err)
                    reject(err);
                else
                    resolve(result);
            })
        }
    })
    return promise;
}

router.post('/', function (req, res, next) {
    var hotels = [];
    hotels = req.body.hotelname;
    var gettimetype = req.body.gettimetype;

    var currDate = new Date();
    var year = currDate.getFullYear();
    var month = currDate.getMonth() + 1;
    var now_date;
    var time_search_key;
    var start_date;
    var time_list;
    if (gettimetype == '按季查询') {
        now_date = year.toString() + '-' + funcs.get_curr_season(month);
        start_date = (year - 3).toString() + '-' + funcs.get_curr_season(month);
        time_search_key = '季';
        time_list = funcs.get_time_list_hotel(start_date, now_date, '季度');
    }else if (gettimetype == '按月查询') {
        now_date = year.toString() + "-" + (funcs.PrefixInteger(month, 2)).toString().padStart(2, '0');
        time_search_key = '月';
        start_date = (year - 1).toString() + '-' + (funcs.PrefixInteger(month, 2)).toString();
        time_list = funcs.get_time_list(start_date, now_date, time_search_key);
    } else if (gettimetype == '按周查询') {
        now_date = year.toString() + "-" + funcs.get_curr_week().toString().padStart(2, '0');
        start_date = funcs.get_week(12);
        time_search_key = '周';
        time_list = funcs.get_time_list(start_date, now_date, time_search_key);
    }
    var data = {};
    var num_axis = [];
    var hotel_promise = new Promise(function (resolve, reject) {
        hotels.forEach((hotel, hotelIndex) => {
            var num_region_res = {};
            var num_cnts = Array.apply(0, Array(time_list.length)).map(function (v, i) {
                return "0";
            });
            var db_promise = find_in_db(hotel, start_date, now_date, time_search_key);
            db_promise.then(function (result) {
                var i = 0, j = 0;
                if (result.length == 0) {
                    num_region_res['name'] = hotel;
                    num_region_res['data'] = num_cnts;
                    num_axis.push(num_region_res);
                    if (num_axis.length == hotels.length) {
                        var axis = {};
                        axis['numAxis'] = num_axis;
                        resolve(axis);
                    }
                } else
                    for (; j < result.length;) {
                        if (time_list[i] == result[j]._id) {
                            num_cnts[i] = result[j].month_cnt;
                            i++;
                            j++;
                        } else {
                            num_cnts[i] = 0;
                            i++;
                        }
                        if (j == result.length - 1) {
                            num_region_res['name'] = hotel;
                            num_region_res['data'] = num_cnts;
                            num_axis.push(num_region_res);
                            if (num_axis.length == hotels.length) {
                                var axis = {};
                                axis['numAxis'] = num_axis;
                                resolve(axis);
                            }
                        }
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
    }).then(function (axis) {
        data['numAxis'] = axis['numAxis'];
        data['xAxis'] = time_list;
        data['time'] = time_search_key;
        data['startTime'] = start_date;
        data['endTime'] = now_date;
        res.send({
            "code": 0,
            "message": "",
            "data": data
        })
    })
})
module.exports = router;
