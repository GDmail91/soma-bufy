/**
 * Created by YS on 2016-07-15.
 */
var credentials = require('../credentials');
var mysql = require('mysql');
var pool = mysql.createPool({
    aquireTimeout   : 60 * 60 * 1000,
    host    : credentials.mysql.host,
    port : credentials.mysql.port,
    user : credentials.mysql.user,
    password : credentials.mysql.password,
    database: credentials.mysql.database,
    connectionLimit: 21,
    waitForConnections: false
});

var ranking_model = {

    postContent : function (data, callback) {
        // DB에 게시물 저장
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });
            connection.beginTransaction(function(err) {
                if (err) throw err;
                var async = require('async');
                async.waterfall([
                    function (tran_callback) {
                        // TODO 기존 사용자 로그인중일시 재로그인 알림
                        return tran_callback(null);
                    },
                    function (tran_callback) {
                        var insert = [data.access_token, data.content_title, data.description, data.content_img];
                        connection.query("INSERT INTO RankContents SET " +
                            "`content_user_id` = (SELECT user_id FROM User WHERE token = ?), " +
                            "`content_title` = ?, " +
                            "`description` = ?, " +
                            "`content_img` = ?, " +
                            "`post_date` = NOW()", insert, function (err, rows) {
                            if (err) {
                                connection.rollback(function () {
                                    console.error('rollback error');
                                    return tran_callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
                                });
                            }
                            connection.release();
                            connection.commit(function (err) {
                                if (err) {
                                    console.error(err);
                                    connection.rollback(function () {
                                        console.error('rollback error');
                                        throw err;
                                    });
                                    return tran_callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                                }
                                return tran_callback(null, { result: true, msg: "게시물 저장 성공", data: {content_id: rows.insertId}});
                            });
                        });
                    }
                ], function (err, result) {
                    if (err) return callback(false, err);
                    return callback(result.result, result.msg, result.data);
                });
            });
        });
    },

    putContent : function (data, callback) {
        // 게시물 수정
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });
            connection.beginTransaction(function(err) {
                if (err) throw err;
                var async = require('async');
                async.waterfall([
                    function (tran_callback) {
                        // TODO 게시물 권한 확인
                        var select = [data.access_token];
                        connection.query("SELECT content_id " +
                            "FROM RankContents " +
                            "WHERE content_user_id = " +
                            "(SELECT user_id FROM User WHERE User.token = ?)", select, function (err, rows) {
                            if (err) {
                                connection.rollback(function () {
                                    console.error('rollback error');
                                    return tran_callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                                });
                            }
                            if (rows.length != 0) {
                                tran_callback(null);
                            } else {
                                connection.rollback(function () {
                                    console.error('rollback error');
                                    return tran_callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: 인증 실패'});
                                });
                            }
                        });
                    },
                    function (tran_callback) {
                        var insert = [data.content_title, data.description, data.content_img, data.content_id];
                        connection.query("UPDATE RankContents SET " +
                            "`content_title` = ?, " +
                            "`description` = ?, " +
                            "`content_img` = ? " +
                            "WHERE content_id = ?", insert, function (err) {
                            if (err) {
                                connection.rollback(function () {
                                    console.error('rollback error');
                                    return tran_callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
                                });
                            }
                            connection.release();
                            connection.commit(function (err) {
                                if (err) {
                                    console.error(err);
                                    connection.rollback(function () {
                                        console.error('rollback error');
                                        throw err;
                                    });
                                    return tran_callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                                }
                                return tran_callback(null, { result: true, msg: "게시물 저장 성공" });
                            });
                        });
                    }
                ], function (err, result) {
                    if (err) return callback(false, err);
                    return callback(result.result, result.msg);
                });
            });
        });
    },


    deleteContent : function (data, callback) {
        // 게시물 삭제
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });
            connection.beginTransaction(function(err) {
                if (err) throw err;
                var async = require('async');
                async.waterfall([
                    function (tran_callback) {
                        // TODO 기존 사용자 로그인중일시 재로그인 알림
                        var select = [data.access_token];
                        connection.query("SELECT content_id " +
                            "FROM RankContents " +
                            "WHERE content_user_id = " +
                            "(SELECT user_id FROM User WHERE User.token = ?)", select, function (err, rows) {
                            if (err) {
                                connection.rollback(function () {
                                    console.error('rollback error');
                                    return tran_callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                                });
                            }
                            if (rows.length != 0) {
                                tran_callback(null);
                            } else
                                tran_callback({result: false, msg: '처리중 오류가 발생했습니다.' });
                        });
                    },
                    function (tran_callback) {
                        var insert = [data.content_id];
                        connection.query("DELETE FROM RankContents " +
                            "WHERE content_id = ?", insert, function (err) {
                            if (err) {
                                connection.rollback(function () {
                                    console.error('rollback error');
                                    return tran_callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
                                });
                            }
                            connection.release();
                            connection.commit(function (err) {
                                if (err) {
                                    console.error(err);
                                    connection.rollback(function () {
                                        console.error('rollback error');
                                        throw err;
                                    });
                                    return tran_callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                                }
                                return tran_callback(null, { result: true, msg: "게시물 저장 성공" });
                            });
                        });
                    }
                ], function (err, result) {
                    if (err) return callback(false, err);
                    return callback(result.result, result.msg);
                });
            });
        });
    },

    getContentData : function (data, callback) {
        // 게시물 리스트 가져오기 (랭킹순)
        pool.getConnection(function (err, connection) {
            var select=[];
            var sql;
            if (typeof data.access_token == 'undefined') {
                sql = "SELECT content_id, content_user_id, content_title, description, content_img, like_count, view_count, post_date, is_finish " +
                    "FROM RankContents ";
            } else {
                select.push(data.access_token);
                sql = "SELECT content_id, content_user_id, content_title, description, content_img, like_count, view_count, post_date, is_finish, " +
                    "(SELECT COUNT(like_content_id) FROM LikeTable WHERE like_user_id = User.user_id AND like_content_id = RankContents.content_id) AS is_like " +
                    "FROM RankContents " +
                    "INNER JOIN User ON User.token = ? ";
            }
            if (data.start_id == undefined) {
                select.push(data.amount);
                sql += "ORDER BY post_date DESC LIMIT ? ";
            } else {
                select.push(data.start_id);
                select.push(data.amount);
                sql += "WHERE content_id <= ? ORDER BY post_date DESC LIMIT ? ";
            }

            connection.query(sql, select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({result: false, msg: "모집글 정보를 가져오는데 실패했습니다. 원인: " + err});
                }
                connection.release();

                if (rows.length != 0) {
                    return callback(true, "게시글 목록 가져옴", rows);
                } else {
                    return callback(false, "게시글 정보가 없습니다.");
                }
            });
        });
    },

    getContentDataById : function (data, callback) {
        pool.getConnection(function (err, connection) {
            var select=[];
            var sql;
            if (typeof data.access_token == 'undefined') {
                sql = "SELECT content_id, content_user_id, content_title, description, content_img, like_count, view_count, post_date, is_finish " +
                    "FROM RankContents ";
            } else {
                select.push(data.access_token);
                sql = "SELECT content_id, content_user_id, content_title, description, content_img, like_count, view_count, post_date, is_finish, " +
                    "(SELECT COUNT(like_content_id) FROM LikeTable WHERE like_user_id = User.user_id AND like_content_id = RankContents.content_id) AS is_like " +
                    "FROM RankContents " +
                    "INNER JOIN User ON User.token = ? ";
            }

            select.push(data.content_id);
            sql += "WHERE RankContents.content_id = ?";

            connection.query(sql, select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({result: false, msg: "모집글 정보를 가져오는데 실패했습니다. 원인: " + err});
                }
                connection.release();

                if (rows.length != 0) {
                    return callback(true, "게시물 가져옴", rows[0]);
                } else {
                    return callback(false, "게시글 정보가 없습니다.");
                }
            });
        });
    },

    getContentDataByUser : function (data, callback) {
        pool.getConnection(function (err, connection) {
            var select=[];
            var sql;
            if (typeof data.access_token == 'undefined') {
                sql = "SELECT content_id, content_user_id, content_title, description, content_img, like_count, view_count, post_date, is_finish " +
                    "FROM RankContents ";
            } else {
                select.push(data.access_token);
                sql = "SELECT content_id, content_user_id, content_title, description, content_img, like_count, view_count, post_date, is_finish, " +
                    "(SELECT COUNT(like_content_id) FROM LikeTable WHERE like_user_id = User.user_id AND like_content_id = RankContents.content_id) AS is_like " +
                    "FROM RankContents " +
                    "INNER JOIN User ON User.token = ? ";
            }

            select.push(data.user_id);
            sql += "WHERE RankContents.content_user_id = ?";

            connection.query(sql, select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback(false, "모집글 정보를 가져오는데 실패했습니다. 원인: " + err);
                }
                connection.release();

                if (rows.length != 0) {
                    return callback(true, "게시물 가져옴", rows);
                } else {
                    return callback(false, "게시글 정보가 없습니다.");
                }
            });
        });
    },
};

module.exports = ranking_model;