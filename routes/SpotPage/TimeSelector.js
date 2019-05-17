const express = require('express');
const router = express.Router();
const Spots = require('../../dbs/spot/CommentModels');
const funcs = require('../../commons/common')

function selectTimeType(timeType, startTime, endTime, searchKey) {
    var matchObj = {};
    switch (timeType) {
        case "按年份":
            matchObj['match'] = {
                "comment_year": {
                    $gte: startTime,
                    $lte: endTime
                },
                "data_region_search_key": searchKey
            };
            break;
        case "按月份":
            matchObj['match'] = {
                "comment_month": {
                    $gte: startTime,
                    $lte: endTime
                },
                "data_region_search_key": searchKey
            };
            break;
        case "按季度":
            matchObj['match'] = {
                "comment_season": {
                    $gte: startTime,
                    $lte: endTime
                },
                "data_region_search_key": searchKey
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
router.post("/", async (req, res) => {
    var startTime = req.body.startTime;
    var endTime = req.body.endTime;
    var scoreOrNum = req.body.scoreOrNum;
    var granularity = req.body.granularity;
    var tags = req.body.tags;
    var timeType = req.body.timeType;
    console.log(startTime)
    console.log(endTime)
    console.log(scoreOrNum)
    console.log(timeType);

    var data = [];
    var xAxis = [];
    var result = [];
    var temp = [];
    var projectObj = {};
    if (scoreOrNum === "score") {
        projectObj['project'] = {
            "_id": "$_id",
            commentScore: {
                $divide: [{
                        $subtract: [{
                                $multiply: ['$commentScore', 100]
                            },
                            {
                                $mod: [{
                                    $multiply: ['$commentScore', 100]
                                }, 1]
                            }
                        ]
                    },
                    100
                ]
            }
        };
    } else {
        projectObj['project'] = {
            "_id": "$_id",
            "commentNumber": "$comment_content"
        }
    }
    for (var i = 0; i < tags.length; i++) {
        var searchKey = tags[i].value;
        var matchObj = selectTimeType(timeType, startTime, endTime, searchKey);
        var groupObj = selectGranularity(granularity,scoreOrNum);

        temp = await Spots.aggregate([{
            $match: matchObj['match']
        }, {
            $group: groupObj['group']
        }, {
            $project: projectObj['project']
        }, {
            $sort: {
                _id: 1
            }
        }])
        for (var j = 0; j < temp.length; j++) {
            data.push(temp[j].commentScore)
        }
        data.unshift(searchKey);
        result.push(data)
    }
    for (var i = 0; i < temp.length; i++) {
        xAxis.push(temp[i]._id)
    }
    xAxis.unshift('time')
    result.unshift(xAxis);

    console.log(result)
    res.send({
        code: 0,
        message: "",
        data: {
            dataset: result
        }
    })
})
module.exports = router;