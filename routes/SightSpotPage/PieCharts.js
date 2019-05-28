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
            shop_name_search_key: currSpot
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

    var yibanN1 = 0,
        yibanN2 = 0,
        jiaohaoN = 0,
        goodN = 0,
        niceN = 0;
    for (var i = 0; i < result.length; i++) {
        if (result[i]._id === 1) {
            yibanN1 = result[i].comment_content;
            continue;
        }
        if (result[i]._id === 2) {
            yibanN2 = result[i].comment_content;
            continue;
        }
        if (result[i]._id === 3) {
            jiaohaoN = result[i].comment_content;
            continue;
        }
        if (result[i]._id === 4) {
            goodN = result[i].comment_content;
            continue;
        }
        if (result[i]._id === 5) {
            niceN = result[1].comment_content;
            continue;
        }
    }

    var scoreList = [{
        name: "一般",
        value: yibanN1 + yibanN2
    }, {
        name: "较好",
        value: jiaohaoN
    }, {
        name: "好",
        value: goodN
    }, {
        name: "很棒",
        value: niceN
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