var express = require('express');
var logger = require('log4js').getLogger("index");
var router = express.Router();
var funcs = require('./../commons/common');
var HotelCommentModel = require('./../dbs/HotelCommentModel');
var HotelComment = HotelCommentModel.HotelComment

//比较酒店在不同平台上的评分数量
function find_in_db(hotelname, time, time_seach_key, filter) {

    var promise = new Promise(function (resolve, reject) {

        if (time_seach_key == '季') {
            HotelComment.aggregate([
                {
                    $match: {
                        "shop_show_name": hotelname, 'comment_season': time,
                        "data_source": '酒店', 'comment_grade': filter['comment_grade']
                    }
                },
                {$group: {_id: "$data_website", "value": filter['value']}},
                {$sort: {_id: 1}}

            ]).exec(function (err, result) {
                if (err)
                    reject(err);
                else {

                    resolve(result);
                }
            })
        }else if (time_seach_key == '月') {
            HotelComment.aggregate([
                {
                    $match: {
                        "shop_show_name": hotelname, 'comment_month': time,
                        "data_source": '酒店', 'comment_grade': filter['comment_grade']
                    }
                },
                {$group: {_id: "$data_website", "value": filter['value']}},
                {$sort: {_id: 1}}

            ]).exec(function (err, result) {
                if (err)
                    reject(err);
                else {

                    resolve(result);
                }
            })
        } else if (time_seach_key == '周') {
            HotelComment.aggregate([
                {
                    $match: {
                        "shop_show_name": hotelname, 'comment_week': time,
                        "data_source": '酒店', 'comment_grade': filter['comment_grade']
                    }
                },
                {$group: {_id: "$data_website", "value": filter['value']}},
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

//景区详情内的平台比较
router.post('/', function (req, res, next) {
    //获取景区id 需比较月份和类型时间比较颗粒度
    var hotels = [];
    hotels = req.body.hotelname;
    var compared_time = req.body.compared_time;
    var type = req.body.type;
    var time_search_key = req.body.time;

    var filter;
    if (type == "1") {
        filter = {"value": {"$sum": 1}, 'comment_grade': {$gte: 0}};
    }
    else {
        filter = {"value": {"$avg": "$comment_grade"}, 'comment_grade': {$ne: 0}};
    }
//四大旅游平台
    var websites = ['去哪儿', '大众点评', '携程', '艺龙'];
//获得当前景区search_key
    //进行遍历查询
    var hotel_promise = new Promise(function (resolve, reject) {
        var yAxis = [];
        hotels.forEach((hotel, hotelindex) => {
            var hotel_dic = {};
            var db_promise = find_in_db(hotel, compared_time, time_search_key, filter);
            db_promise.then(function (result) {
                var cnts = [0, 0, 0, 0];
                if(result.length == 0){
                    hotel_dic['name'] = hotel;
                    hotel_dic['data'] = cnts;
                    yAxis.push(hotel_dic);
                    if (yAxis.length == hotels.length){
                        resolve(yAxis);
                    }
                }
                else  for (var i = 0, j = 0; j < result.length;) {
                    if (websites[i] == result[j]._id) {
                        cnts[i] =  parseFloat((result[j].value).toFixed(2));
                        i++;
                        j++;
                    } else {
                        cnts[i] = 0;
                        i++;
                    }
                    if (j == result.length) {
                        hotel_dic['name'] = hotel;
                        hotel_dic['data'] = cnts;
                        yAxis.push(hotel_dic);
                        if (yAxis.length == hotels.length)
                            resolve(yAxis);
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
    hotel_promise.then(function (yAxis) {
        var data = {};
        data['xAxis'] = websites;
        data['yAxis'] = yAxis;
        res.send({
            "code": 0,
            "message": "",
            "data": data
        })
    })
});
module.exports = router;
