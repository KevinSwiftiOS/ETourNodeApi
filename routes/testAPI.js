var express = require('express');

router = express.Router();
//引进comment表
var CommentModels = require('./../dbs/CommentModels');
var RegionInfoModels = require('./../dbs/RegionInfoModels');
//引入regionInfo
var Comment = CommentModels.Comment;
var RegionInfo = RegionInfoModels.Regioninfo;
/* GET users listing. */
function find(spot,time,website,filter){
    var a = new Promise(function (resolve, reject) {
        var spotReg = new RegExp(spot,'i');
        var timeReg = new RegExp(time,'i');
          Comment.aggregate([
            { $match : {"data_region" :{$regex: spotReg},'comment_time':{$regex: timeReg},'data_website':website}},
            {$group:{_id:"$data_region","value":filter['value']}}

        ]).exec(function (err,result) {

            resolve(result);
        })
    })


return a;
}
router.get('/', function(req, res, next) {
    var time_search_keys = {
        '月':'comment_time', //后期需进行修改
        '周':'comment_week',
        '天':'comment_day'
    };

    var  filter = {"value":  {"$sum": 1}};
            console.log(11111);
            var spots = ['西湖'];
            var websites = ['去哪儿'];
            var times = ['2018-09'];

            var website = '携程';
            websites.forEach((website,website_index) => {

      spots.forEach((spot,spot_index) => {
          times.forEach((time, time_index) => {
           var a = find(spot,time,website,filter);
            a.then(function (result) {
                console.log(22222);
                console.log(result);
            })
          })
      })
      })




});
module.exports = router;
