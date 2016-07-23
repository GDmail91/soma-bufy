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
            require('../models/alarm_model').setCheck(data, function (status, msg) {
                if (status) callback(null);
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
