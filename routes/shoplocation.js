//var mongoose = require('./db');
var express = require('express');
var shops = require('../dbs/restaurant/shops');
var router = express.Router();
var logger = require('log4js').getLogger('index');
// const util = require('util');

//mongoose.Promise = global.Promise;

router.get('/', (req, res) => {
    shops.find(
        {
            shop_lng: { $ne: null },
            shop_lat: { $ne: null },
        },
        {
            shop_score: 1,
            shop_comment_num: 1,
            shop_lng: 1,
            shop_lat: 1,
            shop_name: 1,
            shop_address: 1,
            shop_cook_style: 1,
            shop_site: 1,
            _id: 0,
        },
        (err, doc) => {
            if (err) {
                logger.error('爬虫详情查询失败 接口：spiderdetail 错误：' + err);
                res.send({
                    code: 12,
                    message: `查询失败,${JSON.stringify(err)}`,
                    data: {},
                });
            } else {
                let result = doc.map(
                    ({ shop_score,shop_comment_num, shop_lng, shop_lat, shop_name, shop_address, shop_cook_style, shop_site }) => {
                        return {
                            score: shop_score,
                            lng: shop_lng,
                            lat: shop_lat,
                            value: shop_comment_num,
                            name: shop_name,
                            address: shop_address,
                            cookStyle: shop_cook_style,
                            site: shop_site,
                        };
                    },
                );
                res.send({
                    code: 0,
                    data: result,
                });
            }
        },
    );
});

//将model暴露出来供其他文件使用
module.exports = router;
