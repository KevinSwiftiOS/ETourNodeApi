var express = require('express');
var router = express.Router();
var logger = require('log4js').getLogger("index");
var HotelCommentModel = require('./../dbs/HotelCommentModel');
var HotelComment = HotelCommentModel.HotelComment
//引进HotelRegionModel表

// 酒店评分排序展示
router.post('/', function (req, res, next) {
    var hotelnameArray = req.body.hotelname;
    var hotelname = hotelnameArray[0];
    HotelComment.aggregate([
        {$match: {'shop_show_name': hotelname}},
        {$group: {_id: '$data_website', comment_num: {$sum: 1}}},
        {$project: {data_website: '$_id', _id: 0, comment_num: 1}},
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
