var express = require('express');
var logger = require('log4js').getLogger("index");
var jwt = require('jsonwebtoken');
var router = express.Router();
var CommentModels = require('../../../dbs/CommentModels');
var funcs = require('../../../commons/common');
var Comment = CommentModels.Comment;

//登录接口
router.post('/', async(req, res) => {
    var lastThreeDate = funcs.getDay(new Date(),3);
    //向前减去93天
    var lastSeasonDate = funcs.getDay(new Date(),93);
   var spotlist =  await Comment.aggregate([
           {
               $match: {
                   "data_source": "景点",
                   "comment_time":{$gte: lastSeasonDate, $lte: lastThreeDate}

               }
           },
           {
               $group: {
                   _id: "$data_region_search_key",
                   "commentScore": {"$avg": "$comment_score"},
                   "commentNumber": {"$sum": 1}
               },

           },

           {$sort: {commentScore: -1}},
           {$limit: 10},
           {$project:{ _id:1,commentNumber:1,
                   commentScore:{$divide:[
                           {$subtract:[
                                   {$multiply:['$commentScore',100]},
                                   {$mod:[{$multiply:['$commentScore',100]}, 1]}
                               ]},
                           100]}
               }}
       ]);
    var qdhspotlist =  await Comment.aggregate([
        {
            $match: {
                "data_source": "景点",
                "data_region":"千岛湖",
                "comment_time":{$gte: lastSeasonDate, $lte: lastThreeDate}

            }
        },
        {
            $group: {
                _id: "$shop_name_search_key",
                "commentScore": {"$avg": "$comment_score"},
                "commentNumber": {"$sum": 1}
            },

        },

        {$sort: {commentScore: -1}},
        {$limit: 10},
        {$project:{ _id:1,commentNumber:1,
                commentScore:{$divide:[
                        {$subtract:[
                                {$multiply:['$commentScore',100]},
                                {$mod:[{$multiply:['$commentScore',100]}, 1]}
                            ]},
                        100]}
            }}
    ]);

  if(spotlist.length > 0){
      res.send({
          "code":0,
          "list":spotlist,
          "qdhlist":qdhspotlist,
          "message":""
      })
  }
});



;

module.exports = router;
