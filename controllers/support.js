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
            /*require('../models/users_model').getUserDataByToken(data, function (status, msg, data) {
                if (status) callback(null, data.user_id);
                else callback(msg);
            });*/
            data.username = "유저명";
            callback(null);
        }, function(callback) {
            data.target = "후원 타이틀";
            callback(null);
        }, function(callback) {
            data.support_id = "support_id";
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
        var date = currentdate.getFullYear()+""+currentdate.getDate()+""+(currentdate.getMonth()+1);
        res.statusCode = 200;
        res.render('support', { support_id: data.support_id, username: data.username, target: data.target, date: date.toString() });
    });
});

module.exports = router;
