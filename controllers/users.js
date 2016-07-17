/**
 * Created by YS on 2016-07-14.
 */
var express = require('express');
var router = express.Router();
var request = require('request');
var async = require('async');

/* POST user registration. */
router.post('/', function(req, res, next) {
    var data = {
        'access_token' : req.header('access-token'),
        'username' : req.body.username,
        'sns' : req.body.sns,
        'phone' : req.body.phone
    };

    async.waterfall([
        function(callback) {
            // 유효성 검사
            var validation = /[a-힣]/;
            var Validator = require('validator');

            if (validation.test(data.username)  // character only
                && Validator.isAlphanumeric(data.access_token) // token only
                && Validator.isAlpha(data.sns)  // alphabet only
                && Validator.isNumeric(data.phone)) { // number only

                return callback(null);
            }
            return callback("유효성 검사 실패");
        }, function (callback) {
            // 유저 상태 인증
            request.get({
                url: 'https://graph.facebook.com/v2.7/me',
                qs: {
                    access_token: data.access_token,
                    field: "id"
                }
            }, function (err, httpResponse, body) {
                console.log(httpResponse);
                if (err) return callback("사용자 인증 에러");

                var fb_profile = JSON.parse(body);
                if (fb_profile.error) return callback("사용자 인증 에러");
                data.user_id = fb_profile.id;
                return callback(null);
            });
        }, function (callback) {
            // 유저 인증정보 저장
            require('../models/users_model').joinCheck(data, function (status, msg, data) {
                if (status) callback(null, data.user_id);
                else callback(msg);
            });
        }
    ], function(err, result) {
        if (err) {
            var error = new Error('Not Found');
            error.status = 400;
            console.error(err);
            return next(error);
        }

        res.statusCode = 200;
        return res.json({
            status: true,
            msg: "회원가입 성공",
            data: { user_id: result }
        });
    });
});

router.get('/:user_id', function(req, res, next) {
    var data = {
        access_token : req.header('access-token'),
        user_id : req.params.user_id
    };

    async.waterfall([
        function(callback) {
            // 유저 정보 가져옴
            require('../models/users_model').getUserData(data, function (status, msg, data) {
                if (status) callback(null, data);
                else callback(msg);
            });
        }
    ], function(err, result) {
        if (err) {
            var error = new Error('Not Found');
            error.status = 401;
            console.error(err);
            return next(error);
        }

        res.statusCode = 200;
        return res.json({
            status: true,
            msg: "유저정보 가져오기 성공",
            data: result
        });
    });
});

/* POST user registration. */
router.post('/:user_id', function(req, res, next) {
    var data = {
        'access_token' : req.header('access-token'),
        'user_id' : req.params.user_id,
        'username' : req.body.username,
        'sns' : req.body.sns,
        'phone' : req.body.phone
    };

    async.waterfall([
        function(callback) {
            callback(null);
            // TODO 유저 본인인지 토큰인증
            // db registration
            /*require('../models/users_model').isAuth(data, function (status, msg, data) {
                if (status) callback(null);
                else callback(msg);
            });*/

        }, function(callback) {
            // 유효성 검사
            var validation = /[a-힣]/;
            var Validator = require('validator');
            if(validation.test(data.username)  // character only
                && Validator.isAlphanumeric(data.access_token) // token only
                && Validator.isAlpha(data.sns)  // alphabet only
                && Validator.isNumeric(data.phone)) { // number only

                // 유저정보 업데이트
                require('../models/users_model').updateUser(data, function (status, msg, data) {
                    if (status) callback(null);
                    else callback(msg);
                });
            }
        }
    ], function(err) {
        if (err) {
            var error = new Error('Not Found');
            error.status = 401;
            console.error(err);
            return next(error);
        }

        res.statusCode = 200;
        return res.json({
            status: true,
            msg: "회원 정보 변경"
        });
    });
});

module.exports = router;
