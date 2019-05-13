var express = require('express');
var router = express.Router();
var logger = require('log4js').getLogger("index");
//引进comment表
var CommentModels = require('./../dbs/spot/CommentModels');
var RegionInfoModels = require('./../dbs/RegionInfoModels');
//引入regionInfo
var Comment = CommentModels.Comment;
var RegionInfo = RegionInfoModels.Regioninfo;
var  spot_infos = require("./../commons/SpotInfos");
/* GET users listing. */
router.post('/', function (req, res, next) {
       //查看本年度的详情
        var year = new Date().getFullYear();
        var list = [];
        Comment.aggregate([
                {
                    $match: {
                        "data_source": "景点",
                        "comment_year": year.toString()
                    }
                },
                {
                    $group: {
                        _id: "$data_region_search_key",
                        "commentScore": {"$avg": "$comment_score"},
                        "commentNumber": {"$sum": 1}
                    },

                },
            {$sort: {commentNumber: -1}},

            ]).exec(function (err, result) {
             if(result.length == 18) {
                 res.send({
                     "code": 0,
                     "message": "",
                     "data": {
                         "list": result
                     }
                 })
             }else{
                 var spot_info = spot_infos;
                 //找出没有的景区进行删选
                 var list = [];
                 for(var i = 0; i < result.length;i++){
                     list.push(result[i]);
                     spot_info[result[i]._id] = 1;
                 }
                 for(var key in spot_info){
                     if(spot_info[key] == 0){
                         var dic = {
                             "_id":key,
                             commentNumber:0,
                             commentScore:0,
                         }
                     list.push(dic);
                     }
                 }
                 res.send({
                     "code":0,
                     "message":"",
                     data:{
                         "list":list
                     }
                 })
             }
        })

});
module.exports = router;
