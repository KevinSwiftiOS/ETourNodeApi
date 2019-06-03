var express = require('express');
var router = express.Router();
var HotelRegion = require('../../dbs/hotel/HotelRegionModel');

function compare(value1, value2){
    if (value1.sortl < value2.sortl) {
        return 1;
    } else if (value1.sortl > value2.sortl) {
        return -1;
    }else{
        return 0;
    }
}

/*
 * 获取同商圈的酒店个数
 * */
router.post('/selectlist', async (req, res) => {
    var tradeArea = req.body.businessArea;
    var result = [];
    if (tradeArea == '全部') {
        result = await HotelRegion.aggregate([{
            $match: {
                "table_type": "mixed_hotel_shop"
            }
        }, {
            $group: {
                _id: "$shop_rate",
                "countNum": {
                    "$sum": 1
                }
            }

        }])
    } else {
        result = (await HotelRegion.aggregate([{
                $match: {
                    "table_type": "mixed_hotel_shop",
                    "tradeArea": tradeArea
                }
            },
            {
                $group: {
                    _id: "$shop_rate",
                    "countNum": {
                        "$sum": 1
                    }
                }
            }
        ]));
    }
    var totalNum = 0;
    for(var i = 0; i<result.length;i++){
        totalNum += result[i].countNum;
    }
    var obj = {
        _id: "全部",
        countNum: totalNum,
    }
    result.unshift(obj);
 
    for(var i = 0; i<result.length; i++){
        if(result[i]._id === "全部"){
            result[i].sortl = 6;
            continue;
        }
        if(result[i]._id === "五星级/豪华型"){
            result[i].sortl = 5;
            continue;
        }
        if (result[i]._id === "四星级/高档型") {
            result[i].sortl = 4;
            continue;
        }
        if (result[i]._id === "三星级/舒适型") {
            result[i].sortl = 3;
            continue;
        }
        if (result[i]._id === "经济型") {
            result[i].sortl = 2;
            continue;
        }
        if (result[i]._id === "客栈民宿") {
            result[i].sortl = 1;
            continue;
        }
    }
    result.sort(compare);

    res.send({
        "code": 0,
        "message": "",
        "data": {
            "hotelShopList": result
        }
    })
});
/*
 * 获取酒店列表
 * */
router.post('/shoplist', async (req, res) => {
    // params: {
    //     businessArea: // 商圈。（默认加载全部 businessArea: ”全部“）
    //     hotelRate： //酒店等级（默认加载全部 hotelrate: ”全部“）
    //     pageSize： //每页显示餐馆数量
    //     sortWay： //排序方式，降序传1，升序传2 默认传1
    //     commentType: //排序关键字，按照评分传1，按照评论数量传2 默认传1
    //     currPage： // 当前页面
    // }
   
    var tradeArea = req.body.businessArea;
    var hotelRate = req.body.hotelRate;
    var pageSize = req.body.pageSize;
    var sortWay = req.body.sortWay;
    var commentType = req.body.commentType;
    var currPage = req.body.currPage;
    var sortdic = {};

    if (commentType == 1 && sortWay == 1) {
        sortdic = {
            commentScore: 1
        };
    } else if (commentType == 1 && sortWay == -1) {
        sortdic = {
            commentScore: -1
        };
    } else if (commentType == 2 && sortWay == 1) {
        sortdic = {
            commentNumber: 1
        };
    } else {
        sortdic = {
            commentNumber: -1
        };
    }
    // var hotelsitereg = new RegExp(tradeArea, 'i');
    // var hoteltrendreg = new RegExp(hotelRate, 'i');

    var dic = {
        $match: {}
    };

    if (tradeArea == "全部" && hotelRate == "全部") {
        dic = {
            $match: {
                "table_type": "mixed_hotel_shop",
            }
        };
    } else if (tradeArea == "全部" && hotelRate != "全部") {
        dic = {
            $match: {
                "table_type": "mixed_hotel_shop",
                "shop_rate": hotelRate,
                // "shop_rate": {
                //     $regex: hoteltrendreg
                // },
            }
        };
    } else if (tradeArea != "全部" && hotelRate == "全部") {
        dic = {
            $match: {
                "table_type": "mixed_hotel_shop",
                "tradeArea": tradeArea,
                // "tradeArea": {
                //     $regex: hotelsitereg
                // },

            }
        };
    } else {
        dic = {
            $match: {
                "table_type": "mixed_hotel_shop",
                "tradeArea": tradeArea,
                 "shop_rate": hotelRate,
                // "tradeArea": {
                //     $regex: hotelsitereg
                // },
                // "shop_rate": {
                //     $regex: hoteltrendreg
                // },
            }
        };
    }
      
    var hotel = await HotelRegion.aggregate([
        dic,
        {
            $sort: sortdic
        },
        {
            $project: {
                _id: 0,
                name: 1,
                address: 1,
                shop_rate: 1,
                commentScore: 1,
                commentNumber: 1,
                comment_service_grade: 1,
                comment_health_grade: 1,
                comment_location_grade: 1,
                comment_facility_grade: 1
            }
        },
    ])
    var result = []; //表示最终的数组
    if (currPage * pageSize <= hotel.length){
        var ends = currPage * pageSize;
    } else {
        ends = hotel.length;
    }
    for (var i = (currPage - 1) * pageSize; i < ends; i++) {
        result.push(hotel[i]);
    }
    var totalPage = Math.ceil(hotel.length / pageSize);
    // console.log(totalPage);
    res.send({
        data: {
            hotellist: result
        },
        "page": {
            "currPage": currPage,
            "pageSize": result.length,
            "totalPage": totalPage,
            "next": currPage + 1 <= totalPage ? currPage + 1 : "",
            "total": hotel.length
        },
        code: 0,
        message: ""
    })
});
module.exports = router;