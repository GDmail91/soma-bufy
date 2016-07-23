/**
 * Created by YS on 2016-07-23.
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

var alarm_model = {

    setAlarm : function (data, callback) {
        // DB에 게시물 저장
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });
            connection.beginTransaction(function(err) {
                if (err) throw err;
                var async = require('async');
                async.waterfall([
                    function (tran_callback) {
                        var select = [data.access_token, data.category, data.content_id];
                        connection.query("SELECT alarm_id " +
                            "FROM Alarm " +
                            "WHERE alarm_user_id = (SELECT user_id FROM User WHERE token = ?) " +
                            "AND alarm_category = ? " +
                            "AND alarm_content_id = ? ", select, function (err, rows) {
                            if (err) {
                                connection.rollback(function () {
                                    console.error('rollback error');
                                    return tran_callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
                                });
                            }

                            return tran_callback(null, rows);
                        });
                    },
                    function (alarm_id, tran_callback) {
                        var insert = [];
                        var sql;
                        if (alarm_id.length == 0) {
                            insert.push(data.access_token);
                            insert.push(data.category);
                            insert.push(data.content_id);
                            sql = "INSERT INTO Alarm SET " +
                                "`alarm_user_id` = (SELECT user_id FROM User WHERE token = ?), " +
                                "`alarm_category` = ?, " +
                                "`alarm_content_id` = ?, " +
                                "`alarm_date` = NOW() ";
                        } else {
                            insert.push(alarm_id);
                            sql = "UPDATE Alarm SET " +
                                "`is_check` = 0, " +
                                "`alarm_date` = NOW() " +
                                "WHERE alarm_id = ? ";
                        }

                        connection.query(sql, insert, function (err, rows) {
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

                                return tran_callback(null, { result: true, msg: "알람 등록 성공", data: {user_id: rows.insertId}});
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

    getAlarm : function (data, callback) {
        // 게시물 수정
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });
            connection.beginTransaction(function(err) {
                if (err) throw err;
                var async = require('async');
                async.waterfall([
                    function (tran_callback) {
                        // TODO 기존 사용자 로그인중일시 재로그인 알림
                        var select = [data.access_token];
                        var sql = "SELECT alarm_id, alarm_user_id, alarm_category, alarm_content_id, RC.content_title, RC.description, RC.content_img " +
                            "FROM Alarm " +
                            "INNER JOIN RankContents AS RC " +
                            "ON Alarm.alarm_content_id = RC.content_id " +
                            "WHERE alarm_user_id = (SELECT user_id FROM User WHERE User.token = ?) ";
                        if (data.start_id) {
                            select.push(data.start_id);
                            select.push(data.amount);
                            sql += "AND alarm_id <= ? " +
                                "ORDER BY alarm_date DESC LIMIT ?"
                        } else {
                            select.push(data.amount);
                            sql += "ORDER BY alarm_date DESC LIMIT ?";
                        }
                        connection.query(sql, select, function (err, rows) {
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
                                if (rows.length != 0) {
                                    return tran_callback(null, rows);
                                } else {
                                    return tran_callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: 알람 없음'});
                                }
                            });
                        });
                    }
                ], function (err, result) {
                    if (err) return callback(false, err);
                    return callback(true, "알람 리스트", result);
                });
            });
        });
    }
};

module.exports = alarm_model;