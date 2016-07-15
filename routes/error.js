
/**
 * Created by YS on 2016-07-09.
 */

var errorCode = require('./errorCode');

module.exports = function (err, res, mode) {
    var error = errorCode[err.status];
    if (mode === 'development') {
        // development error handler
        res.status(error.status).json(error);

    } else if (mode === 'production') {
        // production error handler
        res.status(error.status).json(error);
    }
};
