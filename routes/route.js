var auth = require('../controllers/auth/auth');
var users = require('../controllers/users');
var ranking = require('../controllers/ranking');
var monthly = require('../controllers/monthly');
var reviews = require('../controllers/reviews');
var search = require('../controllers/search');
var contact = require('../controllers/contact');
var support = require('../controllers/support');

var browser = require('./browserCheck');

module.exports = function(app){
  app.get('/redirect', function(req, res, next) {
    if (req._parsedUrl.pathname.split('/')[1] != 'redirect') {
      console.log("췍");
      return next();
    }
    res.render('redirection', { origin: req.query.origin });
  });

  app.all('*', function(req, res, next) {
    browser(req, res, next);
  });

  //app.use('/auth', auth);
  //app.use('/', ranking);
  app.use('/monthly', monthly);
  app.use('/users', users);
  app.use('/ranking', ranking);
  app.use('/reviews', reviews);
  app.use('/contact', contact);
  app.use('/support', support);
  app.use('/search', search);
};
