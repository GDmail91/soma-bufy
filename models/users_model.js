/**
 * Created by YS on 2016-07-15.
 */
var credentials = require('../credentials');
var mysql = require('mysql');
var pool = mysql.createPool({
    connectTimeout  : 60 * 60 * 1000,
    timeout         : 60 * 60 * 1000,
    aquireTimeout   : 60 * 60 * 1000,
    host    : credentials.mysql.host,
    port : credentials.mysql.port,
    user : credentials.mysql.user,
    password : credentials.mysql.password,
    database: credentials.mysql.database,
    connectionLimit: 21,
    waitForConnections: false
});

var users_model = {

    joinCheck : function (data, callback) {
        // DB에 유저정보 저장
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });
            connection.beginTransaction(function(err) {
                if (err) throw err;
                var async = require('async');
                async.waterfall([
                    function (tran_callback) {
                        tran_callback(null);
                        // TODO 기존 사용자 로그인중일시 재로그인 알림
                        /*var select = [data.user_id];
                        connection.query("SELECT user_id, token " +
                            "FROM User " +
                            "WHERE user_id = ?", select, function (err, rows) {
                            if (err) {
                                connection.rollback(function () {
                                    console.error('rollback error');
                                    return tran_callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                                });
                            }
                            if (rows.length != 0) tran_callback

                            tran_callback(null);
                        });*/
                    },
                    function (tran_callback) {
                        var insert = [data.user_id, data.access_token, data.username, data.sns, data.phone, data.access_token];
                        connection.query("INSERT INTO User SET " +
                            "`user_id` = ?, " +
                            "`token` = ?, " +
                            "`username` = ?, " +
                            "`sns` = ?, " +
                            "`phone` = ? " +
                            "ON DUPLICATE KEY UPDATE " +
                            "token = ? ", insert, function (err, rows) {

                            console.log(err);
                            console.log(rows);
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
                                return tran_callback(null, { result: true, msg: "회원가입 성공", data: {user_id: rows.insertId}});
                            });
                        });
                    }
                ], function (err, result) {
                    if (err) return { result: false, msg: err };
                    return callback(result.result, result.msg, result.data);
                });
            });
        });
    },

    /**
     * Update users infomation, input user infomation data
     * @param data (JSON) : kakao_id, username, school, age, major, locate, introduce, exp, access_token
     * @param callback (Function)
     */
    updateUser : function (data, callback) {
        // user 정보 수정
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });
            var insert = [data.username, data.phone, data.access_token];
            connection.query('UPDATE User SET ' +
                '`username` = ?, ' +
                '`phone` = ? WHERE token= ?', insert, function (err, rows) {
                if (err) {
                    return callback(false, "정보 수정에 실패했습니다. 원인: "+err);
                } else if(rows.affectedRows == 0) {
                    return callback(false, "정보 수정에 실패했습니다. 원인: 적용되지않음" );
                }
                connection.release();
                return callback(true, "정보 수정에 성공했습니다.");
            });
        });
    },
    /**
     * Authentication of user
     * @param data (JSON) : access_token
     * @param callback (Function)
     */
    auth_user : function (data, callback) {
        // login 정보 확인
        pool.getConnection(function (err, connection) {
            var select = [data.access_token];
            connection.query("SELECT * FROM Users WHERE facebook_access_token = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: "+err });
                }
                connection.release();

                var dummy_data;
                if (rows.length != 0) {
                    dummy_data = {
                        result: true,
                        msg: "인증에 성공했습니다."
                    };
                } else {
                    dummy_data = {
                        result: false,
                        msg: "인증에 실패했습니다."
                    };
                }
                return callback(dummy_data);
            });
        });
    },

    /**
     * Getting user data
     * @param data (JSON) : user_id
     * @param callback (Function)
     */
    getUserData : function(data, callback) {
        // 사용자 정보 가져옴
        pool.getConnection(function (err, connection) {
            var select = [data.user_id];

            connection.query("SELECT user_id, username, sns FROM User WHERE user_id = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: "+err });
                }
                connection.release();

                var dummy_data;
                if (rows.length != 0) {
                    dummy_data = {
                        result: true,
                        msg: "사용자 정보 가져옴",
                        data: rows
                    };
                } else {
                    dummy_data = {
                        result: false,
                        msg: "사용자 정보가 없습니다."
                    };
                }
                return callback(dummy_data.result, dummy_data.msg, dummy_data.data);
            });
        });
    },

    /**
     * Getting user data
     * @param data (JSON) : user_id
     * @param callback (Function)
     */
    getUserDataByToken : function(data, callback) {
        // 사용자 정보 가져옴
        pool.getConnection(function (err, connection) {
            var select = [data.access_token];

            connection.query("SELECT user_id, username, sns FROM User WHERE token = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: "+err });
                }
                connection.release();

                var dummy_data;
                if (rows.length != 0) {
                    dummy_data = {
                        result: true,
                        msg: "사용자 정보 가져옴",
                        data: rows
                    };
                } else {
                    dummy_data = {
                        result: false,
                        msg: "사용자 정보가 없습니다."
                    };
                }
                return callback(dummy_data.result, dummy_data.msg, dummy_data.data);
            });
        });
    },

    /**
     * Get user id
     * @param data (JSON) : access_token
     * @param callback (Function)
     */
    get_user_id : function (data, callback) {
        // 사용자 인증
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: " + err});
            var select = [data.access_token];
            connection.query("SELECT users_id FROM Users WHERE facebook_access_token = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: " + err});
                }
                connection.release();

                if (rows.length != 0) {
                    return callback({ result: true, msg: "사용자 정보 가져왔습니다.", data: { users_id : rows[0].users_id }});
                } else {
                    return callback({ result: false, msg: '잘못된 접근입니다.'});
                }
            });
        });
    },

    /**
     * Get user name by id (array)
     * @param data (JSON Array) users_id
     * @param callback
     */
    get_user_name : function(data, callback) {
        // 사용자 이름 가져옴
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: " + err});

            var sql = "SELECT username FROM Users WHERE facebook_access_token IN (";

            // 선택한 사용자 ID 갯수만큼 WHERE절에 추가
            var length = 0;
            data.forEach(function (val) {
                if(length == 0) sql += val.users_id;
                else sql += "," + val.users_id;
                length ++;
                if (length == data.length) {
                    sql += ")";

                    connection.query(sql, function (err, rows) {
                        if (err) {
                            connection.release();
                            return callback({ result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: " + err});
                        }
                        connection.release();

                        if (rows.length != 0) {
                            return callback({ result: true, msg: "사용자 정보 가져왔습니다.", data: { usersname : rows[0].username }});
                        } else {
                            return callback({ result: false, msg: '사용자 정보가 없습니다.'});
                        }
                    });
                }
            });
        });
    },

    /**
     * Check whether admin or not
     * @param data (JSON) : access_token
     * @param callback (Function)
     */
    get_admin_id : function (data, callback) {
        // 관리자 인증
        pool.getConnection(function (err, connection) {
            if (err) return callback({result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: " + err});
            var select = [data.access_token];
            connection.query("SELECT users_id, admin FROM Users WHERE facebook_access_token = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: " + err});
                }
                connection.release();
                if (rows.length != 0) {
                    if (rows[0].admin) {
                        return callback({result: true, msg: "사용자 정보 가져왔습니다.", data: {users_id: rows[0].users_id}});
                    }

                }
                return callback({result: false, msg: '잘못된 접근입니다.'});
            });
        });
    }
};

module.exports = users_model;