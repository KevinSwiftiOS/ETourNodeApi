var express = require('express');
var router = express.Router();
var logger = require('log4js').getLogger("index");
//引进comment表
var CommentModels = require('./../dbs/spot/CommentModels');
var InnerRegioninfoModels = require('./../dbs/InnerRegionInfoModels');
//引入regionInfo
var funcs = require('./../commons/common');
var Comment = CommentModels.Comment;
var InnerRegioninfo = InnerRegioninfoModels.InnerRegioninfo;
var qdh_spot_infos = require("./../commons/QdhSpotInfos");
/* GET users listing. */
router.post('/', function (req, res, next) {
    var date = new Date();
    var nowYear = date.getFullYear();
    var nowMonth = date.getMonth() + 1;
    var season = funcs.get_curr_season(nowMonth);
    var nowSeason = (nowYear).toString() + "-" + (funcs.PrefixInteger(season, 2)).toString();
    Comment.aggregate([
        {
            $match: {
                "data_region_search_key": '千岛湖',
                'data_source': '景点',
                "comment_season": nowSeason
            }
        },
        {
            $group: {
                _id: "$shop_name_search_key",
                "commentScore": {"$avg": "$comment_score"},
                "commentNumber": {"$sum": 1}
            }
        },
        {$sort: {commentNumber: -1}},
    ]).exec(function (err, result) {
        if (err) {
            logger.error('千岛湖景区景点查询发生错误 接口：qdhspotlist 错误：' + err);
            res.send({
                "code": 12,
                "message": "查询发生错误",
                "data": {}
            })
        }
        if (result.length == 21) {
            res.send({
                "code": 0,
                "message": "",
                "data": {
                    "list": result
                }
            })
        } else {
            var qdh_spot_info = qdh_spot_infos;
            //找出没有的千岛湖景点进行删选
            var list = [];
            for (var i = 0; i < result.length; i++) {
                list.push(result[i]);
                qdh_spot_info[result[i]._id] = 1;
            }
            for (var key in qdh_spot_info) {
                if (qdh_spot_info[key] == 0) {
                    var dic = {
                        "_id": key,
                        commentNumber: 0,
                        commentScore: 0,
                    }
                    list.push(dic);
                }
            }

            res.send({
                "code": 0,
                "message": "",
                data: {
                    "list": list
                }
            })
        }
    });

});
module.exports = router;
