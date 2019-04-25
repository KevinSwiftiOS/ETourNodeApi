var createError = require('http-errors');
var express = require('express');
var FileStreamRotator = require('file-stream-rotator')
var path = require('path');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
var cors = require('cors');
var bodyParser = require('body-parser');
//定义引用中间件 json-webtoken用来生成token express-jwt用来进行验证
var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');
var fs = require('fs');
const pathToSwaggerUi = require('swagger-ui-dist').absolutePath();
//设置时区
process.env.TZ = 'Asia/Shanghai';

//加载路由
var loginRouter = require('./routes/Login'); //登录
var spotListRouter = require('./routes/SpotList'); //景区列表
var spotComparedRouter = require('./routes/SpotCompared');//景区之间比较
var getUserRouter = require('./routes/GetUser');//获取用户信息
var testApiRouter = require('./routes/testAPI');//测试接口
var qdhStateRouter = require('./routes/QdhState') //千岛湖动态
var spotDetailRouter = require('./routes/SpotDetail'); //景区详情
var spotDetailComparedRouter = require('./routes/SpotDetailCompared');//景区详情下的平台比较
var spidersRouter = require('./routes/Spiders');//爬虫列表
var qdhSpotListRouter = require('./routes/QdhSpotList'); //千岛湖景点详情
var spotStateRouter = require('./routes/SpotSdate'); //景区详情 排名情况等
var qdhSpotStateRouter = require('./routes/QdhSpotState'); //千岛湖景点详情 排名情况等
var qdhSpotDetailRouter = require('./routes/QdhSpotDetail');//千岛湖景点详情 图表使用
var qdhSpotDetailComparedRouter = require('./routes/QdhSpotDetailCompared'); //千岛湖景点详情下的平台比较
var qdhHotelListRouter = require('./routes/QdhHotelList')// 千岛湖酒店信息获取
var qdhHotelCommentNumSortRouter = require('./routes/QdhHotelCommentNumSort')// 千岛湖酒店评论数量排序
var qdhHotelGradeSortRouter = require('./routes/QdhHotelGradeSort')// 千岛湖酒店评分排序
var qdhHotelRankNumRouter = require('./routes/QdhHotelRankNum')// 千岛湖酒店评分排序
var qdhHotelSummaryRouter = require('./routes/QdhHotelSummary')// 返回当前等级的所有酒店，并包含分页功能
var QdhHotelCommentSortTypeRouter = require('./routes/QDHHotelCurrCommentSortType') // 千岛湖当前酒店本月的评论数量以及评分 排名
var qdhHotelGradeDetailAvgRouter = require('./routes/QdhHotelGradeDetailAvg')//   千岛湖当前酒店等级 详细评分平均分 用于雷达图的展示
var qdhHotelGradeDetailRouter = require('./routes/QdhHotelGradeDetail')// 千岛湖当前酒店详细评分， 用于雷达图的显示
var QdhHotelNumLastestRouter = require('./routes/QdhHotelCommentNumLastest') // 千岛湖当前酒店评分以及评论数量
var QdhHotelScoreLastestRouter = require('./routes/QdhHotelCommentScoreLastest') // 千岛湖当当前酒店最近几周的评分
var qdhHotelWebComparedRouter = require('./routes/QdhHotelWebsiteNumCompared') // 千岛湖当前酒店不同平台数量以及评分的比较
var QdhHotelTMapCNumRouter = require('./routes/QdhHotelTMapCNumShow') // 千岛湖酒店全部评论在不同平台上的分布，用于 treemap展示
var QdhHotelTagWordRouter = require('./routes/QdhHotelComTagShowTimes') // 千岛湖酒店全部评论在不同平台上的分布，用于 treemap展示
var QdhHotelTagSumRouter = require('./routes/QdhHotelComTagSum');
var QdhHotelTagClassRouter = require('./routes/QdhHotelComTagClassierSum');

var RestaurantStatistic = require('./routes/restaurantPage/RestaurantStatistic');

var AreaComment = require('./routes/shoparea/AreaComment');
var AreaScore = require("./routes/shoparea/AreaScore");
var RestaurantList = require('./routes/restaurantPage/RestaurantList');
var shoplocation = require('./routes/shoplocation'); //餐饮地图
var myShowRouter = require('./routes/myShow');   // 万能路由
var app = express();


//主页接口
var QdhHotelComScorePieRouter = require('./routes/HomePage/hotel/QdhHotelComScorePie'); // 酒店 评分分布饼图
var QdhHotelComNumPieRouter = require('./routes/HomePage/hotel/QdhHotelComNumPie');    // 酒店 评论数量分布饼图
var QdhHotelComScoreLimitTenRouter = require('./routes/HomePage/hotel/QdhHotelComScoreLimitTen');  // 酒店评分前十名
var restaurantRank = require('./routes/HomePage/restaurant/RestaurantRank');  // 餐饮排行
var restaurantPiecharts = require("./routes/HomePage/restaurant/RestaurantPiecharts");  // 餐饮饼图

var spotRank = require('./routes/HomePage/spot/SpotRank'); //景区排行
var getDate = require('./routes/GetDate'); //获取当前是第几天
var heatMap = require("./routes/HomePage/spot/HeatMap"); //千岛湖热力图
var spotHotChange = require("./routes/HomePage/spot/SpotHotChange");//千岛湖景点评论变化图
var keyIndicator = require("./routes/HomePage/spot/KeyIndicator");//千岛湖关键指标


// 酒店详情
var qdhHotelCommentTotal = require("./routes/HotelPage/QdhHotelCommentTotal");//千岛湖关键指标
var QdhHotelRankShowRouter = require("./routes/HotelPage/QdhHotelRankShow");//千岛湖关键指标
var QdhHotelSameAreaHotel = require("./routes/HotelPage/QdhHotelTradeArea");//千岛湖关键指标



var restaurantsPage = require("./routes/restaurantPage/restaurantAll");   // 餐饮详情界面



//qdhhoteltmapnumshow
//日志文件的配置
var log4js = require('log4js');
log4js.configure('log4j.json');
app.use(log4js.connectLogger(log4js.getLogger("http"), { level: 'trace' }));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.json());
app.use(bodyParser.json({limit: '1mb'}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use('/static', express.static('public'));
//设置跨域访问
app.use(cors());
//设置除了login接口 其余接口都需进行校验
app.use(expressJwt({
    secret: "secret"//加密密钥，可换
}).unless({
    path: ["/api/login","/static/"]//添加不需要token的接口
}));
app.use(express.static(pathToSwaggerUi));
// 未携带token请求接口会出错，触发这个
app.use(function(err, req, res, next) {
    if (err.name === "UnauthorizedError") {
       res.send({
           "code":8,
           "message":'登录令牌校验失败，请重新登录',
           "data":{}
       })
    }
});
app.use('/static/', express.static('public'));
//注册路由
app.use('/api/login',loginRouter);
app.use('/api/spotlist',spotListRouter);
app.use('/api/spotcompared',spotComparedRouter);
app.use('/api/getuser',getUserRouter);
app.use('/api/qdhstate',qdhStateRouter);
app.use('/api/spotdetail',spotDetailRouter);
app.use('/api/spotdetailcompared',spotDetailComparedRouter);
app.use('/api/spider',spidersRouter);
app.use('/api/qdhspotlist',qdhSpotListRouter);
app.use('/api/qdhhotellist', qdhHotelListRouter); // 千岛湖酒店列表（不同等级）
app.use('/api/qdhhotelcommentnumsort', qdhHotelCommentNumSortRouter);   // 酒店评论数量排名
app.use('/api/qdhhotelgradesort', qdhHotelGradeSortRouter);         // 酒店评分排名
app.use('/api/qdhhotelranknum', qdhHotelRankNumRouter);     // 酒店不同等级酒店数目
app.use('/api/qdhhotelsummary', qdhHotelSummaryRouter);     // 返回千岛湖当前等级的所有酒店，并包含分页功能
app.use('/api/qdhcurrhotelsorttype', QdhHotelCommentSortTypeRouter); // 当前酒店 本月的评分数量以及评论数量 排名
app.use('/api/qdhhotelgradedetailavg', qdhHotelGradeDetailAvgRouter);   // 酒店等级平均评分 用于雷达图的显示
app.use('/api/qdhhotelgradedetail', qdhHotelGradeDetailRouter);   // 酒店详细评分  用于雷达图的显示
app.use('/api/qdhhotelnumlastest', QdhHotelNumLastestRouter);    //  酒店评论最近几周评分或评论数量
app.use('/api/qdhhotelscorelastest', QdhHotelScoreLastestRouter);     // 酒店最近几周的评分，会去剃掉 评分为零的 评论
app.use('/api/qdhhotelwebcompared', qdhHotelWebComparedRouter);    //      酒店最近几周不同平台的评分或评论数量
app.use('/api/qdhhoteltmapnumshow', QdhHotelTMapCNumRouter);    //  酒店所有评论在不同平台的数量分布，用于treemap 的展示
app.use('/api/qdhhotelcomfeatureword', QdhHotelTagWordRouter);    //  酒店所有评论在不同平台的数量分布，用于treemap 的展示
app.use('/api/qdhhotelcomtagsum', QdhHotelTagSumRouter);    // 获得不同方面评价的的个数
app.use('/api/count', QdhHotelTagClassRouter);    //  获得一个方面好评差评的的个数,
app.use('/api/spotstate',spotStateRouter);
app.use('/api/qdhspotstate',qdhSpotStateRouter);
app.use('/api/qdhspotdetail',qdhSpotDetailRouter);
app.use('/api/qdhspotdetailcompard',qdhSpotDetailComparedRouter);
app.use('/api/testapi',testApiRouter);
app.use('/api/myshow', myShowRouter);

app.use('/api/restaurant/statistic', RestaurantStatistic);
app.use('/api/restaurants', RestaurantList);

app.use('/api/shoparea/comment', AreaComment);
app.use('/api/shoparea/score', AreaScore);
app.use('/api/shoplocation', shoplocation);
//
// app.use('/api/homepage/restaurantStatistical', restaurantRank);  // 餐饮排行
app.use('/api/homepage/spotrank', spotRank);  // 景区排行和千岛湖景点排行

app.use("/api/getdate",getDate);//获取当前是第几天
app.use("/api/homepage/heatmap",heatMap);//千岛湖热力图
app.use("/api/homepage/keyindicator",keyIndicator); //千岛湖关键指标
app.use("/api/homepage/spothotchange",spotHotChange);//千岛湖景区热度变化图

// app.use('./api/homepage/restaurant')

//app.use('/api/homepage/restaurantrank', restaurantRank);  // 餐饮排行
// app.use('/api/homepage/restaurantpiecharts', restaurantPiecharts); // 餐饮饼图



// 主页接口
app.use('/api/homepage/hotel/scorepiecharts', QdhHotelComScorePieRouter);    // 酒店评分饼图   主页接口
app.use('/api/homepage/hotel/numpiecharts', QdhHotelComNumPieRouter);   // 酒店评论饼图
app.use('/api/homepage/hotelrank', QdhHotelComScoreLimitTenRouter);    // 获得酒店前10名
app.use('/api/homepage/restaurantrank', restaurantRank);  // 餐饮排行
app.use('/api/homepage/restaurantpiecharts', restaurantPiecharts); // 餐饮饼图
app.use('/api/homepage/spotrank', spotRank);  // 景区排行和千岛湖景点排行
app.use("/api/getdate",getDate);//获取当前是第几天
app.use("/api/homepage/heatmap",heatMap);//千岛湖热力图
app.use("/api/homepage/keyindicator",keyIndicator); //千岛湖关键指标
app.use("/api/homepage/spothotchange",spotHotChange);//千岛湖景区热度变化图



app.use("/api/restaurantpage", restaurantsPage);    // 餐饮详情接口

// app.use('./api/homepage/restaurant')
app.use("/api/hotelpage/keyindicator",qdhHotelCommentTotal); //千岛湖 当月和今年数量 统计 以及 评论数量折线图
app.use("/api/hotelpage/ranklist",QdhHotelRankShowRouter); //千岛湖热度前十名， 以及好评和差评前十名
app.use("/api/hotelpage",QdhHotelSameAreaHotel); //千岛湖 酒店 评论数量变化图（折线）


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
// error handler0
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;

