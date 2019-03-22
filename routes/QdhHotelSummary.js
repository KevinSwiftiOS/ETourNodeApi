var express = require('express');
var router = express.Router();
var logger = require('log4js').getLogger("index");
var HotelRegionModel = require('./../dbs/HotelRegionModel')
var HotelRegion = HotelRegionModel.HotelRegion

//引进HotelRegionModel表
// 返回当前等级的所有酒店，并包含分页功能
router.post('/', function (req, res, next) {
    var currpage = req.body.currpage;
    var hotelrate = req.body.hotelrate;
    var pageSize = req.body.pagesize;
    var sortWay = req.body.sortway;
    var matchObj = {}
    if(hotelrate == '星级酒店'){
        matchObj['shop_rate'] =  /星级/;
    }else{
        matchObj['shop_rate'] =  hotelrate;
    }
    var comment = {}
    if(sortWay == "commentScore"){
        comment['sortway'] = {$sort: {commentScore: -1}}
    }else  if(sortWay == "commentNumber"){
        comment['sortway'] = {$sort: {commentNumber: -1}}
    }else if(sortWay == "comment_health_grade"){
        comment['sortway'] = {$sort: {comment_health_grade: -1}}
    }else if(sortWay == "comment_location_grade"){
        comment['sortway'] = {$sort: {comment_location_grade: -1}}
    }else if(sortWay == "comment_service_grade"){
        comment['sortway'] = {$sort: {comment_service_grade: -1}}
    }else if(sortWay == "comment_facility_grade"){
        comment['sortway'] = {$sort: {comment_facility_grade: -1}}
    }

    HotelRegion.aggregate([
        {$match: {'shop_rate': matchObj['shop_rate'], "table_type" : "mixed_hotel_shop"}},
        comment['sortway'] ,
        {$project: {_id: 0, name: 1, address: 1, shop_rate: 1, commentScore: 1, commentNumber: 1, comment_service_grade : 1, comment_health_grade: 1, comment_location_grade: 1, comment_facility_grade: 1}},
        {$skip: pageSize*(currpage-1)},
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
        if(result.length == 21) {
            res.send({
                "code": 0,
                "message": "",
                "data": {
                    "list": result
                }
            })
        }else{

            var list = [];
            for(var i = 0; i < result.length;i++){
                list.push(result[i]);
            }
            res.send({
                "code":0,
                "message":"",
                data:{
                    "list":list
                }
            })
        }
    });


});
module.exports = router;
