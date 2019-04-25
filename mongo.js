
// var url = "mongodb://lab421:lab421_1@localhost:27517/"
// conn = new Mongo(url);//ip:port是你需要连接的mongodb数据库的ip和端口号
// db = conn.getDB("dspider2");//database是集合名
//执行语句  ./mongo localhost:27517/dspider2 -u"lab421" -p"lab421_1" --authenticationDatabase "admin" /home/lab421/storage/ckq/mongo.js
function PrefixInteger(num, length) {
    return (Array(length).join('0') + num).slice(-length);
}


//返回评论的月份
function commentMonth(comment_time){
 var   time = comment_time.split('-');
   return time[0] + '-' + PrefixInteger(time[1],2);
}
//返回评论的季度
function commentSeason(comment_time){
    time = comment_time.split('-');
    month = parseInt(time[1]);

    seasons = ['01','02','03','04'];
    if(month % 3 == 0)
  return(time[0] + '-' +  seasons[month / 3 - 1]);


    else {
          index = parseInt(Math.floor(month / 3));
       return(time[0] + '-' +  seasons[index]);
}

}
//返回评论的年份
function commentYear(comment_time){
    time = comment_time.split('-');
    return time[0];
}
//返回评论的周数
function commentWeek(comment_time){
    var times = comment_time.split('-');
    var time,week,checkDate = new Date(times[0],times[1] - 1,times[2]);
checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7));
time = checkDate.getTime();
checkDate.setMonth(0);
checkDate.setDate(1);
week=Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
  return times[0] + "-" + PrefixInteger(week,2);
}
data_region_search_keys = [
    '千岛湖','西湖','西溪','溪口','乌镇','西塘','横店','江郎山','雁荡山','普陀山',
    '南浔','神仙居','天台山','根宫','鲁迅','南湖','黄山','三清山'
];
//获取景区关键字
function dataRgionSearchKey(data_region){
  for(var i = 0; i < data_region_search_keys.length;i++){
      if(data_region.indexOf(data_region_search_keys[i]) != -1)
      return data_region_search_keys[i];
  }
  return '千岛湖'
}
var shop_name_search_keys = [
    '中心湖','梅峰','龙山岛','月光岛','渔乐岛','东南湖','黄山尖','天池岛','桂花岛','蜜山岛',
    '文渊狮城','石林','九咆界','下姜','森林氧吧','龙川','芹川','秘境',"仙人谷",
    "钓鱼岛","白云溪"
];



//获取千岛湖景区景点关键字
function shop_name_search_key(data_region_search_key,shop_name){
    if(data_region_search_key == '千岛湖'){
        for(var i = 0; i < shop_name_search_keys.length;i++) {
            if (shop_name.indexOf(shop_name_search_keys[i]) != -1)
                return shop_name_search_keys[i];
        }
        return '中心湖';
    }
    return '';
}

function update_shop_env(shop_env){
    if(shop_env == "")
        return "暂无评分"
    else
        return shop_env
}







db.restaurant_shop.find().forEach(
    function(item){
        db.restaurant_shop.update({"_id":item._id},{"$set":{'shop_env':update_shop_env(item.shop_env)}})
    }
)
