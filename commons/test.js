var startTime = '2018-09';
var  start_year = (startTime.split('-')[0]);
//for(var i =  start_year;i <= 2021;i++)
    //console.log(i);
//console.log(start_year);
function PrefixInteger(num, length) {
    return (Array(length).join('0') + num).slice(-length);
}
var dic = {'2016-05':2,'2014-02':1,'2018-08':3};
//console.log(dic.length);
var sdic = Object.keys(dic).sort();
var ccc = 1.111;
//console.log(ccc.toFixed(1));
var times = ('2018-09-19').split('-');
var time,week,checkDate = new Date(times[0],times[1] - 1,times[2]);
checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7));
time = checkDate.getTime();
checkDate.setMonth(0);
checkDate.setDate(1);
week=Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;


//alert("今天是本年当中的第"+week+"周");
// data_region_search_keys = [
//     '千岛湖','西湖','西溪','溪口','乌镇','西塘','横店','江郎山','雁荡山','普陀山',
//     '南浔','神仙居','天台山','根宫','鲁迅','南湖','黄山','三清山'
// ];
// for(var i = 0;  i < data_region_search_keys.length;i++)
//     if('杭州西湖'.indexOf(data_region_search_keys[i]) != -1)
//         console.log(data_region_search_keys[i]);
var temp = [1,2,3];
var cnts = new Array(temp.length);
var orgin = [1,2,3];
var dic = [
    {id:1,value:1.2},

    {id:3,value:3.1}
];
var i = 0;j = 0;
for(;i < orgin.length;){
    for(;j < dic.length;){
        if(orgin[i] == dic[j].id) {
            cnts[i] = (dic[j].value).toFixed(1);
          i++;
          j++;
        }else{
            cnts[i] = 0;
            i++;
        }
        break;
    }
}


//
// function setDate() {
//     var date = new Date(2018,11,31);
//     // 本周一的日期
//     var nowDayOfWeek = date.getDay();
//     var nowDay = date.getDate();
//     var new_date = new Date(date.getFullYear(),
//         date.getMonth(),
//        nowDay + (7 - nowDayOfWeek)
//         )
//  console.log(new_date.getFullYear() + "-" + (new_date.getMonth() + 1) + "-" + new_date.getDate());
//
// }
// console.log(99999);
// setDate();

















//景区颗粒度关键字顺序
var time_sorts_dic = {
"年":0,
 "季度":1,
 "月":2,
 "周":3
};
//表明4个季度
var seasons = {
    1:{
        start:{month:1,day:1},
        end:{month:3,day:31},
    },
    2:{
        start:{month:4,day:1},
        end:{month:6,day:30},
    },
    3:{
        start:{month:7,day:1},
        end:{month:9,day:31},
    },
    4:{
        start:{month:10,day:1},
        end:{month:12,day:31},
    },
};




//判断是否是闰年
function is_leap_year(year) {
    if((year % 400 == 0) || (year % 4 == 0 && year % 100 != 0))
        return 1;
    return 0;
}



function get_month_day(year,month) {
    var days = [[31,28,31,30,31,30,31,31,30,31,30,31],[31,29,31,30,31,30,31,31,30,31,30,31]];
    //返回最后一天
    return days[is_leap_year(year)][month - 1];

}


var date = new Date(2018,12 - 1,31);

function get_date(old_time,old_date,is_start) {
       var new_date;
    switch (old_time) {
        case "年":
            if(is_start){
                //表明从1月1号开始
               return new Date(old_date,0,1);

            }else{
                //表明到最后一天
             return new Date(old_date,11,31);
            };

        case "季度":
            //返回季度对应的第一天 和 季度对应的最后一天
            var year = old_date.split('-')[0];
            var season = parseInt(old_date.split('-')[1]);
            var month_day;
            if(is_start)
                month_day = (seasons[season])['start'];
            else
                month_day = (seasons[season])['end'];
         return new Date(year,month_day['month'] - 1,month_day['day']);

        case "月":
            //返回当月对应的第一天和最后一天
            var year = old_date.split('-')[0];
            var month = parseInt(old_date.split('-')[1]);
            if(is_start){
              return new Date(year,month - 1,1);
            }else{
                //获取当前月份对应的最后一天
               return new Date(year,month - 1,get_month_day(year,month));
            }

            case "周":
               //周传进来时是date形式的
            if(is_start){
                //获得开始时间
                var nowDayOfWeek = old_date.getDay();
                var nowDay = old_date.getDate();
               return new Date(old_date.getFullYear(),
                    old_date.getMonth(),
                    nowDay - nowDayOfWeek + 1)
            }else{
                var nowDayOfWeek = date.getDay();
                var nowDay = date.getDate();
             return new Date(date.getFullYear(),
                    date.getMonth(),
                    nowDay + (7 - nowDayOfWeek)
                )
            }

        default:
            break
    }

};

//转换到新的时间颗粒度

function convert_to_new(new_time,date) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    console.log("11111");
    console.log(year);
    console.log(month);
    console.log(day);
    switch (new_time) {
           case "年":
               console.log("090909");
            return year;
            case "季度":
            var season = ["01","02","03","04"];
            if(month % 3 == 0)
                return year + "-" + season[month / 3 - 1];
            else
                return year + "-" + season[Math.floor(month / 3)];
            //要补0
            case "月":
            //要补0
                console.log("22222");
                console.log(year.toString() + "-" + month.toString())
            return (year.toString() + "-" + month.toString());
            case "周":
                console.log("00000000000000000");
            return date;
            //要补0
        default:
            break;

    }
}







function convert_time(old_time,new_time,old_date,is_start){
    var old_time_key = time_sorts_dic[old_time];
    var new_time_key = time_sorts_dic[new_time];

        //表明是从大致的往详细的方向转变
        //获取当前时间
        var curr_day = get_date(old_time,old_date,is_start);
        console.log("00000");
        console.log(curr_day);
        //新的时间颗粒度对应的时间
        var new_time_day = convert_to_new(new_time,curr_day);
        console.log(new_time_day);


}
console.log(88888);
convert_time('季度','周','2018-04',false);


