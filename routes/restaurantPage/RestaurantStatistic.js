//var mongoose = require('./db');
const express = require('express');
const comments = require('../../dbs/restaurant/RSComment');
const shops = require('../../dbs/restaurant/shops');
const router = express.Router();
const moment = require('moment');
// const util = require('util');
var logger = require('log4js').getLogger('index');

//mongoose.Promise = global.Promise;

router.get('/', async (req, res) => {
    const startDay = moment()
        .startOf('month')
        .format('YYYY-MM-DD');
    const endDay = moment()
        .endOf('month')
        .format('YYYY-MM-DD');
    try {
        const commentsCount = await getCommentCount(startDay, endDay);
        const commentsScoreAvg = await getCommentScoreAvg(startDay, endDay);
        const restaurantCount = await getRestaurantCount();
        const batCommentMonthly = await getBadCommentMonthly(startDay, endDay);
        res.send({
            code: 0,
            data: {
                commentsCount,
                commentsScoreAvg: commentsScoreAvg.toFixed(2),
                restaurantCount,
                batCommentMonthly,
            },
        });
    } catch (error) {
        res.send({
            code: 1,
            data: {},
            message: JSON.stringify(error),
        });
    }
});

const getCommentCount = async (startDay, endDay) => {
    return new Promise((resp, rej) => {
        comments.find({ comment_time: { $gte: startDay, $lte: endDay } }).count((err, count) => {
            if (err) {
                logger.error(err);
                rej(err);
            } else {
                resp(count);
            }
        });
    });
};

const getCommentScoreAvg = async (startDay, endDay) => {
    return new Promise((resp, rej) => {
        comments.aggregate(
            [
                { $match: { comment_time: { $gte: startDay, $lte: endDay } } },
                { $group: { _id: 'null', avg: { $avg: '$comment_score' } } },
            ],
            (err, res) => {
                if (err) {
                    rej(err);
                } else {
                    if (res.length == 0) {
                        resp(0);
                    } else {
                        const { avg } = res[0];
                        resp(avg);
                    }
                }
            },
        );
    });
};

const getRestaurantCount = async () => {
    return new Promise((resp, rej) => {
        shops.count(null, (err, count) => {
            if (err) {
                rej(err);
            } else {
                resp(count);
            }
        });
    });
};

const getBadCommentMonthly = async (startDay, endDay) => {
    return new Promise((resp, rej) => {
        comments
            .find({ comment_time: { $gte: '2019-01-01', $lte: '2019-01-31' }, comment_score: { $lte: 2 } })
            .count((err, count) => {
                if (err) {
                    logger.error(err);
                    rej(err);
                } else {
                    resp(count);
                }
            });
    });
};

//将model暴露出来供其他文件使用
module.exports = router;
