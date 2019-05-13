var express = require('express');
var router = express.Router();
var funcs = require('./../commons/common');
var logger = require('log4js').getLogger("index");
//引进comment表
var CommentModels = require('./../dbs/spot/CommentModels');
var Comment = CommentModels.Comment;

//数据库查询操作
function find_in_db(data_region_search_key, start_time, end_time, website, filter, time_seach_key) {
    var promise = new Promise(function (resolve, reject) {
        if (time_seach_key == '月') {

              var   match = {
                    "data_region_search_key": data_region_search_key,
                    'comment_month': {$gte: start_time, $lte: end_time},

                    'data_source': '景点'
                };
               if(website != '全部平台'){
                 match = {
                    "data_region_search_key": data_region_search_key,
                    'comment_month': {$gte: start_time, $lte: end_time},
                    'data_website':website,
                    'data_source': '景点'
                };
            }
            Comment.aggregate([
                {
                    $match: match
                },
                {$group: {_id: "$comment_month", "value": filter['value']}},
                {$sort: {_id: 1}}

            ]).exec(function (err, result) {
                if (err)
                    reject(err);
                else {

                    resolve(result);
                }
            })
        } else if (time_seach_key == '季度') {
            var match = {
                "data_region_search_key": data_region_search_key,
                'comment_season': {$gte: start_time, $lte: end_time},
                'data_source': '景点',

            };

            if(website != '全部平台') {

                match = {
                    "data_region_search_key": data_region_search_key,
                    'comment_season': {$gte: start_time, $lte: end_time},
                    'data_source': '景点',
                     'data_website':website

                };
            }

            Comment.aggregate([
                {
                    $match:match
                },
                {$group: {_id: "$comment_season", "value": filter['value']}},
                {$sort: {_id: 1}}

            ]).exec(function (err, result) {
                if (err)
                    reject(err);
                else
                    resolve(result);
            })

        } else if (time_seach_key == '周') {

                var match = {
                    "data_region_search_key": data_region_search_key,
                    'comment_week': {$gte: start_time, $lte: end_time},

                    'data_source': '景点'
                }
            if(website != '全部平台'){
                var match = {
                    "data_region_search_key": data_region_search_key,
                    'comment_week': {$gte: start_time, $lte: end_time},
                    'data_website': website,
                    'data_source': '景点'
                }
            }



            Comment.aggregate([
                {
                    $match: match
                },
                {$group: {_id: "$comment_week", "value": filter['value']}},
                {$sort: {_id: 1}}

            ]).exec(function (err, result) {
                if (err)
                    reject(err);
                else
                    resolve(result);
            })
        } else {

                var   match = {
                    "data_region_search_key": data_region_search_key,
                    'comment_year': {$gte: start_time, $lte: end_time},
                    'data_source': '景点'
                };
            if(website != '全部平台'){
                var   match = {
                    "data_region_search_key": data_region_search_key,
                    'comment_year': {$gte: start_time, $lte: end_time},
                    'data_website': website,
                    'data_source': '景点'
                };
            }
            Comment.aggregate([
                {
                    $match: match
                },
                {$group: {_id: "$comment_year", "value": filter['value']}},
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
    //获取参数
    var start_time = req.body.startTime;
    var end_time = req.body.endTime;
    var website = req.body.websites;
    var time_seach_key = req.body.time;
    var spots = req.body.spots;
    var type = req.body.type;
    var filter;
    //根据type判断是统计评论数量还是评分
    if (type == "1") {
        filter = {"value": {"$sum": 1}};
    }
    else {
        filter = {"value": {"$avg": "$comment_score"}};
    }
    //后端默认加上千岛湖
    spots.push('千岛湖');
    var time_list = funcs.get_time_list(start_time, end_time, time_seach_key);
            var dic = {};
            var spot_promise = new Promise(function (resolve, reject) {
                var yAxis = [];
                spots.forEach((spot, spot_index) => {
                    var spot_dic = {};
                    var cnts = Array.apply(0, Array(time_list.length)).map(function (v, i) {
                        return "0";
                    });
                    ;
                    var db_promise = find_in_db(spot, start_time, end_time, website, filter, time_seach_key);       //从数据库中进行分成时间查询
                    db_promise.then(function (result) {

                        var i = 0;
                        var j = 0;
                        if(result.length == 0){
                            spot_dic['name'] = spot;
                            spot_dic['data'] = cnts;
                            yAxis.push(spot_dic);
                            if (yAxis.length == spots.length) {
                                resolve(yAxis);
                            }
                        }

                      else  for (; j < result.length;) {
                            if (time_list[i] == result[j]._id) {
                                cnts[i] = parseFloat((result[j].value).toFixed(2));
                                i++;
                                j++;
                            } else {
                                cnts[i] = 0;
                                i++;
                            }
                            if (j == result.length - 1) {
                                spot_dic['name'] = spot;
                                spot_dic['data'] = cnts;
                                yAxis.push(spot_dic);
                                if (yAxis.length == spots.length) {
                                    resolve(yAxis);
                                }
                            }
                        }
                    }).catch(function (err) {
                        logger.error('景区比较发生错误 接口：spotcompared 错误：' + err);
                        res.send({
                            "code": 12,
                            "message": "查询发生错误",
                            "data": {}
                        })

                    });


                })

            });

            spot_promise.then(function (yAxis) {
                dic['websites'] = website;
                dic['xAxis'] = time_list;
                dic['yAxis'] = yAxis;
                return res.send(
                    {
                        "code": 0,
                        "message": "",
                        "data": dic
                    });
            })

});
module.exports = router;
