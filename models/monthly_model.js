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

    postMonthlyContent: function (data, callback) {
        // DB에 게시물 저장
        pool.getConnection(function (err, connection) {
            if (err) return callback({result: false, msg: "에러 발생. 원인: " + err});
            connection.beginTransaction(function (err) {
                if (err) throw err;
                var async = require('async');
                async.waterfall([
                    function (tran_callback) {
                        var insert = [data.content_id, data.monthly_title, data.monthly_description, data.monthly_img, data.end_date,
                            data.monthly_title, data.monthly_description, data.monthly_img, data.end_date];
                        connection.query("INSERT INTO MonthlySupport SET " +
                            "`m_support_content_id` = ?, " +
                            "`m_support_title` = ?, " +
                            "`description` = ?, " +
                            "`m_support_img` = ?, " +
                            "`end_date` = ?," +
                            "`post_date` = NOW() " +
                            "ON DUPLICATE KEY UPDATE " +
                            "`m_support_title` = ?, " +
                            "`description` = ?, " +
                            "`m_support_img` = ?, " +
                            "`end_date` = ?", insert, function (err, rows) {
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
                                    msg: "이달의 후원 저장 성공",
                                    data: {content_id: data.content_id}
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

    getMonthlyContent : function (data, callback) {
        pool.getConnection(function (err, connection) {
            var select = [];
            connection.query("SELECT * FROM MonthlySupport " +
                "WHERE end_date >= NOW() " +
                "ORDER BY m_support_content_id DESC", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({result: false, msg: "모집글 정보를 가져오는데 실패했습니다. 원인: " + err});
                }
                connection.release();

                if (rows.length != 0) {
                    return callback(true, "이달의 후원 가져옴", rows[0]);
                } else {
                    return callback(false, "게시글 정보가 없습니다.");
                }
            });
        });
    },

};

module.exports = monthly_model;