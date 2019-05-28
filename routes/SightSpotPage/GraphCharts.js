const express = require('express');
const router = express.Router();
const Spots = require('../../dbs/spot/CommentModels');
const funcs = require('../../commons/common')
const trans = require('../../commons/timeTransformation')

function selectTimeType(timeType, startTime, endTime, searchKey) {
    var matchObj = {};
    switch (timeType) {
        case "按年份":
            matchObj['match'] = {
                "comment_year": {
                    $gte: startTime,
                    $lte: endTime
                },
                "shop_name_search_key": searchKey
            };
            break;
        case "按月份":
            matchObj['match'] = {
                "comment_month": {
                    $gte: startTime,
                    $lte: endTime
                },
                "shop_name_search_key": searchKey
            };
            break;
        case "按季度":
            matchObj['match'] = {
                "comment_season": {
                    $gte: startTime,
                    $lte: endTime
                },
                "shop_name_search_key": searchKey
            };
            break;
        case "自定义":
            matchObj['match'] = {
                "comment_time": {
                    $gte: startTime,
                    $lte: endTime
                },
                "shop_name_search_key": searchKey
            };
            break;
    }
    return matchObj;
}

function selectGranularity(granularity, scoreOrNum) {
    var groupObj = {};
    switch (granularity) {
        case "年":
            if (scoreOrNum === "score") {
                groupObj['group'] = {
                    _id: "$comment_year",
                    "commentScore": {
                        "$avg": "$comment_score"
                    },
                }
            } else {
                groupObj['group'] = {
                    _id: "$comment_year",
                    "comment_content": {
                        "$sum": 1
                    }
                }
            }
            break;
        case "月":
            if (scoreOrNum === "score") {
                groupObj['group'] = {
                    _id: "$comment_month",
                    "commentScore": {
                        "$avg": "$comment_score"
                    },
                }
            } else {
                groupObj['group'] = {
                    _id: "$comment_month",
                    "comment_content": {
                        "$sum": 1
                    }
                }
            }
            break;
        case "周":
            if (scoreOrNum === "score") {
                groupObj['group'] = {
                    _id: "$comment_week",
                    "commentScore": {
                        "$avg": "$comment_score"
                    },
                }
            } else {
                groupObj['group'] = {
                    _id: "$comment_week",
                    "comment_content": {
                        "$sum": 1
                    }
                }
            }
            break;
        case "季度":
            if (scoreOrNum === "score") {
                groupObj['group'] = {
                    _id: "$comment_season",
                    "commentScore": {
                        "$avg": "$comment_score"
                    },
                }
            } else {
                groupObj['group'] = {
                    _id: "$comment_season",
                    "comment_content": {
                        "$sum": 1
                    }
                }
            }
            break;
    }
    return groupObj;
}

function xTransformation(granularity, str) {
    if (granularity === '年') {
        return (str + "年");
    }
    if (granularity === '季度') {
        var year = str.substr(0, 4);
        var season = "";
        var seasonStr = str.substr(5, 2);
        if (seasonStr.substr(0, 1) === "0") {
            season = seasonStr.substr(1, 1);
        }else{
            season = seasonStr;
        }
        var newStr = year.toString() + '年第' + season.toString() + '季度';
        return newStr;
    }
    if (granularity === '月') {
        var year = str.substr(0, 4);
        var month = "";
        var monthStr = str.substr(5, 2);
       if (monthStr.substr(0, 1) === '0') {
           month = monthStr.substr(1, 1);
       } else {
           month = monthStr;
       }
        var newStr = year.toString() + '年' + month.toString() + '月';
        return newStr;
    }
    if (granularity === '周') {
        // console.log(str);
        var year = str.substr(0, 4);
        var week = str.substr(5, 2);
        var time = year.toString() + '年' + week.toString().padStart(2, 0) + '周';
        var newStr = trans.addDateText(time);
        return newStr;
    }
    return newStr;
}


router.post("/", async (req, res) => {
    var startTime = req.body.startTime;
    var endTime = req.body.endTime;
    var scoreOrNum = req.body.scoreOrNum;
    var granularity = req.body.granularity;
    var tags = req.body.tags;
    var timeType = req.body.timeType;
    // console.log(startTime)
    // console.log(endTime)
    // console.log(granularity)
    // console.log(timeType)
    // console.log(scoreOrNum)
    var xAxis = [];
    var series = [];
    var legendData = [];
    var obj={};
    var temp = [];
    var tagsArray = [];
    var projectObj = {};
    if (typeof (tags) === "string") {
        tagsArray.push(tags)
    } else {
        for (var i = 0; i < tags.length; i++) {
            tagsArray.push(tags[i])
        }
    }
    if (scoreOrNum === "score") {
        projectObj['project'] = {
            "_id": "$_id",
            commentScore: {
                $divide: [{
                    $subtract: [
                        {$multiply: ['$commentScore', 100]},
                        {$mod: [{$multiply: ['$commentScore', 100]}, 1]}
                    ]
                }, 100]
            }
        };
    } else {
        projectObj['project'] = {
            "_id": "$_id",
            "commentNumber": "$comment_content"
        }
    }
    for (var i = 0; i < tagsArray.length; i++) {
        var searchKey = tagsArray[i];
        var data = [];
        var matchObj = selectTimeType(timeType, startTime, endTime, searchKey);
        var groupObj = selectGranularity(granularity, scoreOrNum);
        temp = await Spots.aggregate([{
                $match: matchObj['match']
            }, {
                $group: groupObj['group']
            }, {
                $project: projectObj['project']
            },
            {
                $sort: {
                    _id: 1
                }
            }
        ])

        if (scoreOrNum === "score") {
            for (var j = 0; j < temp.length; j++) {
                data.push(temp[j].commentScore)
            }
        } else {
            for (var j = 0; j < temp.length; j++) {
                data.push(temp[j].commentNumber)
            }
        }
        obj['data'] = data;
        obj['type'] = 'line';
        obj['name'] = searchKey;
        legendData.push(searchKey);
        series.push(obj);
        // data.unshift(searchKey);
        // result.push(data)
    }
    for (var i = 0; i < temp.length; i++) {
        var x = xTransformation(granularity, temp[i]._id);
        xAxis.push(x)
    }
    // if (typeof (tags) !== "string") {
    //     xAxis.unshift('time')
    //     result.unshift(xAxis);
    // }
    // console.log(result)
    res.send({
        code: 0,
        message: "",
        data: {
            legendData:legendData,
            xAxis:xAxis,
            seriesData:series
        }
    })
})
module.exports = router;