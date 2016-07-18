/**
 * Created by YS on 2016-07-14.
 */
var express = require('express');
var router = express.Router();
var async = require('async');

router.post('/', function(req, res, next) {
    var data = {
        access_token : req.header('access-token'),
        content_id : req.body.content_id,
        monthly_img : req.body.monthly_img,
        monthly_title : req.body.monthly_title,
        monthly_description : req.body.monthly_description,
        end_date : req.body.end_date
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
            // TODO 게시물 리스트 가져옴
            require('../models/monthly_model').postMonthlyContent(data, function(status, msg, data) {
                console.log(msg);
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
        res.json({
            status: true,
            msg: "이달의 후원 등록",
            data: result
        });
    });
});

/* POST ranking content */
router.get('/', function(req, res, next) {
    var data = {
        'access_token' : req.header('access-token'),
        content_id : req.body.content_id
    };

    async.waterfall([
        function(callback) {
            require('../models/monthly_model').getMonthlyContent(data, function(status, msg, data) {
                if (status) {
                    return callback(null, data);
                } else return callback(msg);
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
            msg: "게시 완료",
            data: result
        });
    });

});

module.exports = router;
