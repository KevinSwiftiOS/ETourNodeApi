var express = require('express');
var router = express.Router();
var logger = require('log4js').getLogger("index");
var HotelRegionModel = require('./../dbs/HotelRegionModel')
var HotelCommentModel = require('./../dbs/HotelCommentModel')
var HotelRegion = HotelRegionModel.HotelRegion;
var HotelComment = HotelCommentModel.HotelComment

//引进HotelRegionModel表


router.post('/', function (req, res, next) {
    var year = new Date().getFullYear();

    HotelComment.aggregate([
        {$match: {'comment_year': year.toString()}},
        {$group: {'_id': '$shop_show_name', 'commentNumber': {$sum: 1}}},
        {$project: {name: '$_id', '_id': 0, latterAttr: '$commentNumber'}},
        {$sort: {'latterAttr': -1}},
        {$limit: 11}
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
            result.push({name: null, latterAttr: 20});
            var list = [];
            for(var i = 0; i < result.length;i++){
                if(result[i].name != null) {
                    list.push(result[i]);
                }
            }
            if(list.length == 11) {
                list.pop();
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
