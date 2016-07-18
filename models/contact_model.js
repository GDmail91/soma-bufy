/**
 * Created by YS on 2016-07-18.
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

var monthly_model = {

    postQuestion: function (data, callback) {
        // DB에 게시물 저장
        pool.getConnection(function (err, connection) {
            if (err) return callback({result: false, msg: "에러 발생. 원인: " + err});
            connection.beginTransaction(function (err) {
                if (err) throw err;
                var async = require('async');
                async.waterfall([
                    function (tran_callback) {
                        var insert = [data.access_token, data.question];
                        connection.query("INSERT INTO Contact SET " +
                            "`contact_user_id` = (SELECT user_id FROM User WHERE token = ?), " +
                            "`question` = ?, " +
                            "`post_date` = NOW() ", insert, function (err) {
                            if (err) {
                                connection.rollback(function () {
                                    console.error('rollback error');
                                    return tran_callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
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
                                return tran_callback(null, {
                                    result: true,
                                    msg: "문의 등록 완료"
                                });
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

    getQuestions : function (data, callback) {
        pool.getConnection(function (err, connection) {
            var select;
            var sql;
            if (typeof data.start_id == 'undefined') {
                select = [data.amount];
                sql = "SELECT * FROM Contact " +
                    "ORDER BY post_date DESC LIMIT ?";
            } else {
                select = [data.start_id, data.amount];
                sql = "SELECT * FROM Contact " +
                    "WHERE id <= ? " +
                    "ORDER BY post_date DESC LIMIT ?"
            }
            connection.query(sql, select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback(false, "문의글 정보를 가져오는데 실패했습니다. 원인: " + err);
                }
                connection.release();

                if (rows.length != 0) {
                    return callback(true, "문의글 가져옴", rows);
                } else {
                    return callback(false, "문의글 정보가 없습니다.");
                }
            });
        });
    },

};

module.exports = monthly_model;