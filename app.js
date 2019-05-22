var createError = require('http-errors');
var express = require('express');
var app = express();
var path = require('path');
var cookieParser = require('cookie-parser');
var cors = require('cors');
var bodyParser = require('body-parser');

//定义引用中间件 json-webtoken用来生成token express-jwt用来进行验证
var expressJwt = require('express-jwt');
const pathToSwaggerUi = require('swagger-ui-dist').absolutePath();

//设置时区
process.env.TZ = 'Asia/Shanghai';

//加载路由
var loginRouter = require('./routes/Login'); //登录
var getUserRouter = require('./routes/GetUser');//获取用户信息
var getDate = require('./routes/GetDate'); //获取当前是第几天

//var qdhStateRouter = require('./routes/QdhState') //千岛湖动

// 主页大屏
var QdhHotelComScorePieRouter = require('./routes/HomePage/hotel/ComScorePie'); // 酒店 评分分布饼图
var QdhHotelComNumPieRouter = require('./routes/HomePage/hotel/ComNumPie');    // 酒店 评论数量分布饼图
var QdhHotelComScoreLimitTenRouter = require('./routes/HomePage/hotel/ComScoreLimitTen');  // 酒店评分前十名
var restaurantRank = require('./routes/HomePage/restaurant/RestRank');  // 餐饮排行
var restaurantPiecharts = require("./routes/HomePage/restaurant/Piecharts");  // 餐饮饼图
var spotRank = require('./routes/HomePage/spot/SpotRank'); //景区排行
var heatMap = require("./routes/HomePage/spot/HeatMap"); //千岛湖热力图
var spotHotChange = require("./routes/HomePage/spot/SpotHotChange");//千岛湖景点评论变化图
var keyIndicator = require("./routes/HomePage/spot/KeyIndicator");//千岛湖关键指标
var qdhSpotListRouter = require('./routes/HomePage/spot/QdhSpotList'); //千岛湖景点详情地图

// 酒店详情
var qdhHotelCommentTotal = require("./routes/HotelPage/CommentTotal");//千岛湖关键指标
var QdhHotelRankShowRouter = require("./routes/HotelPage/RankShow");//千岛湖关键指标
var QdhHotelSameAreaHotel = require("./routes/HotelPage/TradeArea");//千岛湖关键指标
var QdhHotelTagWordRouter = require('./routes/HotelPage/ComTagShowTimes') // 千岛湖酒店全部评论在不同平台上的分布，用于 treemap展示
var QdhHotelTagSumRouter = require('./routes/HotelPage/ComTagSum');

// 餐饮详情
var restaurantsPage = require("./routes/RestaurantPage/restaurantAll");   // 餐饮详情界面

// 景区详情
var spotCompared = require('./routes/SpotPage/GraphCharts'); // 景区数据集：时间选择器
var spotKeyIndicator = require('./routes/SpotPage/KeyIndicator'); // 景区详情数据
var spotRegionalMap = require('./routes/SpotPage/RegionalMap'); // 景区列表地图
var spotPieCharts = require('./routes/SpotPage/PieCharts'); // 景区饼图模块
var spotBarCharts = require('./routes/SpotPage/BarCharts'); // 景区柱状图模块
var spotCommentAnalysis = require('./routes/SpotPage/CommentAnalysis'); //景区评论分析模块

// 景点详情
var sightSpotCompared = require('./routes/SightSpotPage/GraphCharts'); // 景点数据集：时间选择器
var sightSpotIndicator = require('./routes/SightSpotPage/KeyIndicator'); // 景点详情数据
var sightSpotRegionalMap = require('./routes/SightSpotPage/RegionalMap'); // 景点列表地图
var sightSpotPieCharts = require('./routes/SightSpotPage/PieCharts'); // 景点饼图模块
var sightSpotBarCharts = require('./routes/SightSpotPage/BarCharts'); // 景点柱状图模块
var sightSpotCommentAnalysis = require('./routes/SightSpotPage/CommentAnalysis'); //景点区评论分析模块

//爬虫详情
var SpiderRouter = require('./routes/SpiderPage/Spider'); //爬虫列表


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
app.use('/api/getuser',getUserRouter);
//app.use('/api/qdhstate',qdhStateRouter);

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
app.use('/api/qdhspotlist', qdhSpotListRouter);

// 餐饮详情接口
app.use("/api/restaurantpage", restaurantsPage);

// 酒店详情接口
app.use("/api/hotelpage/keyindicator",qdhHotelCommentTotal); //千岛湖 当月和今年数量 统计 以及 评论数量折线图
app.use("/api/hotelpage/ranklist",QdhHotelRankShowRouter); //千岛湖热度前十名， 以及好评和差评前十名
app.use("/api/hotelpage",QdhHotelSameAreaHotel); //千岛湖 酒店 评论数量变化图（折线）
app.use('/api/hotelpage/comtagsum', QdhHotelTagSumRouter); // 获得不同方面评价的的个数
app.use('/api/hotelpage/comfeatureword', QdhHotelTagWordRouter); //  酒店所有评论在不同平台的数量分布，用于treemap 的展示

// 景区详情接口
app.use('/api/spotspage/comparedgraphchart', spotCompared); // 景区数据集接口一：时间选择器
app.use('/api/spotspage/keyindicator', spotKeyIndicator);  // 不同景区关键指标
app.use('/api/spotspage/regionalmap', spotRegionalMap);  // 浙江省地图
app.use('/api/spotspage/piecharts', spotPieCharts); // 景区饼图
app.use('/api/spotspage/barcharts', spotBarCharts); // 景区柱状图
app.use('/api/spotspage/commentanalysis', spotCommentAnalysis); //景区评论分析模块

// 景点详情接口
app.use('/api/sightspotspage/comparedgraphchart', sightSpotCompared); // 景点数据集：时间选择器
app.use('/api/sightspotspage/keyindicator', sightSpotIndicator); // 不同景点关键指标
app.use('/api/sightspotspage/regionalmap', sightSpotRegionalMap); // 千岛湖地图
app.use('/api/sightspotspage/piecharts', sightSpotPieCharts); // 景点饼图
app.use('/api/sightspotspage/barcharts', sightSpotBarCharts); // 景点柱状图
app.use('/api/sightspotspage/commentanalysis', sightSpotCommentAnalysis); //景点评论分析模块

// 爬虫详情
app.use("/api/spiderpage/spider", SpiderRouter);

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

