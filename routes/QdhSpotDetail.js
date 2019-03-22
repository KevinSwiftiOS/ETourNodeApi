var express = require('express');

var logger = require('log4js').getLogger("index");
var router = express.Router();
var funcs = require('./../commons/common');

var RegionInfoModels = require('./../dbs/RegionInfoModels');
var CommentModels = require('./../dbs/CommentModels');

var RegionInfo = RegionInfoModels.Regioninfo;
var Comment = CommentModels.Comment;
var  qdh_spot_infos_dic = require("./../commons/QdhSpotInfosDic");
//数据库查询操作
function find_in_db(shop_name_search_key, start_time, end_time, time_seach_key) {

    var promise = new Promise(function (resolve, reject) {
        if (time_seach_key == '月') {
            Comment.aggregate([
                {
                    $match: {
                        "data_region_search_key": '千岛湖',
                        'comment_month': {$gte: start_time, $lte: end_time},
                        "data_source":"景点",
                         'shop_name_search_key':shop_name_search_key,
                    }
                },
                {$group: {_id: "$comment_month", "month_cnt": {"$sum": 1}, "month_score": {"$avg": "$comment_score"}}},
                {$sort: {_id: 1}}

            ]).exec(function (err, result) {
                if (err)
                    reject(err);
                else {

                    resolve(result);
                }
            })
        } else if (time_seach_key == '周') {
            Comment.aggregate([
                {
                    $match: {
                        "data_region_search_key": '千岛湖',
                        'comment_week': {$gte: start_time, $lte: end_time},
                        "data_source":"景点",
                        'shop_name_search_key':shop_name_search_key
                    }
                },
                {$group: {_id: "$comment_week", "month_cnt": {"$sum": 1}, "month_score": {"$avg": "$comment_score"}}},
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

//获取景区详情接口
router.post('/', function (req, res, next) {
    //获取id
    var cur_spot = req.body.qdh_cur_spot;
    var spots = [];
    spots.push(cur_spot);
    //若当前日期小于4月 则返回周
    var year = new Date().getFullYear();
    var month = new Date().getMonth() + 1;
    if (month < 5) {
        var week = funcs.get_curr_week();
        var now_date = year.toString() + "-" + (funcs.PrefixInteger(week, 2)).toString();
        var time_search_key = '周'; //时间搜索关键字为week
    } else {
        var now_date = year.toString() + "-" + (funcs.PrefixInteger(month, 2)).toString();
        var time_search_key = '月';
    }
    var start_date = (new Date().getFullYear()).toString() + '-01';//开始日期
    var time_list = funcs.get_time_list(start_date, now_date, time_search_key);
    var data = {};
    var num_axis = [];
    var score_axis = [];
    //进行景区遍历获取排名和本月评论数量
    var spot_promise = new Promise(function (resolve, reject) {
        spots.forEach((spot, spot_index) => {
            var num_region_res = {};
            var score_region_res = {};
            var score_cnts = Array.apply(0, Array(time_list.length)).map(function (v, i) {
                return "0";
            });
            var num_cnts = Array.apply(0, Array(time_list.length)).map(function (v, i) {
                return "0";
            });
            var db_promise = find_in_db(spot, start_date, now_date, time_search_key);
            db_promise.then(function (result) {
                var i = 0, j = 0;
                if(result.length == 0){
                    num_region_res['name'] = qdh_spot_infos_dic[spot].name;
                    num_region_res['data'] = num_cnts;
                    score_region_res['name'] = qdh_spot_infos_dic[spot].name;
                    score_region_res['data'] = score_cnts;
                    num_axis.push(num_region_res);
                    score_axis.push(score_region_res);
                    if (num_axis.length == spots.length) {
                        var axis = {};
                        axis['numAxis'] = num_axis;
                        axis['scoreAxis'] = score_axis;
                        resolve(axis);
                    }
                }
                else
                    for (; j < result.length;) {

                    if (time_list[i] == result[j]._id) {
                        num_cnts[i] = result[j].month_cnt;
                        score_cnts[i] = parseFloat((result[j].month_score).toFixed(2));
                        i++;
                        j++;
                    } else {
                        num_cnts[i] = 0;
                        score_cnts[i] = 0;
                        i++;
                    }
                    if (j == result.length - 1) {
                        num_region_res['name'] = qdh_spot_infos_dic[spot].name;
                        num_region_res['data'] = num_cnts;
                        score_region_res['name'] = qdh_spot_infos_dic[spot].name;
                        score_region_res['data'] = score_cnts;
                        num_axis.push(num_region_res);
                        score_axis.push(score_region_res);
                        if (num_axis.length == spots.length) {
                            var axis = {};
                            axis['numAxis'] = num_axis;
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
    })
    spot_promise.then(function (axis) {


        data['numAxis'] = axis['numAxis'];
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
