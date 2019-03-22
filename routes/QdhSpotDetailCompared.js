var express = require('express');
var router = express.Router();
var logger = require('log4js').getLogger("index");
//引进comment表
var CommentModels = require('./../dbs/CommentModels');
var RegionInfoModels = require('./../dbs/RegionInfoModels');
//引入regionInfo
var Comment = CommentModels.Comment;
var RegionInfo = RegionInfoModels.Regioninfo;
/* GET users listing. */
var  qdh_spot_infos_dic = require("./../commons/QdhSpotInfosDic");
//数据库查询操作
function find_in_db(shop_name_search_key, time, time_seach_key, filter) {

    var promise = new Promise(function (resolve, reject) {

        if (time_seach_key == '月') {
            Comment.aggregate([
                {
                    $match: {
                        "data_region_search_key": '千岛湖',
                        'comment_month': time,
                        "data_source": '景点',
                        'shop_name_search_key':shop_name_search_key,
                    }
                },
                {$group: {_id: "$data_website", "value": filter['value']}},
                {$sort: {_id: 1}}

            ]).exec(function (err, result) {
                if (err)
                    reject(err);
                else {

                    resolve(result);
                }
            })
        } else if (time_seach_key == '周') {
            Comment.aggregate([
                {
                    $match: {
                        "data_region_search_key": '千岛湖', 'comment_week': time,
                        "data_source": '景点',
                        'shop_name_search_key':shop_name_search_key
                    }
                },
                {$group: {_id: "$data_website", "value": filter['value']}},
                {$sort: {_id: 1}}
            ]).exec(function (err, result) {
                if (err)
                    reject(err);
                else
                    resolve(result);
            })
        }
    })


    return promise;
}

//景区详情内的平台比较
router.post('/', function (req, res, next) {
    //获取景区id 需比较月份和类型时间比较颗粒度
    var cur_spot = req.body.qdh_cur_spot;
    var compared_time = req.body.compared_time;
    var type = req.body.type;
    var time_search_key = req.body.time;
    var filter;
    if (type == "1") {
        filter = {"value": {"$sum": 1}};
    }
    else {
        filter = {"value": {"$avg": "$comment_score"}};
    }
//七大旅游平台
    var websites = ['去哪儿', '大众点评', '携程', '途牛', '飞猪', '马蜂窝', '驴妈妈'];


//获得当前景区search_key
    var spots = [];
    //如果id不为1 加上千岛湖
    spots.push(cur_spot);

    //进行遍历查询
    var spot_promise = new Promise(function (resolve, reject) {
        var yAxis = [];
        spots.forEach((spot, spot_index) => {
            var spot_dic = {};
            var db_promise = find_in_db(spot, compared_time, time_search_key, filter);


            db_promise.then(function (result) {
                var cnts = [0, 0, 0, 0, 0, 0, 0];
                if(result.length == 0){
                    spot_dic['name'] = qdh_spot_infos_dic[spot].name;
                    spot_dic['data'] = cnts;
                    yAxis.push(spot_dic);
                    if (yAxis.length == spots.length)
                        resolve(yAxis);
                }


                else  for (var i = 0, j = 0; j < result.length;) {
                    if (websites[i] == result[j]._id) {

                        cnts[i] =  parseFloat((result[j].value).toFixed(2));
                        i++;
                        j++;
                    } else {
                        cnts[i] = 0;
                        i++;
                    }

                    if (j == result.length) {


                        spot_dic['name'] = qdh_spot_infos_dic[spot].name;
                        spot_dic['data'] = cnts;
                        yAxis.push(spot_dic);
                        if (yAxis.length == spots.length)
                            resolve(yAxis);

                    }
                }


            }).catch(function (err) {
                logger.error('景区详情比较发生错误 接口：spotdetailcompared 错误：' + err);
                res.send({
                    "code": 12,
                    "message": "查询发生错误",
                    "data": {}
                })

            })


        })

    })
    spot_promise.then(function (yAxis) {
        var data = {};
        data['xAxis'] = websites;
        data['yAxis'] = yAxis;
        res.send({
            "code": 0,
            "message": "",
            "data": data
        })
    })



});
module.exports = router;
