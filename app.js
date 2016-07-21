var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var errors = require('./routes/error');
var device = require('express-device');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(device.capture());

// route handlers
var browser = require('./routes/browserCheck');

app.get('/redirect', function(req, res, next) {
  res.render('redirection');
});

app.all('*', function(req, res, next) {
  console.log("실행안해?");
  browser(req, res, next);
});

require('./routes/route')(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
app.use(function(err, req, res, next) {
  errors(err, res, app.get('env'));
});

module.exports = app;
