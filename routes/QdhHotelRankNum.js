var express = require('express');
var router = express.Router();
var logger = require('log4js').getLogger("index");
var HotelRegionModel = require('./../dbs/HotelRegionModel')
var HotelRegion = HotelRegionModel.HotelRegion
//引进HotelRegionModel表

// 获取当前等级相同的酒店
router.post('/', function (req, res, next) {
    HotelRegion.aggregate([
        {$match: {table_type: 'mixed_hotel_shop'}},
        {$group: {_id: '$shop_rate', rankNum:{$sum:1}}},
        {$project: {name:'$_id',latterAttr:'$rankNum', _id: 0}}
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
