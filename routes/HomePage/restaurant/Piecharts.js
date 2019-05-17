const express = require('express');
const comments = require('../../../dbs/restaurant/RSComment');
const router = express.Router();
const funcs = require('../../../commons/common');


function find_score_in_db(score, startTime, endTime) {
    var section = {}
    switch (score) {
        case "差":
            section['match'] = {
                $gt: 0.0,
                $lte: 3.0
            }
            break;
        case "较差":
            section['match'] = {
                $gt: 3.0,
                $lte: 4.0
            };
            break;
        case "良":
            section['match'] = {
                $gt: 4.0,
                $lte: 4.3
            };
            break;
        case "较好":
            section['match'] = {
                $gt: 4.3,
                $lte: 4.7
            };
            break;
        case "好":
            section['match'] = {
                $gt: 4.7,
                $lte: 5.0
            };
            break;
    }
     var startTime = funcs.getDay(new Date(), 93);
     var endTime = funcs.getDay(new Date(), 3);

     var promise = new Promise(function (resolve, reject) {
         comments.aggregate([{
                 $match: {
                     comment_time: {
                         $gte: startTime,
                         $lte: endTime
                     }
                 }
             },
             {
                 $group: {
                     _id: "$shop_name",
                     commentScore: {
                         $avg: "$our_score"
                     },
                     'commentNum': {
                         $sum: 1
                     }
                 }
             },
             {
                 $match: {
                     commentNum: {
                         $gte: 20
                     },
                     commentScore: section['match']
                 }
             },
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

router.post('/score', async function (req, res, next) {
    var currDate = new Date();
    var Year = currDate.getFullYear();
    var Month = currDate.getMonth(); // 为了保证 信息的完整新， 都会 获取到当前月份的前一个月
    var triDate = currDate.getDate() - 3; // 为了保证 信息的完整新， 都会 获取到当前月份的前一个月
    var endDate = Year + '-' + Month.toString().padStart(2, '0') + '-' + triDate.toString().padStart(2, 0);
    var startDate = funcs.getDay(currDate, 93);
    var commentScoreSection = ['(0.0, 3.0]', '(3.0, 4.0]', '(4.0, 4.3]', '(4.3, 4.7]', '(4.7, 5.0]'];
    var commentGrades = ['差', '较差', '良', '较好', '好'];
    var restaurant_promise = new Promise(function (resolve, reject) {
        var scoreList = [{
                "name": "",
                "value": 0
            },
            {
                "name": "",
                "value": 0
            },
            {
                "name": "",
                "value": 0
            },
            {
                "name": "",
                "value": 0
            },
            {
                "name": "",
                "value": 0
            }
        ];
        var findCount = 0;
        commentGrades.forEach((grade, gradeIndex) => {
            var db_promise = find_score_in_db(grade, startDate, endDate);
            db_promise.then(function (result) {
                findCount += 1;
                scoreList[gradeIndex].name = commentGrades[gradeIndex];
                scoreList[gradeIndex].value = result.length;
                if (findCount == commentGrades.length) {
                    resolve(scoreList);
                }
            }).catch(function (err) {
                logger.error('千岛湖餐饮单季度评论数量 接口：scorepiecharts 错误：' + err);
                res.send({
                    "code": 12,
                    "message": "查询发生错误",
                    "data": {}
                });
            })
        })
    }).then(function (scoreList) {
        res.send({
            "code": 0,
            "message": "",
            "data": {
                scoreList: scoreList
            }
        })
    })
})

function find_num_in_db(Grade, startDate, endDate) {
    var section = {}
    switch (Grade) {
        case "少":
            section['match'] = {
                $gt: 0.0,
                $lte: 15.0
            };
            break;
        case "较少":
            section['match'] = {
                $gt: 15.0,
                $lte: 40.0
            };
            break;
        case "一般":
            section['match'] = {
                $gt: 40.0,
                $lte: 70.0
            };
            break;

        case "多":
            section['match'] = {
                $gt: 70.0,
                $lte: 1000.0
            };
            break;
    }
         var startTime = funcs.getDay(new Date(), 93);
         var endTime = funcs.getDay(new Date(), 3);
    var promise = new Promise(function (resolve, reject) {
        comments.aggregate([{
                $match: {
                    comment_time: {
                        $gte: startTime,
                        $lte: endTime
                    }
                }
            },
            {
                $group: {
                    _id: "$shop_name",
                    'commentNum': {
                        $sum: 1
                    }
                }
            },
            {
                $match: {
                    commentNum: section['match']
                }
            }
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

// 获取全部餐饮 评分分布， 并生成 饼图
router.post('/num', async function (req, res, next) {
    var currDate = new Date();
    var Year = currDate.getFullYear();
    var Month = currDate.getMonth(); // 为了保证 信息的完整新， 都会 获取到当前月份的前一个月
    var triDate = currDate.getDate() - 3; // 为了保证 信息的完整新， 都会 获取到当前月份的前一个月
    var endDate = Year + '-' + Month.toString().padStart(2, '0') + '-' + triDate.toString().padStart(2, 0);
    var startDate = funcs.getDay(currDate, 93);
    var commentNumType = ['(0, 15]', '(15, 40]', '(40, 70]', '(70, 1000]']
    var commentGrades = ['少', '较少', '一般', '多'];
    var restaurant_promise = new Promise(function (resolve, reject) {
        var numberList = [{
                "name": "",
                "value": 0
            },
            {
                "name": "",
                "value": 0
            },
            {
                "name": "",
                "value": 0
            },
            {
                "name": "",
                "value": 0
            }
        ];
        var findCount = 0;
        commentGrades.forEach((grade, gradeIndex) => {
            var db_promise = find_num_in_db(grade, startDate, endDate);
            db_promise.then(function (result) {
                findCount += 1;
                numberList[gradeIndex].name = commentGrades[gradeIndex];
                numberList[gradeIndex].value = result.length;
                if (findCount == commentGrades.length) {
                    resolve(numberList);
                }
            }).catch(function (err) {
                logger.error('千岛湖酒店单季度评论数量 接口：numpiecharts 错误：' + err);
                res.send({
                    "code": 12,
                    "message": "查询发生错误",
                    "data": {}
                });
            })
        })
    }).then(function (numberList) {
        res.send({
            "code": 0,
            "message": "",
            "data": {
                numberList: numberList
            }
        })
    })
})
module.exports = router;