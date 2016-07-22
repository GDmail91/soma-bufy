/**
 * Created by YS on 2016-07-22.
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
                        var insert = [data.review_support_id, data.review_title, data.banner_img, data.review_content];
                        connection.query("INSERT INTO Review SET " +
                            "`review_support_id` = ?, " +
                            "`review_title` = ?, " +
                            "`banner_img` = ?, " +
                            "`review_content` = ?, " +
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
                                return tran_callback(null, { result: true, msg: "게시물 저장 성공", data: {review_id: rows.insertId}});
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
                    function (tran_callback) {/*
                        // TODO 게시물 권한 확인
                        var select = [data.access_token];
                        connection.query("SELECT admin_user_id FROM Admin " +
                            "INNER JOIN User " +
                            "ON Admin.admin_user_id = User.user_id " +
                            "WHERE User.token = ?", select, function (err, rows) {
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
                        });*/
                    },
                    function (tran_callback) {
                        var insert = [data.review_support_id, data.review_title, data.banner_img, data.review_content, data.review_id];
                        connection.query("UPDATE Review SET " +
                            "`review_support_id` = ?, " +
                            "`review_title` = ?, " +
                            "`banner_img` = ?, " +
                            "`review_content` = ?, " +
                            "WHERE review_id = ?", insert, function (err) {
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
                        var del = [data.review_id];
                        connection.query("DELETE FROM Review " +
                            "WHERE review_id = ?", del, function (err) {
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
                                return tran_callback(null, { result: true, msg: "게시물 삭제 성공" });
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
            var sql = "SELECT review_id, review_support_id, review_title, banner_img, review_content, Review.post_date, MonthlySupport.donation AS donation " +
                    "FROM Review " +
                "INNER JOIN MonthlySupport " +
                "ON Review.review_support_id = MonthlySupport.m_support_content_id ";

            if (data.start_id == undefined) {
                select.push(data.amount);
                sql += "ORDER BY review_id DESC LIMIT ? ";
            } else {
                select.push(data.start_id);
                select.push(data.amount);
                sql += "review_id <= ? ORDER BY review_id DESC LIMIT ? ";
            }

            connection.query(sql, select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({result: false, msg: "후기 정보를 가져오는데 실패했습니다. 원인: " + err});
                }
                connection.release();

                if (rows.length != 0) {
                    return callback(true, "후기 목록 가져옴", rows);
                } else {
                    return callback(false, "후기 정보가 없습니다.");
                }
            });
        });
    },

    getContentDataById : function (data, callback) {
        pool.getConnection(function (err, connection) {
            var select=[data.review_id];
            var sql = "SELECT review_id, review_support_id, review_title, banner_img, review_content, Review.post_date, MonthlySupport.donation AS donation " +
                "FROM Review " +
                "INNER JOIN MonthlySupport " +
                "ON Review.review_support_id = MonthlySupport.m_support_content_id " +
                "WHERE review_id = ?";


            connection.query(sql, select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({result: false, msg: "후기 정보를 가져오는데 실패했습니다. 원인: " + err});
                }
                connection.release();

                if (rows.length != 0) {
                    return callback(true, "후기 가져옴", rows[0]);
                } else {
                    return callback(false, "후기 정보가 없습니다.");
                }
            });
        });
    },
};

module.exports = ranking_model;