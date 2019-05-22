
function getWeekDate(theyear, weekcount) {
    var year = theyear;
    var week = weekcount;
    if (year == "" || week == "") return;

    var d = new Date(year, 0, 1);
    d.setDate(parseInt("1065432".charAt(d.getDay())) + week * 7);
    var fe = getFirstAndEnd(d);
    return fe.first.format("MM月dd日") + "-" + fe.end.format("MM月dd日");
}

Date.prototype.getWeek = function (flag) {
    var first = new Date(this.getFullYear(), 0, 1);
    var n = parseInt("1065432".charAt(first.getDay()));
    n = this.getTime() - first.getTime() - n * 24 * 60 * 60 * 1000;
    n = Math.ceil(n / (7 * 24 * 60 * 60 * 1000));
    return (flag == true && first.getDay() != 1) ? (n + 1) : n;
};
Date.prototype.format = function (format) {
    var o = {
        "M+": this.getMonth() + 1, //month 
        "d+": this.getDate(), //day 
        "h+": this.getHours(), //hour 
        "m+": this.getMinutes(), //minute 
        "s+": this.getSeconds(), //second 
        "q+": Math.floor((this.getMonth() + 3) / 3), //quarter 
        "S": this.getMilliseconds() //millisecond 
    }
    if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
        (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(format))
            format = format.replace(RegExp.$1,
                RegExp.$1.length == 1 ? o[k] :
                ("00" + o[k]).substr(("" + o[k]).length));
    return format;
};

function getFirstAndEnd(d) {
    var w = d.getDay(),
        n = 24 * 60 * 60 * 1000;
    var first = new Date(d.getTime() - parseInt("6012345".charAt(w)) * n);
    var end = new Date(d.getTime() + parseInt("0654321".charAt(w)) * n);
    return {
        first: first,
        end: end
    };
}

function addDateText(timeStr) {
    var timeStr_ = timeStr.replace(/年|周/g, ",");
    var timeStrs = timeStr_.split(",");
    var newStr = (timeStr + "(" + getWeekDate(timeStrs[0], timeStrs[1]) + ")");
    return newStr;
}

module.exports ={
    addDateText
}

// addDateText("2016年51周"); //显示为 2016年51周(12月19日-12月25日)