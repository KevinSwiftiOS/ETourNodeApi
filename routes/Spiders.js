var express = require('express');


var router = express.Router();
var logger = require('log4js').getLogger("index");
var RegionInfoModels = require('./../dbs/RegionInfoModels');
var RegionInfo = RegionInfoModels.Regioninfo;
var CommentModels = require('./../dbs/spot/CommentModels');
var Comment = CommentModels.Comment;
function find_with_time(search_key,website,source,comment_time,res){
    Comment.find({
            'data_region_search_key': search_key,
            'data_website': website,
            'data_source': source,
            'comment_time': comment_time,
        },
        {

        }
    ).exec(function (err, data) {
        if (err) {
            logger.error('爬虫详情查询失败 接口：spiderdetail 错误：' + err);
            res.send({
                "code": 12,
                "message": "查询失败",
                "data": {}

            });
        } else {
            var detail_promise = new Promise(function (resolve, reject) {

                var list = [];
                if (data.length == 0)
                    resolve(list);
                else for (var i = 0; i < data.length; i++) {

                    var dic = {};
                    dic['comment_user_name'] = data[i].comment_user_name;
                    dic['comment_time'] = data[i].comment_time;
                    dic['shop_name'] = data[i].shop_name;
                    dic['comment_content'] = data[i].comment_content;
                    dic['comment_score'] = data[i].comment_score;
                    dic['comment_short_content'] = (data[i].comment_content).substr(0, 20) + "...";
                    dic['data_region'] = data[i].data_region;
                    dic['data_website'] = data[i].data_website;
                    dic['crawl_time'] = data[i].crawl_time;
                    dic['_id'] = data[i]._id;
                    list.push(dic);
                    if (list.length == data.length) {

                        resolve(list);
                    }
                }

            })
            detail_promise.then(function (data) {

                res.send({
                    "code": 0,
                    "message": "",
                    "data": {
                        "comment_time":comment_time,
                        "list": data
                    }
                })
            })
        }

    })

}

//爬虫详情接口
router.post('/', function (req, res, next) {
    //获取景区名字 景区名字
    var search_key = req.body.spot;
    var comment_time = req.body.comment_time;
    var source = req.body.source;
    var website = req.body.website;
    //如果时间为空 表明需返回当前最新的评论时间
    if(comment_time == '') {
        Comment.aggregate([
            {
                $match: {
                    "data_source": "景点",
                    "data_region_search_key": search_key
                    ,
                    "data_website": website
                }
            },
            {
                $group: {
                    _id: "$data_region_search_key",
                    "newest_comment_time": {$max: "$comment_time"}
                }

            }]).exec(function (err, result) {
            if (err) {
                logger.error('爬虫详情查询失败 接口：spiderdetail 错误：' + err);
                res.send({
                    "code": 12,
                    "message": "查询失败",
                    "data": {}

                });
            } else {
                var newest_comment_time = result[0].newest_comment_time;
                find_with_time(search_key,website,source,newest_comment_time,res);
            }
        });
    }else{
        find_with_time(search_key,website,source,comment_time,res);
    }
});

module.exports = router;
