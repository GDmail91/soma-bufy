/**
 * Created by YS on 2016-07-21.
 */
var express = require('express');
var router = express.Router();
var async = require('async');

router.get('/:content_id', function(req, res, next) {
    var data = {
        access_token : req.header('access-token'),
        content_id : req.params.content_id
    };

    async.waterfall([
        function(callback) {
            // TODO 유저 정보 가져옴
            require('../models/users_model').getUserDataByToken(data, function (status, msg, getData) {
                if (status) {
                    data.username = getData.username;
                    data.user_id = getData.user_id;
                    callback(null);
                }
                else callback(msg);
            });
        }, function(callback) {
            require('../models/monthly_model').getMonthlyContent(data, function (status, msg, getData) {
                if (status) {
                    data.content_title = getData.m_support_title;
                    callback(null);
                } else callback(msg);
            });
        }, function(callback) {
            data.support_id = "support_id:"+data.content_title+":"+data.user_id;
            callback(null);
        }
    ], function(err, result) {
        if (err) {
            var error = new Error('Not Found');
            error.status = 400;
            console.error(err);
            return next(error);
        }
        var currentdate = new Date();
        var month = currentdate.getMonth()+1;
        if (month < 10) month = "0"+month;
        var date = currentdate.getFullYear()+""+month+""+currentdate.getDate();
        res.statusCode = 200;
        res.render('support', { support_id: data.support_id, username: data.username, content_title: data.content_title, date: date.toString() });
    });
});

module.exports = router;
