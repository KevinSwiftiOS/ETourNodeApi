var express = require('express');
var logger = require('log4js').getLogger("index");
var jwt = require('jsonwebtoken');
var router = express.Router();
var  func = require("../commons/common");

//登录接口
router.post('/', function(req, res,next) {
   var date = new Date();
   var newDate = func.getDay(date,3);

   res.send({
       "code":0,
       "message":"",
       "data":{
           "endDate":newDate
       }
   })

});

module.exports = router;
