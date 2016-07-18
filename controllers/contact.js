/**
 * Created by YS on 2016-07-14.
 */
var express = require('express');
var router = express.Router();
var async = require('async');

router.post('/', function(req, res, next) {
    var data = {
        access_token : req.header('access-token'),
        question : req.body.question,
        email : req.body.email
    };

    async.waterfall([
        function(callback) {
            // 유효성 검사
            var Validator = require('validator');
            if (Validator.isEmail(data.email)) { // email only
                return callback(null);
            }
            return callback("유효성 검사 실패");
        },
        function(callback) {
            // 관리자 인증
            require('../models/contact_model').postQuestion(data, function(status, msg) {
                if (status) {
                    callback(null);
                } else callback(msg);
            });
        }
    ], function(err) {
        if (err) {
            var error = new Error('Not Found');
            error.status = 401;
            console.error(err);
            return next(error);
        }
        res.statusCode = 200;
        res.json({
            status: true,
            msg: "문의 등록 완료"
        });
    });
});

/* POST ranking content */
router.get('/', function(req, res, next) {
    var data = {
        'access_token' : req.header('access-token'),
        amount : parseInt(req.query.amount),
        start_id : req.query.start_id
    };

    if (isNaN(data.amount)) data.amount = 10;

    async.waterfall([
        function(callback) {
            // 관리자 인증
            require('../models/users_model').get_editable_admin_id(data, function(status, msg, getData) {
                if (status) {
                    data.user_id = getData.user_id;
                    callback(null);
                } else callback(msg);
            });
        },
        function(callback) {
            require('../models/contact_model').getQuestions(data, function(status, msg, data) {
                if (status) callback(null, data);
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
        res.json({
            status: true,
            msg: "문의 목록",
            data: result
        });
    });

});

module.exports = router;
