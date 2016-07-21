/**
 * Created by YS on 2016-07-22.
 */
var express = require('express');
var router = express.Router();
var async = require('async');

router.get('/', function(req, res, next) {
    res.render('redirection');
});

module.exports = router;
