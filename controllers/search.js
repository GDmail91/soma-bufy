/**
 * Created by YS on 2016-07-14.
 */

var express = require('express');
var router = express.Router();
var async = require('async');

router.get('/', function(req, res, next) {
    if (req.query.amount == undefined) req.query.amount = 10;
    var data = {
        access_token: req.header('access-token'),
        start_id: req.query.start_id,
        amount: parseInt(req.query.amount),
        search: req.query.search
    };

    async.waterfall([
            function (callback) {
                // Validation (특수문자가 없는지)
                var validation = /[\{\}\[\]\/?.,;:|\(\)*~`!^\-_+<>@\#$%&\\\=\'\"]/;

                if (data.search == undefined) return callback({result: false, msg: '검색명이 없습니다.'});
                if (validation.test(data.search)) return callback({result: false, msg: '문자로만 검색해 주세요'});
                data.search = '%' + data.search + '%';
                callback(null);
            },
            function (callback) {
                // 타이틀로 게시물 검색
                require('../models/ranking_model').getContentDataByTitle(data, function (status, msg, data) {
                    if (status) return callback(null, data);
                    else callback(msg);
                });
            }],
        function (err, result) {
            // 검색 결과 출력
            if (err) {
                var error = new Error('Not Found');
                error.status = 400;
                console.error(err);
                return next(error);
            }

            res.statusCode = 200;
            res.json({
                status: true,
                msg: "검색된 게시물",
                data: result
            });
        });

});

module.exports = router;