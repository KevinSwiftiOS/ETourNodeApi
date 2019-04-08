//不足位数进行补齐
var funcs = {
     getDay: function (date, subDay) {
         var newDate = date.setDate(date.getDate() - subDay);
         newDate = new Date(newDate);
         return newDate.getFullYear() + "-" + this.PrefixInteger(newDate.getMonth() + 1, 2) + "-" +
             this.PrefixInteger(newDate.getDate(), 2);
     },
    //获取当前第几周
    get_curr_week: function () {
        var time, week, checkDate = new Date(new Date());
        checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7));
        time = checkDate.getTime();
        checkDate.setMonth(0);
        checkDate.setDate(1);
        week = Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
        return week;
    },
    get_week: function (weekAmount) { // 获取 前几个周
        var checkDate = new Date();
        var startTime = new Date();
        checkDate.setTime(checkDate.getTime() - weekAmount * 86400000 * 7);
        startTime.setFullYear(2018);
        startTime.setMonth(0);
        startTime.setDate(1);
        var millSecond = checkDate.getTime() - startTime.getTime();
        var week = Math.ceil(Math.round((millSecond / 86400000 / 7))) + 1;
        return checkDate.getFullYear().toString() + '-' + week.toString().padStart(2, '0');
    },

    get_curr_season: function(month) { //获取当前季度
        return Math.ceil(month / 3).toString();
    },

    PrefixInteger: function (num, length) {
        return (Array(length).join('0') + num).slice(-length);
    },



    get_time_list_hotel: function (startTime, endTime, time) {  // 因为酒店 中评论cmment_season 2018-1 而不是2018-01
        startTime = startTime.toString();
        endTime = endTime.toString();
        //截止时间 月截止到13 季度截止到5 周截止到53 方便后面一个遍历
        var start_year = (startTime.split('-')[0]);
        var start_date = (startTime.split('-')[1]);
        var end_year = (endTime.split('-')[0]);
        var end_date = (endTime.split('-')[1]);
        var end_time_keys = {
            '月': 12,
            '季度': 4,
            '周': 52,
            '年': 2018
        };
        var end_time = end_time_keys[time];
        var time_list = [];
        if (time != '年') {
            if (start_year < end_year) {
                var first = true;
                for (var year = start_year; year <= end_year; year++) {
                    if (year != end_year) {
                        if (first) {
                            first = false;
                            for (var month = start_date; month <= end_time; month++)
                                time_list.push(year.toString() + "-" + month.toString());

                        } else {
                            for (var month = 1; month <= end_time; month++)
                                time_list.push(year.toString() + "-" + month.toString());
                        }
                    } else {
                        for (var month = 1; month <= end_date; month++)
                            time_list.push(year.toString() + "-" + month.toString());
                    }
                }
            } else {
                for (var month = start_date; month <= end_date; month++) {
                    time_list.push((start_year).toString() + '-' + month.toString());
                }
            }

        } else {
            for (var year = start_year; year <= end_year; year++)
                time_list.push(year.toString());
        }
        return time_list;

    },

    get_time_list: function (startTime, endTime, time) {
        startTime = startTime.toString();
        endTime = endTime.toString();
        //截止时间 月截止到13 季度截止到5 周截止到53 方便后面一个遍历
        var start_year = (startTime.split('-')[0]);
        var start_date = (startTime.split('-')[1]);
        var end_year = (endTime.split('-')[0]);
        var end_date = (endTime.split('-')[1]);
        var end_time_keys = {
            '月': 12,
            '季度': 4,
            '周': 52,
            '年': 2018
        };
        var end_time = end_time_keys[time];
        var time_list = [];
        if (time != '年') {
            if (start_year < end_year) {
                var first = true;
                for (var year = start_year; year <= end_year; year++) {
                    if (year != end_year) {
                        if (first) {
                            first = false;
                            for (var month = start_date; month <= end_time; month++)
                                time_list.push(year.toString() + "-" + (this.PrefixInteger(month, 2)).toString());

                        } else {
                            for (var month = 1; month <= end_time; month++)
                                time_list.push(year.toString() + "-" + (this.PrefixInteger(month, 2)).toString());
                        }
                    } else {
                        for (var month = 1; month <= end_date; month++)
                            time_list.push(year.toString() + "-" + (this.PrefixInteger(month, 2)).toString());
                    }
                }
            } else {
                for (var month = start_date; month <= end_date; month++) {
                    time_list.push((start_year).toString() + '-' + (this.PrefixInteger(month, 2)).toString());
                }
            }

        } else {
            for (var year = start_year; year <= end_year; year++)
                time_list.push(year.toString());
        }
        return time_list;

    }
}
module.exports = funcs