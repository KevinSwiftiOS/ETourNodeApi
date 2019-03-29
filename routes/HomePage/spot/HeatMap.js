var express = require('express');
var logger = require('log4js').getLogger("index");
var jwt = require('jsonwebtoken');
var router = express.Router();
var CommentModels = require('../../../dbs/CommentModels');
var funcs = require('../../../commons/common');
var qdh_spot_infos_dic = require("../../../commons/QdhSpotInfosDic");
var Comment = CommentModels.Comment;

//登录接口
router.post('/', async(req, res) => {

    var lastThreeDate = funcs.getDay(new Date(),3);
    //向前减去93天
    var lastSeasonDate = funcs.getDay(new Date(),93);
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
        {$project:{ _id:1,commentNumber:1,
                commentScore:{$divide:[
                        {$subtract:[
                                {$multiply:['$commentScore',100]},
                                {$mod:[{$multiply:['$commentScore',100]}, 1]}
                            ]},
                        100]}
            }}
    ]);
     for(var i = 0; i < qdhspotlist.length;i++){
         //经纬度的赋值
         qdhspotlist[i].lat = qdh_spot_infos_dic[qdhspotlist[i]._id].lat;
         qdhspotlist[i].lng = qdh_spot_infos_dic[qdhspotlist[i]._id].lng;
     }

    if(qdhspotlist.length > 0){
        res.send({
            "code":0,

            "list":qdhspotlist,
            "message":""
        })
    }
});



;

module.exports = router;
