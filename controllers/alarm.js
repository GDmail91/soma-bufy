/**
 * Created by YS on 2016-07-14.
 */
var express = require('express');
var router = express.Router();
var async = require('async');

router.get('/', function(req, res, next) {
    var data = {
        access_token : req.header('access-token'),
        amount : parseInt(req.query.amount),
        start_id : req.query.start_id
    };

    if (isNaN(data.amount)) data.amount = 10;

    async.waterfall([
        function(callback) {
            // TODO 게시물 리스트 가져옴
            require('../models/alarm_model').getAlarm(data, function(status, msg, data) {
                if (status) callback(null, data);
                else callback(msg);
            });
        }
    ], function(err, result) {
        if (err) {
            var error = new Error('Not Found');
            error.status = 400
            console.error(err);
            return next(error);
        }
        res.statusCode = 200;
        res.json({
            status: true,
            msg: "알람 리스트",
            data: result
        });
    });
});

module.exports = router;
