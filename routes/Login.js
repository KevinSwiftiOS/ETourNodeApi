var express = require('express');
var logger = require('log4js').getLogger("index");
var jwt = require('jsonwebtoken');
var router = express.Router();
var UserModels = require('./../dbs/UserModels');
var User = UserModels.User;

//登录接口
router.post('/', function (req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    console.log(username);
    console.log(password)
                   User.find({username: username}).exec(function (err, data) {

                    if (err) {
                        logger.error('用户信息查询失败 接口为Login' + err);
                        res.send({
                            "code": 12,
                            "message": "查询失败",
                            "data": {}

            });
        } else {


            if (data.length == 0) {
                res.send({
                    "code": 9,
                    "message": "用户不存在",
                    "data": {}

                });
            }
            else {
                var user = data[0];
                if (user.password != password.toString()) {
                    res.send({
                        "code": 10,
                        "message": "用户密码错误",
                        "data": {}

                    });
                } else {
                    //生成token
                    var token = jwt.sign({
                        username: user.username,
                        password: user.password
                    }, "secret", {
                        expiresIn: 60 * 60 * 24 * 7// 授权时效一礼拜
                    });
                    res.send({
                        "code": 0,
                        "message": "",
                        "data": {
                            "token": token
                        }

                    });
                }
            }
        }
    })

});

module.exports = router;
