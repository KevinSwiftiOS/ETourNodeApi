var express = require('express');


var router = express.Router();
var logger = require('log4js').getLogger("index");

var  SpotsComments = require('../../dbs/spot/CommentModels');
const RSComments = require('./../../dbs/restaurant/RSComment');
var HotelCommentModel = require('./../../dbs/hotel/HotelCommentModel');
var HotelComments = HotelCommentModel.HotelComment
function find_with_time(search_key,source,comment_time,res){
    SpotsComments.find({
            'data_region_search_key': search_key,
            'data_source': source,
            'comment_time': comment_time,
        },
        {

        }
    ).exec(function (err, data) {
        if (err) {
            logger.error('爬虫景区详情查询失败 接口：spiderdetail 错误：' + err);
            res.send({
                "code": 12,
                "message": "景区查询失败",
                "data": {}

            });
        } else {
            var detail_promise = new Promise(function (resolve, reject) {

                var list = [];
                if (data.length == 0)
                    resolve(list);
                else for (var i = 0; i < data.length; i++) {

                    var dic = {};
                    dic['comment_user_name'] = data[i].comment_user_name;
                    dic['comment_time'] = data[i].comment_time;
                    dic['shop_name'] = data[i].shop_name;
                    dic['comment_content'] = data[i].comment_content;
                    dic['comment_score'] = data[i].comment_score;
                    dic['comment_short_content'] = (data[i].comment_content).substr(0, 20) + "...";
                    dic['data_region'] = data[i].data_region;
                    dic['data_website'] = data[i].data_website;
                    dic['crawl_time'] = data[i].crawl_time;
                    dic['_id'] = data[i]._id;
                    list.push(dic);
                    if (list.length == data.length) {

                        resolve(list);
                    }
                }

            })
            detail_promise.then(function (data) {

                res.send({
                    "code": 0,
                    "message": "",
                    "data": {
                        "comment_time":comment_time,
                        "list": data
                    }
                })
            })
        }

    })

}

function find_with_restaurant_time(search_key,source,comment_time,res){
    RSComments.find({
            'data_region': search_key,
            'data_source': source,
            'comment_time': comment_time,
        },
        {

        }
    ).exec(function (err, data) {
        if (err) {
            logger.error('爬虫餐饮详情查询失败 接口：spiderdetail 错误：' + err);
            res.send({
                "code": 12,
                "message": "餐饮查询失败",
                "data": {}

            });
        } else {
            var detail_promise = new Promise(function (resolve, reject) {

                var list = [];
                if (data.length == 0)
                    resolve(list);
                else for (var i = 0; i < data.length; i++) {

                    var dic = {};
                    dic['comment_user_name'] = data[i].comment_user_name;
                    dic['comment_time'] = data[i].comment_time;
                    dic['shop_name'] = data[i].shop_name;
                    dic['comment_content'] = data[i].comment_content;
                    dic['comment_score'] = data[i].comment_score;
                    dic['comment_short_content'] = (data[i].comment_content).substr(0, 20) + "...";
                    dic['data_region'] = data[i].data_region;
                    dic['data_website'] = data[i].data_website;
                    dic['crawl_time'] = data[i].crawl_time;
                    dic['_id'] = data[i]._id;
                    list.push(dic);
                    if (list.length == data.length) {

                        resolve(list);
                    }
                }

            })
            detail_promise.then(function (data) {

                res.send({
                    "code": 0,
                    "message": "",
                    "data": {
                        "comment_time":comment_time,
                        "list": data
                    }
                })
            })
        }

    })

}

function find_with_hotel_time(search_key,source,comment_time,res){
    HotelComments.find({
            'data_region': search_key,
            'data_source': source,
            'comment_time': comment_time,
        },
        {

        }
    ).exec(function (err, data) {

        if (err) {
            logger.error('爬虫酒店详情查询失败 接口：spiderdetail 错误：' + err);
            res.send({
                "code": 12,
                "message": "酒店查询失败",
                "data": {}

            });
        } else {
            var detail_promise = new Promise(function (resolve, reject) {

                var list = [];
                if (data.length == 0)
                    resolve(list);
                else for (var i = 0; i < data.length; i++) {

                    var dic = {};
                    dic['comment_user_name'] = data[i].comment_user_name;
                    dic['comment_time'] = data[i].comment_time;
                    dic['shop_name'] = data[i].shop_name;
                    dic['comment_content'] = data[i].comment_content;
                    dic['comment_score'] = data[i].comment_grade;
                    dic['comment_short_content'] = (data[i].comment_content).substr(0, 20) + "...";
                    dic['data_region'] = data[i].data_region;
                    dic['data_website'] = data[i].data_website;
                    dic['crawl_time'] = data[i].crawl_time;
                    dic['_id'] = data[i]._id;
                    list.push(dic);
                    if (list.length == data.length) {

                        resolve(list);
                    }
                }

            })
            detail_promise.then(function (data) {

                res.send({
                    "code": 0,
                    "message": "",
                    "data": {
                        "comment_time":comment_time,
                        "list": data
                    }
                })
            })
        }

    })

}


//爬虫详情接口
router.post('/', function (req, res, next) {
    //获取景区名字 景区名字
    var search_key = req.body.spot;
    var comment_time = req.body.comment_time;
    var source = req.body.source;
    if(source == '景点') {
        //如果时间为空 表明需返回当前最新的评论时间
        if (comment_time == '') {
            SpotsComments.aggregate([
                {
                    $match: {
                        "data_source": source,
                        "data_region_search_key": search_key
                        ,

                    }
                },
                {
                    $group: {
                        _id: "$data_region_search_key",
                        "newest_comment_time": {$max: "$comment_time"}
                    }

                }]).exec(function (err, result) {
                if (err) {
                    logger.error('爬虫景区详情查询失败 接口：spiderdetail 错误：' + err);
                    res.send({
                        "code": 12,
                        "message": "景区查询失败",
                        "data": {}

                    });
                } else {
                    var newest_comment_time = result[0].newest_comment_time;
                    find_with_time(search_key, source, newest_comment_time, res);
                }
            });
        } else {
            find_with_time(search_key, source, comment_time, res);
        }
    }else if(source == "餐饮"){
        //如果时间为空 表明需返回当前最新的评论时间
        if (comment_time == '') {
            RSComments.aggregate([
                {
                    $match: {
                        "data_source": source,
                        "data_region": search_key
                        ,

                    }
                },
                {
                    $group: {
                        _id: "$data_region",
                        "newest_comment_time": {$max: "$comment_time"}
                    }

                }]).exec(function (err, result) {
                if (err) {
                    logger.error('爬虫餐饮详情查询失败 接口：spiderdetail 错误：' + err);
                    res.send({
                        "code": 12,
                        "message": "餐饮查询失败",
                        "data": {}

                    });
                } else {
                    //先默认显示到2019-03-31的，后面的有显示错误 爬虫还未解决
                    var newest_comment_time = result[0].newest_comment_time;
                    find_with_restaurant_time(search_key, source, '2019-03-31', res);
                }
            });
        } else {
            find_with_restaurant_time(search_key, source, comment_time, res);
        }
    }else{

        //如果时间为空 表明需返回当前最新的评论时间
        if (comment_time == '') {
            HotelComments.aggregate([
                {
                    $match: {
                        "data_source": source,
                        "data_region": search_key
                        ,

                    }
                },
                {
                    $group: {
                        _id: "$data_region",
                        "newest_comment_time": {$max: "$comment_time"}
                    }

                }]).exec(function (err, result) {
                if (err) {
                    logger.error('爬虫酒店详情查询失败 接口：spiderdetail 错误：' + err);
                    res.send({
                        "code": 12,
                        "message": "酒店查询失败",
                        "data": {}

                    });
                } else {
                    //先默认显示到2019-03-31的，后面的有显示错误 爬虫还未解决
                    var newest_comment_time = result[0].newest_comment_time;
                    find_with_hotel_time(search_key, source, newest_comment_time, res);
                }
            });
        } else {
            find_with_hotel_time(search_key, source, comment_time, res);
        }
    }
});

module.exports = router;
