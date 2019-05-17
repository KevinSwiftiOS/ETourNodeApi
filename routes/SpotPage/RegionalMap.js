const express = require('express');
const router = express.Router();

const Spots = require('../../dbs/spot/CommentModels');
const spotDetails = require('./components/spotInf');


// 返回不同景区的所有信息，做地图使用
router.post('/',async (req, res) => {

   var result = await Spots.aggregate([{
            $match: {
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
    ])
    for (var i = 0; i < result.length; i++) {
        for (var j = 0; j < spotDetails.length; j++) {
            if (result[i]._id === spotDetails[j].id) {
                result[i].lng = spotDetails[j].lng;
                result[i].lat = spotDetails[j].lat;
                result[i].name = spotDetails[j].name,
                    result[i].address = spotDetails[j].address
                break;
            }
        }
    }
    res.send({
        code: 0,
        message: "",
        data: {
            spotList: result
        }
    })
})
module.exports = router;