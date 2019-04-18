//var mongoose = require('./db');
const express = require('express');
const shops = require('../../dbs/restaurant/shops.js');
const router = express.Router();
const moment = require('moment');
// const util = require('util');
var logger = require('log4js').getLogger('index');

//mongoose.Promise = global.Promise;
// req 请求来的参数
// res 返回的数据
router.get('/', async (req, res) => {
    // const { startTime, endTime, time, selectBusinessCirle } = req.query;
    // req.query 里存储的值都是字符串
    // req.query 里是前端传递的params参数
    // const { type = '全部', site = '全部', page: unParsePage, pageSize: unParsePageSize } = req.query; // 解构赋值
    const type = req.query.type || '全部'; // type 不存在 默认值为'全部'
    const site = req.query.site || '全部';
    const unParsePage = req.query.page;
    const unParsePageSize = req.query.pageSize;

    let page = 0;
    let pageSize = 20;
    // 异常处理，当try代码块抛出异常时，会在catch里捕获异常，应用不会崩溃。
    try {
        if (unParsePage != null && unParsePage.length > 0) {
            page = parseInt(unParsePage);
        }
        if (unParsePageSize != null && unParsePageSize.length > 0) {
            pageSize = parseInt(unParsePageSize);
        }
    } catch (e) {
        logger.warn('page/pageSize is not a number', unParsePage, unParsePageSize);
    }
    let findQuery = {}; // 过滤信息用的对象
    if (type != '全部') {
        findQuery.shop_cook_style = type;
    }
    if (site != '全部') {
        findQuery.shop_site = site;
    }
    try {
        const totalCount = await shops.find(findQuery).count();
        logger.info(totalCount); // 打日志，在console里进行输出当前的 totalCount值
        let result = [];
        let pageObj = {
            page: page,
            pageSize: pageSize,
            total: totalCount,
        };
        if (page * pageSize < totalCount) {
            result = await shops
                .find(findQuery, {
                    _id: 1,
                    shop_img: 1,    // 图片
                    shop_name: 1,   // 店铺名
                    shop_url: 1,    // 店铺链接
                    shop_comment_num: 1,    // 评论数
                    shop_address: 1,    // 店铺地址
                    shop_score: 1,  //  店铺评分
                    shop_cook_style: 1, // 店铺类型
                    shop_site: 1,   // 店铺商圈
                    shop_price: 1,  // 人均
                    shop_env:1, // 环境
                    shop_taste:1,   // 口味
                    shop_service:1  // 服务
                }).sort({"shop_comment_num":1,"shop_score":1})
                .skip(page * pageSize) // 跳过多少条数据
                .limit(pageSize); // 从跳过数据开始数下面20条数据
                console.log(result);
            if (page * pageSize + pageSize < totalCount) {
                pageObj.next = page + 1;
            }
        }

        res.send({
            code: 0,
            data: result,
            page: pageObj,
        });
    } catch (error) {
        res.send({
            code: 1,
            message: error,
        });
    }
});

module.exports = router;
