/**
 * Created by YS on 2016-07-14.
 */
var express = require('express');
var router = express.Router();
var async = require('async');

/* POST like the content */
router.post('/:content_id/likes', function(req, res, next) {
    var data = {
        access_token : req.header('access-token'),
        content_id : req.params.content_id
    };

    async.waterfall([
        function(callback) {
            // TODO 유저 정보 가져옴
            // db registration
            require('../models/users_model').getUserDataByToken(data, function (status, msg, data) {
                if (status) callback(null, data.user_id);
                else callback(msg);
            });

        }, function(user_id, callback) {
            data.user_id = user_id;
            require('../models/likes_model').changeLike(data, function(status, msg, data) {
                if (status) callback(null, data); // data에서 좋아요 변경한 결과값 반환
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
            msg: "좋아요 변경",
            data: { is_like: result }
        });
    });
});


router.get('/likes', function(req, res, next) {
    var data = {
        access_token : req.header('access-token')
    };

    async.waterfall([
        function(callback) {
            require('../models/likes_model').getLikesById(data, function(status, msg, data) {
                console.log(msg);
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
            msg: "투표한 목록",
            data: result
        });
    });
});

router.get('/user/:user_id', function(req, res, next) {
    var data = {
        access_token : req.header('access-token'),
        user_id : req.params.user_id
    };

    async.waterfall([
        function(callback) {
            require('../models/ranking_model').getContentDataByUser(data, function(status, msg, data) {
                if (status) callback(null, data);
                else callback(msg);
            });
        }
    ], function(err, result) {
        if (err) {
            // TODO 게시물 정보가 없는 경우 처리
            var error = new Error('Not Found');
            error.status = 400;
            console.error(err);
            return next(error);
        }

        res.statusCode = 200;
        res.json({
            status: true,
            msg: "유저 게시물 가져옴",
            data: result
        });
    });
});

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
            require('../models/ranking_model').getContentData(data, function(status, msg, data) {
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
            msg: "랭킹 리스트",
            data: result
        });
    });
});

/* POST ranking content */
router.post('/', function(req, res, next) {
    var data = {
        'access_token' : req.header('access-token'),
        // body-parser cannot catch multipart
        //content_title : req.body.content_title,
        //description : req.body.description
    };

    async.waterfall([
        function(callback) {
            // 유효성 검사
            var validation = /[0-9a-힣]/;
            var Validator = require('validator');
            if(validation.test(data.content_title)) {  // alphabet, numeric or korean only
                callback(null);
            } else {
                callback("유효값 검사 실패");
            }
        }, function(callback) {
            // 유저 확인
            require('../models/users_model').getUserDataByToken(data, function (status, msg, getData) {
                if (status) {
                    data.user_id = getData.user_id;
                    callback(null);
                } else callback(msg);
            });
        }, function(callback) {
            // use formidable for multipart data
            require('./upload')(req, data, function(status, msg, getData) {
                if (status) {
                    data.content_title = getData.content_title;
                    data.description = getData.description;
                    data.content_img = getData.image_url;
                    // 이름이 필요한가?
                    //data.content_img_name = getData.image_name;
                    callback(null);
                }
                else callback(msg);
            });
        }, function(callback) {
            // 게시물 등록
            require('../models/ranking_model').postContent(data, function (status, msg, data) {
                if (status) callback(null, data.content_id);
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
            data: { content_id : result }
        });
    });
});

/**
 * Edit raking content
 * 게시글 수정
 */
router.put('/:content_id', function(req, res, next) {
    var data = {
        access_token : req.header('access-token'),
        content_id : req.params.content_id,
        content_title : req.body.content_title,
        description : req.body.description,
        content_img : req.body.content_img
    };

    async.waterfall([
        function(callback) {
            // 유효성 검사
            var validation = /[0-9a-힣]/;
            var Validator = require('validator');
            if(validation.test(data.content_title) // alphabet, numeric or korean only
                && Validator.isURL(data.content_img)) { // alphanumeric only
                callback(null);
            } else {
                callback("유효값 검사 실패")
            }
        }, function(callback) {
            // 유저 확인
            require('../models/users_model').getUserDataByToken(data, function (status, msg, getData) {
                if (status) {
                    data.user_id = getData.user_id;
                    callback(null);
                } else callback(msg);
            });
        }, function(callback) {
            require('./upload')(req, data, function(status, msg, getData) {
                if (status) {
                    data.content_img = getData.image_url;
                    // 이름이 필요한가?
                    //data.content_img_name = getData.image_name;
                    callback(null);
                }
                else callback(msg);
            });
        }, function(callback) {
            // 게시물 수정 정보 저장
            require('../models/ranking_model').putContent(data, function (status, msg) {
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
            data: { content_id : data.content_id }
        });
    });
});

/**
 * Delete raking content
 * 게시글 삭제
 */
router.delete('/:content_id', function(req, res, next) {
    var data = {
        access_token : req.header('access-token'),
        content_id : req.params.content_id
    };

    async.waterfall([
        function(callback) {
            // TODO 게시물 삭제
            // db registration
            require('../models/ranking_model').deleteContent(data, function (status, msg) {
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

router.get('/:content_id', function(req, res, next) {
    var data = {
        access_token : req.header('access-token'),
        content_id : req.params.content_id
    };

    async.waterfall([
        function(callback) {
            // TODO 게시물 정보 가져옴
            // db registration
            require('../models/ranking_model').getContentDataById(data, function (status, msg, data) {
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

module.exports = router;
