// 这是获取当前酒店最近的评分以及评论数量
var express = require('express');
var logger = require('log4js').getLogger("index");
var router = express.Router();
var funcs = require('./../commons/common');
var HotelCommentModel = require('./../dbs/hotel/HotelCommentModel');
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
                        'comment_season': {$gte: start_time, $lte: end_time},
                        "data_source":"酒店",
                        "comment_grade": {$ne: 0}
                    }
                },
                {$group: {_id: "$comment_season", month_score: {"$avg": "$comment_grade"}}},
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
                        'comment_month': {$gte: start_time, $lte: end_time},
                        "data_source":"酒店",
                        "comment_grade": {$ne: 0}
                    }
                },
                {$group: {_id: "$comment_month", month_score: {"$avg": "$comment_grade"}}},
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
                        "data_source":"酒店",
                        "comment_grade": {$ne: 0}
                    }
                },
                {$group: {_id: "$comment_week", month_score: {"$avg": "$comment_grade"}}},
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
function getStartWeek(year, currWeek, beforeWeek) {
    var startWeek = currWeek - beforeWeek;
    if(startWeek < 0){
        startWeek = startWeek + 52;
        year -= 1;
    }
    return year.toString() + "-" +startWeek.toString().padStart(2, '0');
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
        now_date = year.toString() + "-" + (funcs.PrefixInteger(month, 2)).toString();
        time_search_key = '月';
        start_date = (year - 1).toString() + '-' + (funcs.PrefixInteger(month, 2)).toString();
        time_list = funcs.get_time_list(start_date, now_date, time_search_key);
    }else if (gettimetype == '按周查询') {
        var currWeek = funcs.get_curr_week();
        now_date = year.toString() + "-" + currWeek.toString().padStart(2, '0');
        start_date = getStartWeek(year, currWeek, 12);
        time_search_key = '周';
        time_list = funcs.get_time_list(start_date, now_date, time_search_key);
    }
    var data = {};
    var score_axis = [];
    var hotel_promise = new Promise(function (resolve, reject) {
        hotels.forEach((hotel, hotelIndex) => {

            var score_region_res = {};
            var score_cnts = Array.apply(0, Array(time_list.length)).map(function (v, i) {
                return "0";
            });
            var db_promise = find_in_db(hotel, start_date, now_date, time_search_key);
            db_promise.then(function (result) {
                var i = 0, j = 0;
                if(result.length == 0){
                    score_region_res['name'] = hotel;
                    score_region_res['data'] = score_cnts;
                    score_axis.push(score_region_res);

                    if (score_axis.length == hotels.length) {
                        var axis = {};
                        axis['scoreAxis'] = score_axis;
                        resolve(axis);
                    }
                }
                else
                    for (; j < result.length;) {
                        if (time_list[i] == result[j]._id) {
                            score_cnts[i] = parseFloat((result[j].month_score).toFixed(2)); // (result[j].month_score) //
                            i++;
                            j++;
                        } else {
                            score_cnts[i] = 0;
                            i++;
                        }
                        if (j == result.length - 1) {
                            score_region_res['name'] = hotel;
                            score_region_res['data'] = score_cnts;
                            score_axis.push(score_region_res);
                            if (score_axis.length == hotels.length) {
                                var axis = {};
                                axis['scoreAxis'] = score_axis;
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
        data['scoreAxis'] = axis['scoreAxis'];
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