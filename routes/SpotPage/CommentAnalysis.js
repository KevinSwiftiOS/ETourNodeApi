const express = require('express');
const router = express.Router();
const Spots = require('../../dbs/spot/CommentModels');

// 切换景区的适合调用的接口，返回好评数和差评数
router.post('/totalnumber', async (req, res) => {
    var currSpot = req.body.currSpot;
    console.log("currSpot")
     console.log(currSpot)
    var goodNumber = await Spots.aggregate([{
            $match: {
                data_region_search_key: currSpot,
                comment_content: {
                    $ne: ""
                },
                comment_score: {
                    $gt: 3
                }
            }
        },
        {
            $group: {
                _id: "$data_region_search_key",
                comment_content: {
                    "$sum": 1
                }
            }
        },
        {
            $project: {
                _id: 0,
                commentNumber: "$comment_content",
            }
        }
    ])
    var badNumber = await Spots.aggregate([{
            $match: {
                data_region_search_key: currSpot,
                comment_content: {
                    $ne: ""
                },
                comment_score: {
                    $gte: 0,
                    $lte: 3
                },
            }
        },
        {
            $group: {
                _id: "$data_region_search_key",
                comment_content: {
                    "$sum": 1
                }
            }
        },
        {
            $project: {
                _id: 0,
                commentNumber: "$comment_content",
            }
        }
    ])
    // console.log("goodNumber")
    //  console.log(goodNumber)
    // console.log("badNumber")
    // console.log(badNumber)
    res.send({
        code: 0,
        message: "",
        data: {
            goodNumber: goodNumber,
            badNumber: badNumber
        }
    })
})

// 点击分页按钮时请求的接口，初始页数为1
router.post('/commentlist', async (req, res) => {

    var currSpot = req.body.currSpot;
    var currPage = req.body.currPage;
    var pageSize = req.body.pageSize;
    var tagname = req.body.tagname;

    var matchObj = {};

    switch (tagname) {
        case "好评":
            matchObj['match'] = {
                data_region_search_key: currSpot,
                comment_score: {
                    $gt: 3
                },
                comment_content: {
                    $ne: ""
                }
            };
            break;
        case "差评":
            matchObj['match'] = {
                data_region_search_key: currSpot,
                comment_score: {
                    $gte: 0,
                    $lte: 3
                },
                comment_content: {
                    $ne: ""
                }
            }
            break;
    }

    var result = await Spots.aggregate([{
            $match: matchObj['match']
        },
        {
            $project: {
                _id: 0,
                content: "$comment_content"
            }
        },
        {
            $skip: (currPage - 1) * pageSize
        },
        {
            $limit: pageSize
        }
    ])
    // console.log(result)
    res.send({
        code: 0,
        message: "",
        data: {
            commentList: result
        }
    })
})
module.exports = router;