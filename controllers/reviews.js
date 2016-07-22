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
            require('../models/review_model').getContentData(data, function(status, msg, data) {
                if (status) callback(null, data);
                else callback(msg);
            });
        }
    ], function(err, result) {
        if (err) {
            var error = new Error('Not Found');
            error.status = 500;
            console.error(err);
            return next(error);
        }
        res.statusCode = 200;
        res.json({
            status: true,
            msg: "후기 리스트",
            data: result
        });
    });
});

/* POST review content */
router.post('/', function(req, res, next) {
    var data = {
        'access_token' : req.header('access-token')
    };

    async.waterfall([
        function(callback) {
            // 유저 확인
            require('../models/users_model').get_editable_admin_id(data, function (status, msg) {
                if (status) {
                    callback(null);
                } else callback(msg);
            });
        }, function(callback) {
            // use formidable for multipart data
            require('./aws').uploadBannerImage(req, data, function(status, msg, getData) {
                if (status) {
                    data.review_support_id = getData.review_support_id;
                    data.review_content = getData.review_content;
                    data.banner_img = getData.image_url;
                    data.review_title = getData.review_title;
                    // 이름이 필요한가?
                    //data.content_img_name = getData.image_name;
                    callback(null);
                }
                else callback(msg);
            });
        }, function(callback) {
            // 유효성 검사
            var validation = /[0-9a-힣]/;
            var Validator = require('validator');
            if(validation.test(data.review_content)) {  // alphabet, numeric or korean only
                callback(null);
            } else {
                callback("유효값 검사 실패");
            }
        }, function(callback) {
            // 게시물 등록
            require('../models/review_model').postContent(data, function (status, msg, data) {
                if (status) callback(null, data.review_id);
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
            msg: "게시 완료",
            data: { review_id : result }
        });
    });
});

/**
 * Edit review content
 * 게시글 수정
 */
router.put('/:review_id', function(req, res, next) {
    var data = {
        access_token : req.header('access-token'),
        review_id : req.params.review_id
    };

    var review_model = require('../models/review_model');

    async.waterfall([
        function(callback) {
            // 유저 확인
            require('../models/users_model').get_editable_admin_id(data, function (status, msg) {
                if (status) {
                    callback(null);
                } else callback(msg);
            });
        }, function(callback) {
            review_model.getContentDataById(data, function(status, msg, getData) {
                if (status) {
                    callback(null, getData.banner_img);
                } else callback(msg);
            });
        }, function(callback, banner_img) {
            // use formidable for multipart data
            require('./aws').overwriteBannerImage(req, data, banner_img, function(status, msg, getData) {
                if (status) {
                    data.review_support_id = getData.review_support_id;
                    data.review_content = getData.review_content;
                    data.review_title = getData.review_title;
                    data.banner_img = getData.image_url;
                    // 이름이 필요한가?
                    //data.content_img_name = getData.image_name;
                    callback(null);
                }
                else callback(msg);
            });
        }, function(callback) {
            // 유효성 검사
            var validation = /[0-9a-힣]/;
            var Validator = require('validator');
            if(validation.test(data.review_content)) {  // alphabet, numeric or korean only
                callback(null);
            } else {
                callback("유효값 검사 실패");
            }
        }, function(callback) {
            // 게시물 수정 정보 저장
            review_model.putContent(data, function (status, msg) {
                if (status) callback(null);
                else callback(msg);
            });
        }
    ], function(err) {
        if (err) {
            var error = new Error('Not Found');
            error.status = 400;
            console.error(err);
            return next(error);
        }

        res.statusCode = 200;
        res.json({
            status: true,
            msg: "수정 완료",
            data: { review_id : data.review_id }
        });
    });
});

/**
 * Delete raking content
 * 게시글 삭제
 */
router.delete('/:review_id', function(req, res, next) {
    var data = {
        access_token : req.header('access-token'),
        review_id : req.params.review_id
    };

    async.waterfall([
        function(callback) {
            // TODO 게시물 삭제
            // db registration
            require('../models/review_model').deleteContent(data, function (status, msg) {
                if (status) callback(null);
                else callback(msg);
            });
        }
    ], function(err) {
        if (err) {
            var error = new Error('Not Found');
            error.status = 400;
            console.error(err);
            return next(error);
        }

        res.statusCode = 200;
        res.json({
            status: true,
            msg: "삭제 완료"
        });
    });
});

router.get('/:review_id', function(req, res, next) {
    var data = {
        access_token : req.header('access-token'),
        review_id : req.params.review_id
    };

    async.waterfall([
        function(callback) {
            // TODO 게시물 정보 가져옴
            // db registration
            require('../models/review_model').getContentDataById(data, function (status, msg, data) {
                if (status) callback(null, data);
                else callback(msg);
            });
        }
    ], function(err, result) {
        if (err) {
            var error = new Error('Not Found');
            error.status = 401;
            console.error(error);
            return next(error);
        }

        res.statusCode = 200;
        res.json({
            status: true,
            msg: "게시물 가져옴",
            data: result
        });
    });
});

router.get('/:review_id/image', function(req, res, next) {
    require('./aws').getBannerImage(req.query.banner_img, res);
});

module.exports = router;
