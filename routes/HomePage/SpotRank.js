var express = require('express');
var logger = require('log4js').getLogger("index");
var jwt = require('jsonwebtoken');
var router = express.Router();
var CommentModels = require('./../../dbs/CommentModels');
var funcs = require('./../../commons/common');
var Comment = CommentModels.Comment;

//登录接口
router.post('/', function (req, res, next) {
    var date = new Date();
    var nowYear = date.getFullYear();
    var nowMonth = date.getMonth() + 1;
    var season = funcs.get_curr_season(nowMonth);
    var nowSeason = (nowYear).toString() + "-" + (funcs.PrefixInteger(season, 2)).toString();
   var promise_1 = new Promise(function (resolve, reject) {

       Comment.aggregate([
           {
               $match: {
                   "data_source": "景点",
                   "comment_season": nowSeason,

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
           {$limit: 10},
           {$project:{ _id:1,commentNumber:1,
                   commentScore:{$divide:[
                           {$subtract:[
                                   {$multiply:['$commentScore',100]},
                                   {$mod:[{$multiply:['$commentScore',100]}, 1]}
                               ]},
                           100]}
               }}
       ]).exec(function (err, result) {
           if(err) {
               logger.error('千岛湖排行接口发生错误 接口：spotrank错误：' + err);
               res.send({
                   "code": 12,
                   "message": "查询发生错误",
                   "data": {}
               })
           }
           resolve(result);
       })
   });
   promise_1.then(function (spotlist) {
       Comment.aggregate([
           {
               $match: {
                   "data_source": "景点",
                   "comment_season": nowSeason,
                   "data_region":"千岛湖"

               }
           },
           {
               $group: {
                   _id: "$shop_name_search_key",
                   "commentScore": {"$avg": "$comment_score"},
                   "commentNumber": {"$sum": 1}
               },

           },
           {$sort: {commentNumber: -1}},
           {$limit: 10},
           {$project:{ _id:1,commentNumber:1,
                   commentScore:{$divide:[
                           {$subtract:[
                                   {$multiply:['$commentScore',100]},
                                   {$mod:[{$multiply:['$commentScore',100]}, 1]}
                               ]},
                           100]}
               }}
       ]).exec(function (err, result) {
           if(err) {
               logger.error('千岛湖排行接口发生错误 接口：spotrank错误：' + err);
               res.send({
                   "code": 12,
                   "message": "查询发生错误",
                   "data": {}
               })
           }
          var  data = {};
           //景区的排名和千岛湖景点的排名一起返回
           data['spotlist'] = spotlist;
           data['qdhspotlist'] = result;
           res.send({
               "code":0,
               "message":"",
               data:data
           })
       })
   })
});



;

module.exports = router;
