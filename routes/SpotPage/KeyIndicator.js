const express = require('express');
const router = express.Router();

const Spots = require('../../dbs/spot/CommentModels');
const funcs = require('../../commons/common')


// 排序函数
function compared(property) {
    return (a, b) => {
       var value1 = a[property];
       var value2 = b[property];
       return (value1 - value2) * -1;
    }
}
// 返回指定景区的本月最新数据和排行
router.post('/', async (req, res) => {

    var endTime = funcs.getDay(new Date(), 3);
    var nowMonthYear = endTime.substr(0, 8);
    var startTime = nowMonthYear.toString() + "01";

    var result = await Spots.aggregate([
        {
            $match: {
                "crawl_time": {
                    $gte: startTime,
                    $lte: endTime
                },
                "data_region_search_key": {
                    $ne: ""
                }
            }
        },
        {
            $group: {
                _id: "$data_region_search_key",
                "commentScore": {
                    "$avg": "$comment_score"
                },
                "comment_content": {
                    "$sum": 1
                }
            }
        }, {
            $project: {
                "_id": "$_id",
                commentNumber: "$comment_content",
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
            }
        },
        {
            $sort: {
                commentScore: -1
            }
        },
    ])
    console.log(result.length)
    var commentNumber = [];
    for(var i = 0; i< result.length; i++){
        commentNumber[i] = result[i];
    }
    console.log(commentNumber.length)
    console.log(result.length)
    var commentNumberSort = commentNumber.sort(compared('commentNumber'));

    res.send({
        code: 0,
        message: "",
        data: {
            commentScoreSort: result,
            commentNumberSort: commentNumberSort
        }
    })
})

router.post('/variation', async (req, res) =>{
    console.log(req.body.currSpot)
    var currSpot = req.body.currSpot;
    var endTime = funcs.getDay(new Date(), 3);
    var nowMonthYear = endTime.substr(0, 8);
    var startTime = nowMonthYear.toString() + "01";
    
    var month = endTime.substr(5,2);
    var year = endTime.substr(0,5)
    var lastMonth = year.toString() + (month-1).toString().padStart(2, 0);

    var thisMonthData = await Spots.aggregate([
        {
            $match:{
               "data_region_search_key": currSpot,
                "crawl_time": {
                    $gte: startTime,
                    $lte: endTime
                },
            }
        }, {
            $group: {
                _id: "$data_region_search_key",
                "commentScore": {
                    "$avg": "$comment_score"
                },
                "comment_content": {
                    "$sum": 1
                }
            }
        }, {
            $project: {
                "_id": "$_id",
                commentNumber: "$comment_content",
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
            }
        },
    ]);
    var lastMonthData = await Spots.aggregate([{
        $match: {
            "data_region_search_key": currSpot,
            "comment_month": lastMonth
        }
    }, {
        $group: {
            _id: "$data_region_search_key",
            "commentScore": {
                "$avg": "$comment_score"
            },
            "comment_content": {
                "$sum": 1
            }
        }
    }, {
        $project: {
            "_id": "$_id",
            commentNumber: "$comment_content",
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
        }
    }, ]);
    console.log(thisMonthData)
    console.log(lastMonthData)
    var numVariation = thisMonthData[0].commentNumber - lastMonthData[0].commentNumber;
    if(numVariation>0){
        numVariation = "+ "+numVariation;
    }
    if(numVariation<0){
        numVariation = "- "+Math.abs(numVariation)
    }
    var scoreVariation = (thisMonthData[0].commentScore - lastMonthData[0].commentScore).toFixed(2);
        if (scoreVariation > 0) {
            scoreVariation = "+ " + scoreVariation;
        }
        if (scoreVariation < 0) {
            scoreVariation = "- " + Math.abs(scoreVariation)
        }
    res.send({
        code:0,
        message:"",
        data:{
            numVariation:numVariation,
            scoreVariation:scoreVariation
        }
    })

})

module.exports = router;