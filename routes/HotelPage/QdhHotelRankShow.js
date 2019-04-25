// 查询本季度 评分比较靠前的前十名
var express = require('express');
var logger = require('log4js').getLogger("index");
var router = express.Router();
var funcs = require('./../../commons/common');
var HotelCommentModel = require('./../../dbs/HotelCommentModel');
var HotelComment = HotelCommentModel.HotelComment;

// 获取景点 本年评-论数量
function find_limit_hotel(startDate, endDate, sortWay, commentNumLimit) {
    var sortDict = {}
    switch (sortWay) {
        case "前十名":
            sortDict['sortway'] = {commentScore: -1}
            break;
        case "后十名":
            sortDict['sortway'] = {commentScore: 1}
            break;
    }
    var promise = new Promise(function (resolve, reject) {
        HotelComment.aggregate([
            {$match: {'comment_time': {$gte: startDate, $lte: endDate}, 'comment_grade': {$ne: 0}}},
            {$group: {_id: '$shop_show_name', 'commentScore': {$avg: '$comment_weighted_grade'}, 'commentNumber': {$sum: 1}, 'shopRate':{$first: '$shop_rate'}}},
            {$match: {commentNumber: commentNumLimit['limitnum']}},
            {$sort: sortDict['sortway']},
            {$limit: 10},
        ]).exec(function (err, result) {
            if (err)
                reject(err);
            else {
                resolve(result);
            }
        })
    })
    return promise;
}

router.post('/', async (req, res) => {
    var endDate = funcs.getDay(new Date(), 3);
    var startDate = funcs.getDay(new Date(), 93);
    var commentNumLimit = {}
    var Month = parseInt(endDate.substr(5, 2));

    if(Month == 1 || Month == 2 || Month == 12 ) {
        commentNumLimit['limitnum'] = {$gte: 40};
    }else if(Month == 8 || Month == 9 || Month == 10 ) {
        commentNumLimit['limitnum'] = {$gte: 80};
    }else{
        commentNumLimit['limitnum'] = {$gte: 60};
    }
    var sortWays = ['前十名', '后十名'];
    var goodList = await HotelComment.aggregate([
        {$match: {'comment_time': {$gte: startDate, $lte: endDate}, 'comment_grade': {$ne: 0}}},
        {$group: {_id: '$shop_show_name', 'commentScore': {$avg: '$comment_weighted_grade'}, 'commentNumber': {$sum: 1}, 'shopRate':{$first: '$shop_rate'}}},
        {$match: {commentNumber: commentNumLimit['limitnum']}},
        {$sort: {commentScore: -1}},
        {$limit: 10},
    ]);
    var badList = await HotelComment.aggregate([
        {$match: {'comment_time': {$gte: startDate, $lte: endDate}, 'comment_grade': {$ne: 0}}},
        {$group: {_id: '$shop_show_name', 'commentScore': {$avg: '$comment_weighted_grade'}, 'commentNumber': {$sum: 1}, 'shopRate':{$first: '$shop_rate'}}},
        {$match: {commentNumber: commentNumLimit['limitnum']}},
        {$sort: {commentScore: 1}},
        {$limit: 10},
    ])
    var commentNumList= await HotelComment.aggregate([
        {$match: {'comment_time': {$gte: startDate, $lte: endDate}, 'comment_grade': {$ne: 0}}},
        {$group: {_id: '$shop_show_name', 'commentScore': {$avg: '$comment_weighted_grade'}, 'commentNumber': {$sum: 1}, 'shopRate':{$first: '$shop_rate'}}},
        {$sort: {commentNumber: -1}},
        {$limit: 10},
    ])
    for(var i = 0; i < goodList.length; i++) {
        goodList[i].commentScore = parseFloat((goodList[i].commentScore).toFixed(2));
    }
    for(var i = 0; i < badList.length; i++) {
        badList[i].commentScore = parseFloat((badList[i].commentScore).toFixed(2));
    }
    badList = badList.reverse() ;
    for(var i = 0; i < commentNumList.length; i++) {
        commentNumList[i].commentScore = parseFloat((commentNumList[i].commentScore).toFixed(2));
    }
    res.send({
        "code": 0,
        "message": "",
        "data": {
            goodList: goodList,
            badList: badList,
            commentNumList:commentNumList
        }
    })

})
module.exports = router;

