var express = require('express');
var jwt = require('jsonwebtoken');

var router = express.Router();

var UserModels = require('./../dbs/UserModels');
var User = UserModels.User;


//获取登录的用户名 根据token
router.post('/', function (req, res, next) {

    res.send({
        "code": 0,
        "data": {
            "username": req.user.username
        }
    })

});

module.exports = router;
