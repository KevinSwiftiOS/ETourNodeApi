const express = require('express');
const router = express.Router();
const Spots = require('../../dbs/spot/CommentModels');
const funcs = require('../../commons/common');


router.post('/score', async (req, res) => {
    var currSpot = req.body.currSpot;
    var endDay = funcs.getDay(new Date(), 3);
    var year = endDay.substr(0, 5);
    var month = endDay.substr(5, 2);
    var Day = endDay.substr(7, 3)
    var startDay = year + "0"+(month - 3).toString() + Day;

    var result = await Spots.aggregate([{
        $match: {
            crawl_time: {
                $gte: startDay,
                $lte: endDay
            },
            comment_score: {
                $gt: 0.0
            },
            data_region_search_key: currSpot
        }
    }, {
        $group: {
            _id: "$comment_score",
            'comment_content': {
                $sum: 1
            }
        }
    }, {
        $match: {
            
        }
    }])

    var scoreList = [{
        name: "一般",
        value: result[1].comment_content + result[3].comment_content
    }, {
        name: "较好",
        value: result[0].comment_content + result[4].comment_content
    }, {
        name: "好",
        value: result[5].comment_content
    }, {
        name: "很棒",
        value: result[2].comment_content
    }];

    res.send({
        "code": 0,
        "message": "",
        "data": {
            scoreList: scoreList
        }
    })
})

module.exports = router;