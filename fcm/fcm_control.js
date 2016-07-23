/**
 * Created by YS on 2016-06-24.
 */
var firebase = require("firebase");
var request = require('request');
var credentials = require("../credentials.js");

module.exports = function(user_id, category, content_id, callback) {
    var fcm_data = {
        to: "/topics/"+user_id,
        data: {
            message: category+"/"+content_id,
            category: category,
            content_id: content_id
        }
    };

    request.post({
        url: credentials.fcm_url,
        json: fcm_data,
        headers: {
            "Authorization": "key="+ credentials.fcm_server_key
        }
    }, function(err, httpResponse, body) {
        callback(err, httpResponse, body);
    });
};